"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import { fetchAppointments, Appointment } from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime } from "@/lib/format";

export default function BookingConfirmedPage() {
  const { ready } = useRequireRole("client");
  const params = useParams<{ id: string }>();
  const appointmentId = Number(params.id);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Same trade-off as the checkout page — no per-id fetch
      // endpoint for client appointments yet, so we fetch the list
      // and find by id. Small N, acceptable for now.
      const all = await fetchAppointments();
      const found = all.find((a) => a.id === appointmentId) ?? null;
      setAppointment(found);
      if (!found) setError("Appointment not found.");
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Could not load appointment details."
      );
    } finally {
      setLoaded(true);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  if (!ready || !loaded) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      {error && <Alert kind="error">{error}</Alert>}

      {appointment && (
        <>
          <Alert kind="success">Payment successful — appointment confirmed.</Alert>

          <Card className="mt-5">
            <h1 className="text-lg font-semibold text-slate-800">
              {appointment.session_kind === "assessment"
                ? "Your assessment session"
                : "Your session"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              With <strong>{appointment.therapist.name}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {formatDateTime(appointment.slot.starts_at)}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Your therapist has been notified. You&apos;ll receive a
              reminder closer to the session.
            </p>
          </Card>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/appointments"
              className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 no-underline transition hover:bg-brand-100"
            >
              My appointments
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-200"
            >
              Dashboard
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
