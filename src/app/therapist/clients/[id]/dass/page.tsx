"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  listClientDassAssessments,
  TherapistDassAssessment,
} from "@/lib/therapistApi";
import { SEVERITY_LABEL, SEVERITY_CLASSES } from "@/lib/dassItems";
import { isApiError } from "@/lib/apiError";

// Phase 17.4: therapist read view of a client's DASS-42 history.
// Drafts are excluded by the backend (the client hasn't shared them
// yet). The therapist sees raw subscale scores + severity bands;
// click into a row for full item-by-item breakdown.
export default function TherapistDassListPage() {
  const { ready } = useRequireRole("therapist");
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [list, setList] = useState<TherapistDassAssessment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const records = await listClientDassAssessments(clientId);
      setList(records);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You don't have access to this client's DASS assessments."
            : e.message
          : "Could not load DASS history."
      );
    }
  }, [clientId]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  if (!ready) return <LoadingState />;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/therapist/clients/${clientId}`}
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to client
      </Link>

      <h1 className="mb-1 mt-4 text-xl font-semibold text-slate-800 sm:text-2xl">
        DASS-42 assessments
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Submitted self-report assessments, most recent first. Draft
        assessments are private to the client until submitted.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {list && list.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            This client hasn&apos;t submitted any DASS-42 assessments yet.
          </p>
        </Card>
      )}

      {list && list.length > 0 && (
        <ul className="space-y-3">
          {list.map((d) => (
            <li key={d.id}>
              <Link
                href={`/therapist/clients/${clientId}/dass/${d.id}`}
                className="block no-underline"
              >
                <Card className="transition hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {d.signed_at
                          ? new Date(d.signed_at).toLocaleDateString()
                          : d.assessment_date}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Submitted{" "}
                        {d.signed_at
                          ? new Date(d.signed_at).toLocaleString()
                          : "(unknown)"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-brand-700">
                      View details →
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ScoreBadge
                      label="Depression"
                      score={d.depression_score}
                      severity={d.depression_severity}
                    />
                    <ScoreBadge
                      label="Anxiety"
                      score={d.anxiety_score}
                      severity={d.anxiety_severity}
                    />
                    <ScoreBadge
                      label="Stress"
                      score={d.stress_score}
                      severity={d.stress_severity}
                    />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ScoreBadge({
  label,
  score,
  severity,
}: {
  label: string;
  score: number | null;
  severity: string | null;
}) {
  if (severity == null) return null;
  const styles =
    SEVERITY_CLASSES[severity] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${styles}`}
    >
      <span className="font-bold">{label}:</span>
      <span>{score ?? 0}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80">
        ({SEVERITY_LABEL[severity] ?? severity})
      </span>
    </span>
  );
}
