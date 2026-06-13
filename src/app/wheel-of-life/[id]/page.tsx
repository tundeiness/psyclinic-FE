"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Button, Card, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchMyWheelOfLifeAssessment,
  saveWheelOfLifeDraft,
  submitWheelOfLifeAssessment,
  WheelOfLifeAssessment,
  WolPatchInput,
  WolScores,
} from "@/lib/wheelOfLifeApi";
import {
  WOL_AREAS,
  REFLECTION_QUESTIONS,
  LIKERT_LABEL_LOW,
  LIKERT_LABEL_HIGH,
} from "@/lib/wheelOfLifeItems";
import { WheelOfLifeChart } from "@/components/WheelOfLifeChart";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Phase 18.2: WoL fill page. Per Q1, each item renders as 10
// horizontal radio buttons (1-10) for the "paper form" feel.
// After submission the page locks and shows the radial chart plus
// per-area totals.

const TOTAL_ITEMS = 39;

// Build a local state shape matching the backend's score format —
// keys are area_key, values are arrays of (number|null) sized to
// each area's item count.
function emptyScores(): WolScores {
  const out: WolScores = {};
  for (const area of WOL_AREAS) {
    out[area.key] = Array(area.items.length).fill(null);
  }
  return out;
}

function countAnswered(scores: WolScores): number {
  let n = 0;
  for (const items of Object.values(scores)) {
    for (const v of items) if (typeof v === "number") n++;
  }
  return n;
}

export default function WolFillPage() {
  const { ready } = useRequireRole("client");
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [record, setRecord] = useState<WheelOfLifeAssessment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scores, setScores] = useState<WolScores>(emptyScores);
  const [reflections, setReflections] = useState({
    focus_area: "",
    current_state: "",
    whats_missing: "",
    what_to_create: "",
  });
  const [busy, setBusy] = useState<"saving" | "submitting" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback((r: WheelOfLifeAssessment) => {
    // Initialize from server response, defaulting any missing area
    // to its all-nil shape so the UI never crashes on a sparse
    // payload.
    const next: WolScores = emptyScores();
    for (const area of WOL_AREAS) {
      const serverItems = r.scores?.[area.key];
      if (Array.isArray(serverItems)) {
        for (let i = 0; i < area.items.length; i++) {
          const v = serverItems[i];
          next[area.key][i] = typeof v === "number" ? v : null;
        }
      }
    }
    setScores(next);
    setReflections({
      focus_area: r.focus_area ?? "",
      current_state: r.current_state ?? "",
      whats_missing: r.whats_missing ?? "",
      what_to_create: r.what_to_create ?? "",
    });
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchMyWheelOfLifeAssessment(id);
      setRecord(r);
      if (r) hydrate(r);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load this assessment.");
    } finally {
      setLoaded(true);
    }
  }, [id, hydrate]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const locked = !!record?.signed;
  const answered = countAnswered(scores);
  const allAnswered = answered === TOTAL_ITEMS;

  function pickAnswer(areaKey: string, itemIndex: number, value: number) {
    if (locked) return;
    setScores((prev) => {
      const next = { ...prev };
      const arr = [...(next[areaKey] || [])];
      arr[itemIndex] = value;
      next[areaKey] = arr;
      return next;
    });
  }

  function buildPatch(): WolPatchInput {
    // Only send areas the user has touched at least one item in.
    // The backend's per-area "full array" merge means each touched
    // area sends its full 4-5-item array regardless.
    const touched: WolScores = {};
    for (const area of WOL_AREAS) {
      const items = scores[area.key];
      if (items?.some((v) => v !== null)) {
        touched[area.key] = items;
      }
    }
    return {
      scores: touched,
      ...reflections,
    };
  }

  async function onSaveDraft() {
    if (locked) return;
    setBusy("saving");
    setError(null);
    try {
      const updated = await saveWheelOfLifeDraft(id, buildPatch());
      setRecord(updated);
      hydrate(updated);
      toast.success("Draft saved");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not save your draft.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit() {
    if (locked) return;
    if (!allAnswered) {
      const msg = `Please answer all ${TOTAL_ITEMS} items before submitting. ${answered}/${TOTAL_ITEMS} completed.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    setBusy("submitting");
    setError(null);
    try {
      // For submit we need to send EVERY area's full array — the
      // backend revalidates completeness after applying the patch.
      const submitted = await submitWheelOfLifeAssessment(id, {
        scores,
        ...reflections,
      });
      setRecord(submitted);
      hydrate(submitted);
      toast.success("Assessment submitted");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not submit the assessment.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  if (!ready || !loaded) return <LoadingState />;

  if (!record) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Alert kind="error">
          This assessment could not be found, or you don&apos;t have permission
          to view it.
        </Alert>
        <Link
          href="/wheel-of-life"
          className="mt-4 inline-block text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to Wheel of Life list
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/wheel-of-life"
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to assessments
      </Link>

      <h1 className="mb-1 mt-4 text-xl font-semibold text-slate-800 sm:text-2xl">
        Wheel of Life
      </h1>
      <p className="mb-2 text-sm text-slate-500">
        Rank each of the statements below on a scale from 1 (Highly
        Disagree) to 10 (Highly Agree). There are no right or wrong
        answers — answer as a snapshot of how things feel right now.
      </p>

      {!locked && (
        <p className="mb-6 text-xs text-slate-500">
          Progress: {answered} of {TOTAL_ITEMS} answered
        </p>
      )}

      {error && (
        <div className="mb-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {locked && record.totals && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            Thank you — your Wheel of Life has been submitted.
          </p>
          {record.signed_at && (
            <p className="mt-1 mb-3 text-xs text-emerald-700">
              Submitted on{" "}
              {new Date(record.signed_at).toLocaleDateString()} at{" "}
              {new Date(record.signed_at).toLocaleTimeString()}
            </p>
          )}
          <div className="mt-4">
            <WheelOfLifeChart totals={record.totals} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {WOL_AREAS.map((area) => {
              const t = record.totals[area.key];
              if (!t) return null;
              return (
                <div
                  key={area.key}
                  className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-emerald-900">
                    {area.label}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {t.total}/{t.max} ({t.percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Areas with items */}
      <div className="space-y-5">
        {WOL_AREAS.map((area, areaIdx) => (
          <section
            key={area.key}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-slate-800">
              {area.label}{" "}
              <span className="font-normal text-slate-400">
                ({areaIdx + 1} of {WOL_AREAS.length})
              </span>
            </h2>
            <p className="mt-0.5 text-xs italic text-slate-500">
              1 ({LIKERT_LABEL_LOW}) to 10 ({LIKERT_LABEL_HIGH})
            </p>

            <ol className="mt-3 space-y-3">
              {area.items.map((itemText, itemIdx) => {
                const current = scores[area.key]?.[itemIdx] ?? null;
                return (
                  <li key={itemIdx} className="border-t border-slate-100 pt-3">
                    <p className="text-sm text-slate-700">{itemText}</p>
                    <div
                      role="radiogroup"
                      aria-label={`${area.label} item ${itemIdx + 1}`}
                      className="mt-2 flex flex-wrap gap-1.5"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
                        const selected = current === v;
                        return (
                          <label
                            key={v}
                            className={`relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition ${
                              selected
                                ? "border-brand-500 bg-brand-500 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            } ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`${area.key}_${itemIdx}`}
                              value={v}
                              checked={selected}
                              onChange={() =>
                                pickAnswer(area.key, itemIdx, v)
                              }
                              disabled={locked}
                              className="sr-only"
                            />
                            {v}
                          </label>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* Reflection questions */}
      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Reflection</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Optional, but worth pausing on once you&apos;ve finished the
          ratings.
        </p>
        <div className="mt-3 space-y-4">
          {REFLECTION_QUESTIONS.map((q) => (
            <label key={q.key} className="block">
              <span className="text-sm font-medium text-slate-700">
                {q.question}
              </span>
              <textarea
                rows={3}
                value={(reflections as Record<string, string>)[q.key]}
                onChange={(e) =>
                  setReflections((prev) => ({
                    ...prev,
                    [q.key]: e.target.value,
                  }))
                }
                disabled={locked || busy !== null}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </label>
          ))}
        </div>
      </section>

      {!locked && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={onSaveDraft} disabled={busy !== null}>
            {busy === "saving" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={busy !== null || !allAnswered}
            variant="primary"
            title={
              !allAnswered
                ? `Answer all ${TOTAL_ITEMS} items first (${answered}/${TOTAL_ITEMS} done).`
                : undefined
            }
          >
            {busy === "submitting" ? "Submitting…" : "Submit assessment"}
          </Button>
        </div>
      )}
    </main>
  );
}
