"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchClientWheelOfLifeAssessment,
  downloadWheelOfLifePdf,
  TherapistWolAssessment,
} from "@/lib/therapistApi";
import { WOL_AREAS, REFLECTION_QUESTIONS } from "@/lib/wheelOfLifeItems";
import { WheelOfLifeChart } from "@/components/WheelOfLifeChart";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Phase 18.3: therapist's read view of a single Wheel of Life
// assessment. Shows the radial chart, per-area scores+items, the
// client's reflection answers, and a Download PDF button.
export default function TherapistWolDetailPage() {
  const { ready } = useRequireRole(["therapist", "admin"]);
  const toast = useToast();
  const params = useParams<{ id: string; assessmentId: string }>();
  const clientId = Number(params.id);
  const assessmentId = Number(params.assessmentId);

  const [record, setRecord] = useState<TherapistWolAssessment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchClientWheelOfLifeAssessment(clientId, assessmentId);
      setRecord(r);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "not_found"
            ? "This assessment was not found or has not been submitted yet."
            : e.message
          : "Could not load this assessment."
      );
    } finally {
      setLoaded(true);
    }
  }, [clientId, assessmentId]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onDownloadPdf() {
    if (!record) return;
    setPdfBusy(true);
    setError(null);
    try {
      const blob = await downloadWheelOfLifePdf(clientId, assessmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wheel-of-life-${assessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not download PDF.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPdfBusy(false);
    }
  }

  if (!ready || !loaded) return <LoadingState />;

  if (!record) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link
          href={`/therapist/clients/${clientId}/wheel-of-life`}
          className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to Wheel of Life history
        </Link>
        <div className="mt-4">
          <Alert kind="error">{error ?? "Assessment not available."}</Alert>
        </div>
      </main>
    );
  }

  const hasReflections =
    !!record.focus_area ||
    !!record.current_state ||
    !!record.whats_missing ||
    !!record.what_to_create;

  const reflectionFields: Record<string, string | null> = {
    focus_area: record.focus_area,
    current_state: record.current_state,
    whats_missing: record.whats_missing,
    what_to_create: record.what_to_create,
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/therapist/clients/${clientId}/wheel-of-life`}
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to Wheel of Life history
      </Link>

      <div className="mb-1 mt-4 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
          Wheel of Life assessment
        </h1>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={pdfBusy}
          className="rounded-xl border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pdfBusy ? "Preparing…" : "Download PDF"}
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Submitted{" "}
        {record.signed_at
          ? new Date(record.signed_at).toLocaleString()
          : "(unknown)"}
        {record.author_name ? ` by ${record.author_name}` : ""}.
      </p>

      {error && (
        <div className="mb-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* Radial chart */}
      <Card className="mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Wheel
        </h2>
        <div className="mt-3">
          <WheelOfLifeChart totals={record.totals} />
        </div>
      </Card>

      {/* Summary table */}
      <Card className="mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Summary
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {WOL_AREAS.map((area) => {
            const t = record.totals?.[area.key];
            if (!t) return null;
            return (
              <div
                key={area.key}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-700">
                  {area.label}
                </span>
                <span className="font-semibold text-brand-700">
                  {t.total}/{t.max} ({t.percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Items per area */}
      <Card className="mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Item responses
        </h2>
        <p className="mt-2 text-xs italic text-slate-500">
          Scale: 1 (Highly Disagree) to 10 (Highly Agree).
        </p>
        <div className="mt-3 space-y-5">
          {WOL_AREAS.map((area) => {
            const responses = record.scores?.[area.key] ?? [];
            return (
              <section key={area.key}>
                <p className="text-sm font-semibold text-brand-700">
                  {area.label}
                </p>
                <ul className="mt-1 divide-y divide-slate-100">
                  {area.items.map((itemText, idx) => {
                    const response = responses[idx];
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-3 py-2 text-sm"
                      >
                        <span className="w-6 flex-shrink-0 font-semibold text-slate-400">
                          {idx + 1}.
                        </span>
                        <span className="flex-1 text-slate-700">{itemText}</span>
                        <span
                          className={`w-8 flex-shrink-0 rounded-md text-center font-semibold ${
                            response == null
                              ? "bg-slate-50 text-slate-400"
                              : "bg-brand-50 text-brand-700"
                          }`}
                        >
                          {response ?? "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </Card>

      {/* Reflection answers */}
      {hasReflections && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Reflection
          </h2>
          <div className="mt-3 space-y-4">
            {REFLECTION_QUESTIONS.map((q) => {
              const answer = reflectionFields[q.key];
              if (!answer) return null;
              return (
                <div key={q.key}>
                  <p className="text-sm font-medium text-brand-700">
                    {q.question}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {answer}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </main>
  );
}
