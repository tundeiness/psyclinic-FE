"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchClientDassAssessment,
  downloadDassPdf,
  TherapistDassAssessment,
} from "@/lib/therapistApi";
import {
  DASS_ITEMS,
  LIKERT_OPTIONS,
  SEVERITY_LABEL,
  SEVERITY_CLASSES,
} from "@/lib/dassItems";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Phase 17.4: therapist's read view of a single DASS-42 assessment.
// Shows raw subscale scores (hidden from client by API), severity
// bands, item-by-item responses, and a Download PDF button.
export default function TherapistDassDetailPage() {
  const { ready } = useRequireRole("therapist");
  const toast = useToast();
  const params = useParams<{ id: string; assessmentId: string }>();
  const clientId = Number(params.id);
  const assessmentId = Number(params.assessmentId);

  const [record, setRecord] = useState<TherapistDassAssessment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchClientDassAssessment(clientId, assessmentId);
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
      const blob = await downloadDassPdf(clientId, assessmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dass-${assessmentId}.pdf`;
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
          href={`/therapist/clients/${clientId}/dass`}
          className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to DASS history
        </Link>
        <div className="mt-4">
          <Alert kind="error">{error ?? "Assessment not available."}</Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/therapist/clients/${clientId}/dass`}
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to DASS history
      </Link>

      <div className="mb-1 mt-4 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
          DASS-42 assessment
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

      <Card className="mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Subscale scores
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SubscaleBlock
            label="Depression"
            score={record.depression_score}
            severity={record.depression_severity}
          />
          <SubscaleBlock
            label="Anxiety"
            score={record.anxiety_score}
            severity={record.anxiety_severity}
          />
          <SubscaleBlock
            label="Stress"
            score={record.stress_score}
            severity={record.stress_severity}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Item responses
        </h2>
        <p className="mt-2 text-xs italic text-slate-500">
          Response scale: {LIKERT_OPTIONS.map((o) => `${o.value} = ${o.label}`).join(" · ")}.
        </p>
        <ul className="mt-3 divide-y divide-slate-100">
          {DASS_ITEMS.map((item) => {
            const response = record[`item_${item.number}` as `item_${number}`];
            return (
              <li
                key={item.number}
                className="flex items-start gap-3 py-2 text-sm"
              >
                <span className="w-6 flex-shrink-0 font-semibold text-slate-400">
                  {item.number}.
                </span>
                <span className="flex-1 text-slate-700">{item.text}</span>
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
      </Card>
    </main>
  );
}

function SubscaleBlock({
  label,
  score,
  severity,
}: {
  label: string;
  score: number | null;
  severity: string | null;
}) {
  const styles =
    (severity && SEVERITY_CLASSES[severity]) ??
    "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <div
      className={`rounded-xl px-4 py-3 ring-1 ${styles}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{score ?? "—"}</p>
      <p className="text-xs font-medium">
        {severity ? SEVERITY_LABEL[severity] ?? severity : "—"}
      </p>
    </div>
  );
}
