"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import { useAppSelector } from "@/store";
import { fetchMyClients, TherapistClient } from "@/lib/therapistApi";
import { isApiError } from "@/lib/apiError";

export default function TherapistClientsPage() {
  const { ready } = useRequireRole("therapist");
  const { user } = useAppSelector((s) => s.auth);
  const myTpId = user?.therapist_profile?.id ?? null;
  const [clients, setClients] = useState<TherapistClient[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetchMyClients()
      .then(setClients)
      .catch((e) =>
        setError(isApiError(e) ? e.message : "Could not load clients.")
      );
  }, [ready]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-brand-700 sm:text-2xl">
        My clients
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Clients who have booked an appointment with you. Former patients
        remain in this list so you can review records you authored.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {!clients && <LoadingState label="Loading clients…" />}
      {clients && clients.length === 0 && (
        <Alert kind="info">
          No clients yet. Clients appear here once they book you.
        </Alert>
      )}

      <div className="space-y-3">
        {clients?.map((c) => {
          // Phase 14: highlight former patients so the therapist
          // knows their EMR access is read-only on this client.
          const isFormer =
            myTpId != null &&
            c.current_therapist_id != null &&
            c.current_therapist_id !== myTpId;
          return (
            <Link key={c.id} href={`/therapist/clients/${c.id}`}>
              <Card className="transition hover:ring-2 hover:ring-brand-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">
                      {c.user.full_name}
                    </p>
                    <p className="text-sm text-slate-500">{c.user.email}</p>
                  </div>
                  {isFormer && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                      Former
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-brand-600">
                  View profile &amp; notes →
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
