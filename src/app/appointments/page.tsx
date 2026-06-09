"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchAppointments,
  cancelAppointment,
  Appointment,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime, formatNaira, statusLabel } from "@/lib/format";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-green-50 text-green-700",
  pending_payment: "bg-amber-50 text-amber-800",
  payment_failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-brand-50 text-brand-700",
};

export default function AppointmentsPage() {
  const { ready } = useRequireRole("client");
  const [list, setList] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await fetchAppointments());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load appointments.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onCancel(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await cancelAppointment(id);
      await load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not cancel.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
          My appointments
        </h1>
        <a href="/book">
          <Button className="!w-auto">Book new</Button>
        </a>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {!list && <LoadingState label="Loading appointments…" />}

      {list && list.length === 0 && (
        <Alert kind="info">
          You have no appointments yet.{" "}
          <a href="/book" className="underline">
            Book your first session
          </a>
          .
        </Alert>
      )}

      <div className="space-y-3">
        {list?.map((a) => {
          const cancellable =
            a.status === "booked" || a.status === "pending_payment";
          // v2 resume-payment: pending_payment appointments can be
          // resumed via the mock checkout page. Both fields come
          // from the serializer for pending_payment statuses.
          const canResume =
            a.status === "pending_payment" &&
            !!a.payment?.provider_reference &&
            !!a.payment?.id;
          return (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">
                    {a.therapist.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDateTime(a.slot.starts_at)}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs capitalize ${
                      STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {statusLabel(a.status)}
                  </span>
                  {canResume && a.payment && (
                    <p className="mt-1 text-xs text-amber-800">
                      Awaiting payment — {formatNaira(a.payment.amount_cents)}
                    </p>
                  )}
                  {canResume && a.payment?.expires_at && (
                    <p className="mt-1">
                      <ExpiryCountdown expiresAt={a.payment.expires_at} />
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {canResume && a.payment && (
                    <Link
                      href={`/checkout/${encodeURIComponent(
                        a.payment.provider_reference!
                      )}?appointment=${a.id}&payment=${a.payment.id}`}
                      className="rounded-xl bg-brand-500 px-3 py-1.5 text-center text-sm font-semibold text-white no-underline transition hover:bg-brand-600"
                    >
                      Resume payment
                    </Link>
                  )}
                  {cancellable && (
                    <Button
                      variant="ghost"
                      className="!w-auto"
                      loading={busyId === a.id}
                      onClick={() => onCancel(a.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
