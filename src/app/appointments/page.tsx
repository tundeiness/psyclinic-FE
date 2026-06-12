"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, LoadingState, TextArea } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchAppointments,
  cancelAppointment,
  Appointment,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime, formatNaira, statusLabel } from "@/lib/format";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";
import { useToast } from "@/lib/useToast";

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-green-50 text-green-700",
  pending_payment: "bg-amber-50 text-amber-800",
  payment_failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-brand-50 text-brand-700",
  // Phase 12: client missed without notice — counts as held.
  no_show: "bg-rose-50 text-rose-700",
};

// Phase 12 helper: a booked appointment is locked for cancellation
// when its start time is less than 24 hours away. Per Cerca Africa
// policy, late cancellations aren't allowed (the client must contact
// the clinic for emergencies).
function isWithin24Hours(startsAt: string): boolean {
  return new Date(startsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

export default function AppointmentsPage() {
  const { ready } = useRequireRole("client");
  const [list, setList] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        {list?.map((a) => (
          <AppointmentRow
            key={a.id}
            appointment={a}
            onCancelled={load}
            onError={setError}
          />
        ))}
      </div>
    </main>
  );
}

// Row component owns its own cancel-flow state (the "more options"
// disclosure for capturing an optional cancellation reason, the
// per-row busy state). Extracted from the main page so each row can
// independently toggle its disclosure without conflicting.
function AppointmentRow({
  appointment: a,
  onCancelled,
  onError,
}: {
  appointment: Appointment;
  onCancelled: () => void | Promise<void>;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const toast = useToast();

  const cancellable =
    a.status === "booked" || a.status === "pending_payment";
  // 24-hour rule applies only to BOOKED — pending_payment can always
  // be cancelled since no slot is truly held yet.
  const locked24h =
    a.status === "booked" && isWithin24Hours(a.slot.starts_at);
  const canResume =
    a.status === "pending_payment" &&
    !!a.payment?.provider_reference &&
    !!a.payment?.id;

  async function doCancel() {
    setBusy(true);
    try {
      await cancelAppointment(a.id, reason.trim() || undefined);
      await onCancelled();
      toast.success("Appointment cancelled");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not cancel.";
      onError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-800">{a.therapist.name}</p>
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
          {a.status === "no_show" && (
            <p className="mt-2 text-xs text-rose-700">
              This session was missed and counts as held per the
              clinic&apos;s policy.
            </p>
          )}
          {a.status === "cancelled" && a.payment?.status === "succeeded" && (
            // Phase 14 polish: honest financial trail. The client
            // paid for this session, then cancelled (e.g. as a
            // precondition to switching therapists). Per the
            // contract, the fee is non-refundable. Make that
            // visible rather than letting the row read identical
            // to a never-paid cancellation.
            <p className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              Paid {formatNaira(a.payment.amount_cents)} · non-refundable
            </p>
          )}
          {a.status === "cancelled" && a.cancellation_reason && (
            <p className="mt-2 text-xs text-slate-500">
              Reason: {a.cancellation_reason}
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2">
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
            <>
              <Button
                variant="ghost"
                className="!w-auto"
                loading={busy}
                disabled={locked24h || busy}
                onClick={doCancel}
                title={
                  locked24h
                    ? "Sessions can only be cancelled up to 24 hours before they start. Contact the clinic for emergencies."
                    : undefined
                }
              >
                Cancel
              </Button>
              {a.status === "booked" && !locked24h && (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  onClick={() => setShowReason((v) => !v)}
                >
                  {showReason ? "Hide reason" : "More options ▾"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Optional cancellation-reason capture, behind a "More options"
          disclosure so the common one-click cancel path stays fast. */}
      {showReason && cancellable && !locked24h && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <TextArea
            id={`reason-${a.id}`}
            label="Reason for cancellation (optional)"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="So we can improve. Visible to your therapist."
          />
        </div>
      )}

      {locked24h && (
        <p className="mt-3 text-xs text-slate-500">
          Within 24 hours of the start time — cancellation is no longer
          possible. Contact the clinic for emergencies.
        </p>
      )}
    </Card>
  );
}
