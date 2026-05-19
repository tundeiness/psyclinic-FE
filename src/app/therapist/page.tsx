"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Alert, Field } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchMySlots,
  createSlot,
  deleteSlot,
  fetchMyAppointments,
  updateAppointmentStatus,
  Slot,
  Appointment,
} from "@/lib/therapistApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime, statusLabel, ymd } from "@/lib/format";

export default function TherapistSchedulePage() {
  const { ready } = useRequireRole("therapist");

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [appts, setAppts] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState(ymd(new Date()));
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, a] = await Promise.all([
        fetchMySlots(),
        fetchMyAppointments(),
      ]);
      setSlots(s);
      setAppts(a);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load your schedule.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createSlot({
        starts_at: new Date(`${date}T${start}`).toISOString(),
        ends_at: new Date(`${date}T${end}`).toISOString(),
      });
      await load();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.details?.join(", ") || err.message
          : "Could not create slot."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteSlot(id: number) {
    setBusy(true);
    setError(null);
    try {
      await deleteSlot(id);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not delete slot.");
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(id: number, status: "completed" | "cancelled") {
    setBusy(true);
    setError(null);
    try {
      await updateAppointmentStatus(id, status);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not update.");
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
      <h1 className="mb-6 text-xl font-semibold text-brand-700 sm:text-2xl">
        My schedule
      </h1>

      {error && <Alert kind="error">{error}</Alert>}

      <Card className="mb-6">
        <h2 className="mb-3 text-base font-medium text-slate-800">
          Add availability
        </h2>
        <form onSubmit={onCreate}>
          <Field
            id="date"
            label="Date"
            type="date"
            min={ymd(new Date())}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-x-3">
            <Field
              id="start"
              label="Start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <Field
              id="end"
              label="End"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <Button type="submit" loading={busy}>
            Add slot
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-base font-medium text-slate-800">
        Upcoming availability
      </h2>
      {!slots && <p className="text-sm text-slate-500">Loading…</p>}
      {slots && slots.length === 0 && (
        <Alert kind="info">
          No availability yet. Add a slot above so clients can book you.
        </Alert>
      )}
      <div className="mb-8 space-y-2">
        {slots?.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {formatDateTime(s.starts_at)}
                </p>
                <span
                  className={`text-xs ${
                    s.booked ? "text-amber-700" : "text-green-700"
                  }`}
                >
                  {s.booked ? "Booked" : "Available"}
                </span>
              </div>
              {!s.booked && (
                <Button
                  variant="ghost"
                  className="!w-auto"
                  loading={busy}
                  onClick={() => onDeleteSlot(s.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-base font-medium text-slate-800">
        Appointments
      </h2>
      {!appts && <p className="text-sm text-slate-500">Loading…</p>}
      {appts && appts.length === 0 && (
        <Alert kind="info">No appointments yet.</Alert>
      )}
      <div className="space-y-2">
        {appts?.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">{a.client.name}</p>
                <p className="text-sm text-slate-600">
                  {formatDateTime(a.slot.starts_at)}
                </p>
                <span className="mt-1 inline-block text-xs capitalize text-slate-500">
                  {statusLabel(a.status)}
                </span>
              </div>
              {a.status === "booked" && (
                <div className="flex flex-col gap-2">
                  <Button
                    className="!w-auto"
                    loading={busy}
                    onClick={() => onStatus(a.id, "completed")}
                  >
                    Mark done
                  </Button>
                  <Button
                    variant="ghost"
                    className="!w-auto"
                    loading={busy}
                    onClick={() => onStatus(a.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
