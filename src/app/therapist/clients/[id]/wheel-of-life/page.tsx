"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  listClientWheelOfLifeAssessments,
  TherapistWolAssessment,
} from "@/lib/therapistApi";
import { WOL_AREAS } from "@/lib/wheelOfLifeItems";
import { isApiError } from "@/lib/apiError";

// Phase 18.3: therapist read view of a client's Wheel of Life
// history. Drafts excluded by the backend. Each row shows date,
// the lowest-3 areas (the ones most likely to discuss in session),
// and links into the detail view.
export default function TherapistWolListPage() {
  const { ready } = useRequireRole(["therapist", "admin"]);
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [list, setList] = useState<TherapistWolAssessment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const records = await listClientWheelOfLifeAssessments(clientId);
      setList(records);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You don't have access to this client's Wheel of Life assessments."
            : e.message
          : "Could not load Wheel of Life history."
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
        Wheel of Life assessments
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Submitted self-assessments, most recent first. Draft
        assessments are private to the client until submitted.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {list && list.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            This client hasn&apos;t submitted any Wheel of Life
            assessments yet.
          </p>
        </Card>
      )}

      {list && list.length > 0 && (
        <ul className="space-y-3">
          {list.map((w) => {
            // Find the lowest-3 areas — those most likely to merit
            // clinical attention. Stable secondary sort by WOL_AREAS
            // order so ties don't shuffle between renders.
            const ranked = WOL_AREAS
              .map((a) => ({
                key: a.key,
                label: a.label,
                pct: w.totals?.[a.key]?.percentage ?? 0,
              }))
              .sort((a, b) => a.pct - b.pct)
              .slice(0, 3);

            return (
              <li key={w.id}>
                <Link
                  href={`/therapist/clients/${clientId}/wheel-of-life/${w.id}`}
                  className="block no-underline"
                >
                  <Card className="transition hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {w.signed_at
                            ? new Date(w.signed_at).toLocaleDateString()
                            : w.assessment_date}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Submitted{" "}
                          {w.signed_at
                            ? new Date(w.signed_at).toLocaleString()
                            : "(unknown)"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-brand-700">
                        View details →
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Lowest-rated areas
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {ranked.map((r) => (
                          <span
                            key={r.key}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                          >
                            <span>{r.label}</span>
                            <span className="font-bold">{r.pct}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
