"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Alert, Field } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchSlots,
  bookAppointment,
  confirmPayment,
  Slot,
  Payment,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime, ymd } from "@/lib/format";

type Stage =
  | { name: "browsing" }
  | { name: "booked"; payment: Payment; appointmentId: number }
  | { name: "paid" }
  | { name: "payment_failed" };

export default function BookPage() {
  const { ready } = useRequireRole("client");

  const [date, setDate] = useState<string>(ymd(new Date()));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>({ name: "browsing" });

  const loadSlots = useCallback(async () => {
    setError(null);
    setSlots(null);
    try {
      const data = await fetchSlots({ date });
      setSlots(data);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load availability.");
    }
  }, [date]);

  useEffect(() => {
    if (ready) loadSlots();
  }, [ready, loadSlots]);

  async function onBook(slot: Slot) {
    setBusy(true);
    setError(null);
    try {
      const { appointment, payment } = await bookAppointment({
        availability_slot_id: slot.id,
      });
      setStage({
        name: "booked",
        payment,
        appointmentId: appointment.id,
      });
    } catch (e) {
      setError(isApiError(e) ? e.message : "Booking failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onPay(force: boolean) {
    if (stage.name !== "booked") return;
    setBusy(true);
    setError(null);
    try {
      const { payment } = await confirmPayment(stage.payment.id, force);
      setStage(
        payment.status === "succeeded"
          ? { name: "paid" }
          : { name: "payment_failed" }
      );
    } catch (e) {
      setError(isApiError(e) ? e.message : "Payment could not be processed.");
      setStage({ name: "payment_failed" });
    } finally {
      setBusy(false);
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
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-brand-700 sm:text-2xl">
        Book a session
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Pick a date to see therapists available that day.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {stage.name === "browsing" && (
        <>
          <Card className="mb-5">
            <Field
              id="date"
              label="Date"
              type="date"
              value={date}
              min={ymd(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </Card>

          {!slots && <p className="text-sm text-slate-500">Loading slots…</p>}

          {slots && slots.length === 0 && (
            <Alert kind="info">
              No available sessions on this date. Try another day.
            </Alert>
          )}

          <div className="space-y-3">
            {slots?.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {s.therapist_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatDateTime(s.starts_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onBook(s)}
                    loading={busy}
                    className="!w-auto"
                  >
                    Book
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {stage.name === "booked" && (
        <Card>
          <h2 className="text-base font-semibold">Complete payment</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your slot is reserved. Amount due:{" "}
            <strong>
              {stage.payment.currency}{" "}
              {(stage.payment.amount_cents / 100).toFixed(2)}
            </strong>
            . This is a simulated gateway (Stripe-shaped) — no real card is
            charged.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => onPay(false)} loading={busy}>
              Pay now
            </Button>
            <Button
              variant="ghost"
              onClick={() => onPay(true)}
              loading={busy}
            >
              Simulate failed payment
            </Button>
          </div>
        </Card>
      )}

      {stage.name === "paid" && (
        <Alert kind="success">
          Payment successful — your appointment is confirmed. The therapist
          has been notified. You can see it under{" "}
          <a href="/appointments" className="underline">
            My appointments
          </a>
          .
        </Alert>
      )}

      {stage.name === "payment_failed" && (
        <>
          <Alert kind="error">
            Payment failed and the slot was released. You can try booking
            again.
          </Alert>
          <Button onClick={() => setStage({ name: "browsing" })}>
            Back to availability
          </Button>
        </>
      )}
    </main>
  );
}
