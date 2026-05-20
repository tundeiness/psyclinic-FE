"use client";

import { useCallback, useEffect, useState } from "react";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Day-by-day payment series for the area chart.
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

// Donut palette — accent colors keyed to status labels.
const STATUS_COLORS: Record<string, string> = {
  booked: "#2f8f86",
  completed: "#6366f1",
  pending_payment: "#f59e0b",
  payment_failed: "#f43f5e",
  cancelled: "#94a3b8",
};

function prettyStatus(s: string) {
  return s.replace(/_/g, " ");
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
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (error) return <Alert kind="error">{error}</Alert>;
  if (!data) return <LoadingState label="Loading dashboard…" />;

  const inflowSeries = buildInflowSeries(data.payment_inflows.recent);
  const bookingsSeries = data.bookings_by_day.map((d) => ({
    // Show day-of-month for compactness on the x-axis.
    label: d.date.slice(8),
    count: d.count,
  }));
  const statusEntries = Object.entries(data.status_breakdown);
  const statusPieData = statusEntries.map(([k, v]) => ({
    name: prettyStatus(k),
    rawKey: k,
    value: v,
  }));

  return (
    <>
      {/* ROW 1 — Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
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
        <StatCard
          tone="brand"
          label="Blog posts"
          value={data.counts.blog_posts_published}
          icon={Icons.dollar}
          hint={`${data.counts.blog_posts} total`}
        />
      </div>

      {/* ROW 2 — Practice metrics strip */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Bookings this month
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-800">
            {data.practice_metrics.bookings_this_month}
          </p>
          <p className="mt-1 text-xs text-slate-500">created in {data.calendar.month}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Avg sessions / active therapist
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-800">
            {data.practice_metrics.avg_sessions_per_active_therapist.toFixed(
              2
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            excludes therapists with zero sessions
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Top blog author
          </p>
          {data.practice_metrics.top_blog_author ? (
            <>
              <p className="mt-2 text-lg font-semibold text-slate-800">
                {data.practice_metrics.top_blog_author.full_name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {data.practice_metrics.top_blog_author.post_count} published
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-base text-slate-400">No posts yet</p>
              <p className="mt-1 text-xs text-slate-500">
                ranking appears once therapists publish
              </p>
            </>
          )}
        </Card>
      </div>

      {/* ROW 3 — Bookings bar + Status donut */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2">
            <p className="text-sm font-medium text-slate-800">
              Bookings per day
            </p>
            <p className="text-xs text-slate-500">
              14-day window centered on today
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bookingsSeries}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
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
                />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-2">
            <p className="text-sm font-medium text-slate-800">
              Appointment status
            </p>
            <p className="text-xs text-slate-500">All-time breakdown</p>
          </div>
          <div className="h-56">
            {statusPieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No appointments yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusPieData.map((entry) => (
                      <Cell
                        key={entry.rawKey}
                        fill={STATUS_COLORS[entry.rawKey] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ROW 4 — Payment inflow + Top therapists */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Payment inflows
              </p>
              <p className="text-xs text-slate-500">
                {data.payment_inflows.count} successful payment(s)
              </p>
            </div>
            <p className="text-2xl font-semibold text-brand-700">
              ${(data.payment_inflows.total_cents / 100).toFixed(2)}
            </p>
          </div>
          <div className="h-48">
            {inflowSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={inflowSeries}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
                  <defs>
                    <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2f8f86" stopOpacity={0.4} />
                      <stop
                        offset="100%"
                        stopColor="#2f8f86"
                        stopOpacity={0}
                      />
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
          <p className="text-sm font-medium text-slate-800">
            Top therapists
          </p>
          <p className="text-xs text-slate-500">By session count</p>
          {data.top_therapists.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No sessions yet.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {data.top_therapists.map((t, i) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {i + 1}
                    </span>
                    <span className="truncate text-slate-700">
                      {t.full_name}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {t.session_count}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* ROW 5 — Recent bookings + Pending applications */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2">
            <p className="text-sm font-medium text-slate-800">
              Recent bookings
            </p>
            <p className="text-xs text-slate-500">Newest 5</p>
          </div>
          {data.recent_bookings.length === 0 ? (
            <p className="text-sm text-slate-400">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="py-2 pr-3 font-medium">Client</th>
                    <th className="py-2 pr-3 font-medium">Therapist</th>
                    <th className="py-2 pr-3 font-medium">Slot</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_bookings.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-700">{r.client}</td>
                      <td className="py-2 pr-3 text-slate-700">
                        {r.therapist}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {formatDateTime(r.starts_at)}
                      </td>
                      <td className="py-2">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs capitalize"
                          style={{
                            backgroundColor:
                              (STATUS_COLORS[r.status] ?? "#94a3b8") + "22",
                            color: STATUS_COLORS[r.status] ?? "#475569",
                          }}
                        >
                          {prettyStatus(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-800">
            Pending applications
          </p>
          <p className="text-xs text-slate-500">
            Approve or reject — disappears for all admins on decision
          </p>
          {data.pending_applications.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No applications awaiting review.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.pending_applications.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">
                        {a.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {a.email}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-xs capitalize text-slate-600 ring-1 ring-slate-200">
                        {a.role}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      className="!w-auto !px-3 !py-1.5 !text-xs"
                      loading={busyId === a.id}
                      onClick={() => decide(a.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="!w-auto !px-3 !py-1.5 !text-xs"
                      loading={busyId === a.id}
                      onClick={() => decide(a.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
