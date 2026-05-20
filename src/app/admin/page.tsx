"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchDashboard,
  approveApplication,
  rejectApplication,
  DashboardData,
} from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime } from "@/lib/format";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-brand-700">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { ready } = useRequireRole("admin");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchDashboard());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load dashboard.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function decide(id: number, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      if (action === "approve") await approveApplication(id);
      else await rejectApplication(id);
      await load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
          Admin dashboard
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/clients">
            <Button variant="ghost" className="!w-auto">
              Clients
            </Button>
          </Link>
          <Link href="/admin/therapists">
            <Button variant="ghost" className="!w-auto">
              Therapists
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="!w-auto">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {!data && <LoadingState label="Loading dashboard…" />}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Clients" value={data.counts.clients} />
            <Stat label="Therapists" value={data.counts.therapists} />
            <Stat
              label="Pending applications"
              value={data.counts.pending_applications}
            />
            <Stat
              label="Upcoming appointments"
              value={data.counts.appointments_upcoming}
            />
          </div>

          <Card className="mb-6">
            <h2 className="text-base font-medium text-slate-800">
              Payment inflows
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {data.payment_inflows.count} successful payment(s) —{" "}
              <strong>
                ${(data.payment_inflows.total_cents / 100).toFixed(2)}
              </strong>{" "}
              total
            </p>
          </Card>

          <h2 className="mb-3 text-base font-medium text-slate-800">
            Pending applications
          </h2>
          {data.pending_applications.length === 0 && (
            <Alert kind="info">No applications awaiting review.</Alert>
          )}
          <div className="mb-8 space-y-2">
            {data.pending_applications.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {a.full_name}
                    </p>
                    <p className="text-sm text-slate-500">{a.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs capitalize text-brand-700">
                      {a.role}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="!w-auto"
                      loading={busyId === a.id}
                      onClick={() => decide(a.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="!w-auto"
                      loading={busyId === a.id}
                      onClick={() => decide(a.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mb-3 text-base font-medium text-slate-800">
            Calendar — {data.calendar.month}
          </h2>
          <Card>
            <p className="text-sm font-medium text-slate-700">
              Booked appointments
            </p>
            {data.calendar.appointments.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">
                None this month.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {data.calendar.appointments.map((a) => (
                  <li key={a.id}>
                    {formatDateTime(a.starts_at)} — {a.client} with{" "}
                    {a.therapist}{" "}
                    <span className="text-xs capitalize text-slate-400">
                      ({a.status.replace(/_/g, " ")})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm font-medium text-slate-700">
              Availability ({data.calendar.availability.length} slots)
            </p>
          </Card>
        </>
      )}
    </main>
  );
}
