"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import { fetchClient, TherapistClient } from "@/lib/therapistApi";
import { isApiError } from "@/lib/apiError";

export default function ClientDetailPage() {
  const { ready } = useRequireRole("therapist");
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [client, setClient] = useState<TherapistClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await fetchClient(clientId);
      setClient(c);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You can only view clients who have booked with you."
            : e.message
          : "Could not load client."
      );
    }
  }, [clientId]);

  useEffect(() => {
    if (ready && !Number.isNaN(clientId)) load();
  }, [ready, clientId, load]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <a href="/therapist/clients" className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800">
        ← Back to clients
      </a>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {client && (
        <>
          <Card className="mb-6 mt-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {client.user.full_name}
            </h1>
            <p className="text-sm text-slate-500">{client.user.email}</p>
            {client.date_of_birth && (
              <p className="mt-1 text-sm text-slate-600">
                DOB: {client.date_of_birth}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-medium text-slate-800">
              Clinical records (EMR)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Structured forms. Only you and admin can view or edit.
            </p>

            <ul className="mt-4 divide-y divide-slate-100">
              <li className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Intake form</p>
                  <p className="text-xs text-slate-500">
                    First session — demographics, history, presenting complaint, treatment plan.
                  </p>
                </div>
                <Link
                  href={`/therapist/clients/${clientId}/intake`}
                  className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 no-underline transition hover:bg-brand-100"
                >
                  Open →
                </Link>
              </li>

              <li className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Session note</p>
                  <p className="text-xs text-slate-500">
                    Per session — review, addressed/plan, clinician impression.
                  </p>
                </div>
                <Link
                  href={`/therapist/clients/${clientId}/session_notes`}
                  className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 no-underline transition hover:bg-brand-100"
                >
                  Open →
                </Link>
              </li>

              {/* Phases 9-10 will fill these in; visible as disabled rows
                  so therapists know what's coming. */}
              <li className="flex items-center justify-between py-3 opacity-60">
                <div>
                  <p className="text-sm font-medium text-slate-800">Service plan note</p>
                  <p className="text-xs text-slate-500">
                    Second session — treatment-planning record. Coming soon.
                  </p>
                </div>
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                  Soon
                </span>
              </li>
              <li className="flex items-center justify-between py-3 opacity-60">
                <div>
                  <p className="text-sm font-medium text-slate-800">DASS-42</p>
                  <p className="text-xs text-slate-500">
                    Depression / Anxiety / Stress assessment. Coming soon.
                  </p>
                </div>
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                  Soon
                </span>
              </li>
              <li className="flex items-center justify-between py-3 opacity-60">
                <div>
                  <p className="text-sm font-medium text-slate-800">Wheel of Life</p>
                  <p className="text-xs text-slate-500">
                    9-area life satisfaction assessment. Coming soon.
                  </p>
                </div>
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                  Soon
                </span>
              </li>
            </ul>
          </Card>
        </>
      )}
    </main>
  );
}
