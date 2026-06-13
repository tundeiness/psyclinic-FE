"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  listMyWheelOfLifeAssessments,
  startWheelOfLifeAssessment,
  WheelOfLifeAssessment,
} from "@/lib/wheelOfLifeApi";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Count completed items across all areas for a draft. Used in the
// row to show progress before submission.
function completedCount(record: WheelOfLifeAssessment): number {
  let n = 0;
  for (const items of Object.values(record.scores || {})) {
    for (const v of items) if (typeof v === "number") n++;
  }
  return n;
}

const TOTAL_ITEMS = 39;

export default function WolListPage() {
  const { ready } = useRequireRole("client");
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<WheelOfLifeAssessment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const records = await listMyWheelOfLifeAssessments();
      setList(records);
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Could not load your Wheel of Life history."
      );
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onStart() {
    setBusy(true);
    setError(null);
    try {
      const created = await startWheelOfLifeAssessment();
      toast.success("New assessment started");
      router.push(`/wheel-of-life/${created.id}`);
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
          Wheel of Life
        </h1>
        <Button onClick={onStart} disabled={busy}>
          {busy ? "Starting…" : "Start new"}
        </Button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        A reflective self-assessment covering 9 areas of life. Rate
        each statement from 1 (Highly Disagree) to 10 (Highly Agree).
        Use it as a starting point for therapy or as a periodic
        check-in.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {list && list.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            You haven&apos;t completed a Wheel of Life yet. Click{" "}
            <span className="font-semibold">Start new</span> to begin.
          </p>
        </Card>
      )}

      {list && list.length > 0 && (
        <ul className="space-y-3">
          {list.map((w) => (
            <li key={w.id}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {w.signed
                        ? `Submitted ${
                            w.signed_at
                              ? new Date(w.signed_at).toLocaleDateString()
                              : ""
                          }`
                        : "Draft in progress"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {w.signed
                        ? "Final"
                        : `${completedCount(w)} of ${TOTAL_ITEMS} items answered`}
                    </p>
                  </div>
                  <Link
                    href={`/wheel-of-life/${w.id}`}
                    className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 no-underline transition hover:bg-brand-100"
                  >
                    {w.signed ? "View →" : "Resume →"}
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
