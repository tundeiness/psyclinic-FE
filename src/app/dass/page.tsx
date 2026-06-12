"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  listMyDassAssessments,
  startDassAssessment,
  ClientDassAssessment,
} from "@/lib/dassApi";
import { SEVERITY_LABEL, SEVERITY_CLASSES } from "@/lib/dassItems";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Phase 17.3: client's DASS-42 history + "Start new" button. The
// assessment is self-report so the client is always the author.
// Per Q6 (unlimited retakes) we let them start a fresh assessment
// at any time, even if they have an in-progress draft.
export default function DassListPage() {
  const { ready } = useRequireRole("client");
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<ClientDassAssessment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const records = await listMyDassAssessments();
      setList(records);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load your DASS history.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onStart() {
    setBusy(true);
    setError(null);
    try {
      const created = await startDassAssessment();
      toast.success("New assessment started");
      router.push(`/dass/${created.id}`);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not start a new assessment.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <LoadingState />;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
          DASS-42 assessments
        </h1>
        <Button onClick={onStart} disabled={busy}>
          {busy ? "Starting…" : "Start new"}
        </Button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        A self-report screening tool. Your therapist may ask you to
        complete it before a session, or you can take it on your own
        as part of your reflection. 42 brief items, takes about 5-10
        minutes.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {list && list.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            You haven&apos;t completed any DASS-42 assessments yet. Click{" "}
            <span className="font-semibold">Start new</span> when you&apos;re
            ready.
          </p>
        </Card>
      )}

      {list && list.length > 0 && (
        <ul className="space-y-3">
          {list.map((d) => (
            <li key={d.id}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {d.signed
                        ? `Submitted ${
                            d.signed_at
                              ? new Date(d.signed_at).toLocaleDateString()
                              : ""
                          }`
                        : "Draft in progress"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {d.signed
                        ? "Final"
                        : `${d.completed_items} of 42 items answered`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.signed ? (
                      <SeverityRow record={d} />
                    ) : (
                      <Link
                        href={`/dass/${d.id}`}
                        className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 no-underline transition hover:bg-brand-100"
                      >
                        Resume →
                      </Link>
                    )}
                  </div>
                </div>
                {d.signed && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <Link
                      href={`/dass/${d.id}`}
                      className="text-xs font-semibold text-brand-700 no-underline hover:text-brand-800"
                    >
                      View details →
                    </Link>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function SeverityRow({ record }: { record: ClientDassAssessment }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <SeverityBadge label="D" severity={record.depression_severity} />
      <SeverityBadge label="A" severity={record.anxiety_severity} />
      <SeverityBadge label="S" severity={record.stress_severity} />
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
  const styles = SEVERITY_CLASSES[severity] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ring-1 ${styles}`}
      title={`${label === "D" ? "Depression" : label === "A" ? "Anxiety" : "Stress"}: ${SEVERITY_LABEL[severity] ?? severity}`}
    >
      <span className="font-bold">{label}</span>
      <span>{SEVERITY_LABEL[severity] ?? severity}</span>
    </span>
  );
}
