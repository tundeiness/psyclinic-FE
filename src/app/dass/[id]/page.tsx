"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchMyDassAssessment,
  saveDassDraft,
  submitDassAssessment,
  ClientDassAssessment,
  DassDraftPatch,
} from "@/lib/dassApi";
import {
  DASS_ITEMS,
  LIKERT_OPTIONS,
  SEVERITY_LABEL,
  SEVERITY_CLASSES,
} from "@/lib/dassItems";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Phase 17.3: DASS-42 questionnaire. Single-page all-42-items layout
// (Q5 confirmed). Each item shows the canonical wording (placeholder
// until Cerca confirms) and four Likert radios. Save draft persists
// what's currently filled; Submit requires all 42 answered and
// signs-and-locks the record.
//
// Per Q7, after submission the client sees severity bands but NOT
// the raw numeric scores. The backend serialization enforces this;
// this page just renders whatever the backend gave us.
export default function DassFillPage() {
  const { ready } = useRequireRole("client");
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [record, setRecord] = useState<ClientDassAssessment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState<"saving" | "submitting" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchMyDassAssessment(id);
      setRecord(r);
      if (r) {
        // Hydrate local responses from any saved item_N values.
        const next: Record<number, number> = {};
        for (let n = 1; n <= 42; n++) {
          const v = r[`item_${n}` as `item_${number}`];
          if (typeof v === "number") next[n] = v;
        }
        setResponses(next);
      }
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load this assessment.");
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const locked = !!record?.signed;
  const completedCount = Object.keys(responses).length;
  const allComplete = completedCount === 42;

  function pickAnswer(n: number, value: number) {
    if (locked) return;
    setResponses((prev) => ({ ...prev, [n]: value }));
  }

  // Build a payload of only the items the user has answered. The
  // backend tolerates partial patches; nil item columns stay nil.
  function buildPatch(): DassDraftPatch {
    const patch: DassDraftPatch = {};
    for (const [n, v] of Object.entries(responses)) {
      patch[`item_${Number(n)}` as `item_${number}`] = v;
    }
    return patch;
  }

  async function onSaveDraft() {
    if (locked) return;
    setBusy("saving");
    setError(null);
    try {
      const updated = await saveDassDraft(id, buildPatch());
      setRecord(updated);
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
    if (!allComplete) {
      const msg = `Please answer all 42 items before submitting. ${completedCount}/42 completed.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    setBusy("submitting");
    setError(null);
    try {
      const submitted = await submitDassAssessment(id, buildPatch());
      setRecord(submitted);
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
          href="/dass"
          className="mt-4 inline-block text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to DASS-42 list
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/dass"
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to assessments
      </Link>

      <h1 className="mb-1 mt-4 text-xl font-semibold text-slate-800 sm:text-2xl">
        DASS-42
      </h1>
      <p className="mb-2 text-sm text-slate-500">
        Please read each statement and select the response that best
        indicates how much each statement applied to you{" "}
        <strong>over the past week</strong>. There are no right or wrong
        answers. Don&apos;t spend too long on any item.
      </p>

      {!locked && (
        <p className="mb-6 text-xs text-slate-500">
          Progress: {completedCount} of 42 answered
        </p>
      )}

      {error && (
        <div className="mb-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {locked && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            Thank you — your assessment has been submitted.
          </p>
          {record.signed_at && (
            <p className="mt-1 text-xs text-emerald-700">
              Submitted on{" "}
              {new Date(record.signed_at).toLocaleDateString()} at{" "}
              {new Date(record.signed_at).toLocaleTimeString()}
            </p>
          )}
          <SeveritySummary record={record} />
          <p className="mt-3 text-xs text-emerald-700">
            Your therapist will review the full results with you.
          </p>
        </Card>
      )}

      <ol className="space-y-4">
        {DASS_ITEMS.map((item) => {
          const selected = responses[item.number];
          return (
            <li key={item.number}>
              <Card>
                <p className="text-sm font-medium text-slate-800">
                  <span className="mr-2 text-slate-400">{item.number}.</span>
                  {item.text}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {LIKERT_OPTIONS.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                          isSelected
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        } ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`item_${item.number}`}
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => pickAnswer(item.number, opt.value)}
                          disabled={locked}
                          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-600"
                        />
                        <span>
                          <span className="font-semibold">{opt.value}</span>{" "}
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {!locked && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={onSaveDraft} disabled={busy !== null}>
            {busy === "saving" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={busy !== null || !allComplete}
            variant="primary"
            title={
              !allComplete
                ? `Answer all 42 items first (${completedCount}/42 done).`
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

function SeveritySummary({ record }: { record: ClientDassAssessment }) {
  // Per Q7: severity bands visible to client, raw scores hidden.
  const bands: Array<{ label: string; severity: string | null }> = [
    { label: "Depression", severity: record.depression_severity },
    { label: "Anxiety", severity: record.anxiety_severity },
    { label: "Stress", severity: record.stress_severity },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {bands.map((b) => (
        <SeverityBadge key={b.label} label={b.label} severity={b.severity} />
      ))}
    </div>
  );
}

function SeverityBadge({
  label,
  severity,
}: {
  label: string;
  severity: string | null;
}) {
  if (!severity) return null;
  const styles =
    SEVERITY_CLASSES[severity] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${styles}`}
    >
      <span className="font-bold">{label}:</span>
      <span>{SEVERITY_LABEL[severity] ?? severity}</span>
    </span>
  );
}
