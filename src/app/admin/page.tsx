"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  Alert,
  LoadingState,
  StatCard,
  Icons,
} from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchDashboard,
  approveApplication,
  rejectApplication,
  DashboardData,
} from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime } from "@/lib/format";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Group recent successful payments into a day-by-day series for the
// area chart. Falls back gracefully if recent[] is empty.
function buildInflowSeries(
  recent: { amount_cents: number; paid_at: string | null }[]
) {
  if (!recent.length) return [];
  const byDay = new Map<string, number>();
  recent.forEach((p) => {
    if (!p.paid_at) return;
    const key = p.paid_at.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + p.amount_cents);
  });
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, cents]) => ({ day: day.slice(5), amount: cents / 100 }));
}

export default function AdminDashboardPage() {
  const { ready, user } = useRequireRole("admin");
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
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  const series = data ? buildInflowSeries(data.payment_inflows.recent) : [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      {/* Welcome banner */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-800 p-6 text-white shadow-soft">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Welcome back, {user?.full_name?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Here&apos;s how the practice is doing today.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/clients">
            <button className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
              Clients
            </button>
          </Link>
          <Link href="/admin/therapists">
            <button className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
              Therapists
            </button>
          </Link>
          <Link href="/admin/settings">
            <button className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
              Settings
            </button>
          </Link>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {!data && <LoadingState label="Loading dashboard…" />}

      {data && (
        <>
          {/* Stat row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              tone="indigo"
              label="Clients"
              value={data.counts.clients}
              icon={Icons.users}
            />
            <StatCard
              tone="violet"
              label="Therapists"
              value={data.counts.therapists}
              icon={Icons.briefcase}
            />
            <StatCard
              tone="amber"
              label="Pending"
              value={data.counts.pending_applications}
              icon={Icons.inbox}
              hint="applications"
            />
            <StatCard
              tone="cyan"
              label="Upcoming"
              value={data.counts.appointments_upcoming}
              icon={Icons.calendar}
              hint="appointments"
            />
          </div>

          {/* Inflows chart + summary */}
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Payment inflows
                  </p>
                  <p className="text-xs text-slate-500">
                    {data.payment_inflows.count} successful payment(s) total
                  </p>
                </div>
                <p className="text-2xl font-semibold text-brand-700">
                  ${(data.payment_inflows.total_cents / 100).toFixed(2)}
                </p>
              </div>
              <div className="h-56">
                {series.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={series}
                      margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                    >
                      <defs>
                        <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2f8f86" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#2f8f86" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                        formatter={(value) => [
                          `$${Number(value).toFixed(2)}`,
                          "Inflow",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#2f8f86"
                        strokeWidth={2}
                        fill="url(#inflow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No payments yet — the chart will populate as bookings come in.
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-medium text-slate-800">This month</p>
              <p className="mt-1 text-xs text-slate-500">
                {data.calendar.month}
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Booked appointments</span>
                  <span className="font-semibold text-slate-800">
                    {data.calendar.appointments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Availability slots</span>
                  <span className="font-semibold text-slate-800">
                    {data.calendar.availability.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Pending applications */}
          <h2 className="mb-3 text-base font-medium text-slate-800">
            Pending applications
          </h2>
          {data.pending_applications.length === 0 ? (
            <Alert kind="info">No applications awaiting review.</Alert>
          ) : (
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              {data.pending_applications.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {a.full_name}
                      </p>
                      <p className="text-sm text-slate-500">{a.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-accent-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-accent-indigo-600">
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
          )}

          {/* Upcoming calendar */}
          <h2 className="mb-3 text-base font-medium text-slate-800">
            Upcoming appointments
          </h2>
          <Card>
            {data.calendar.appointments.length === 0 ? (
              <p className="text-sm text-slate-500">None this month.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.calendar.appointments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                  >
                    <span className="text-slate-700">
                      {formatDateTime(a.starts_at)}
                    </span>
                    <span className="truncate text-slate-500">
                      {a.client} · {a.therapist}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs capitalize text-slate-500 ring-1 ring-slate-200">
                      {a.status.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
