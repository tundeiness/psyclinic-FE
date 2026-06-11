"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Alert, Field } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import { useAppSelector } from "@/store";
import {
  fetchSlots,
  fetchSessionBlocks,
  bookAppointment,
  Slot,
  SessionBlock,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime, ymd } from "@/lib/format";

// Next.js 14 requires components calling useSearchParams() to be
// wrapped in a Suspense boundary.
export default function BookPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-5 py-10">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}

function BookPageInner() {
  const { ready } = useRequireRole("client");
  const { user } = useAppSelector((s) => s.auth);
  const currentTherapistId =
    user?.client_profile?.current_therapist_id ?? null;
  const router = useRouter();
  const search = useSearchParams();

  const [date, setDate] = useState<string>(ymd(new Date()));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [activeBlock, setActiveBlock] = useState<SessionBlock | null>(null);
  const [blocksLoaded, setBlocksLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busySlotId, setBusySlotId] = useState<number | null>(null);

  const failed = search.get("payment_failed") === "1";

  // Load the client's session blocks once on mount. We need to know
  // whether they have a paid block before fetching slots, because the
  // slot list differs:
  //   - With active paid block: only show their current therapist's
  //     slots (normal-session restriction).
  //   - Without: show all therapists' slots (assessment-session
  //     mode — they can pick any therapist).
  const loadBlocks = useCallback(async () => {
    try {
      const blocks = await fetchSessionBlocks();
      const found = blocks.find(
        (b) =>
          b.status === "active" &&
          b.sessions_remaining > 0 &&
          b.first_payment_status === "succeeded"
      );
      setActiveBlock(found ?? null);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load block status.");
    } finally {
      setBlocksLoaded(true);
    }
  }, []);

  const loadSlots = useCallback(async () => {
    if (!blocksLoaded) return;
    setSlots(null);
    setError(null);  // Clear any stale error from a prior date/action.
    try {
      // v2: filter slots to the current therapist when one is set.
      //
      // Three states a client can be in:
      //   - No current_therapist_id (pre-assessment): show all
      //     therapists' slots. Their first booked-and-paid assessment
      //     binds them to that therapist.
      //   - current_therapist_id set, no active block: show only that
      //     therapist's slots. They'll book an assessment with their
      //     current therapist. To pick a different therapist they must
      //     use the Switch flow (Phase 14).
      //   - Active block: show only the block's therapist's slots
      //     (normal-session mode).
      //
      // The activeBlock filter is naturally a subset of the
      // current_therapist filter, so we just check current_therapist
      // first.
      const args: { date: string; therapist_profile_id?: number } = { date };
      if (activeBlock) {
        args.therapist_profile_id = activeBlock.therapist_profile_id;
      } else if (currentTherapistId) {
        args.therapist_profile_id = currentTherapistId;
      }
      const data = await fetchSlots(args);
      setSlots(data);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load availability.");
    }
  }, [date, blocksLoaded, activeBlock, currentTherapistId]);

  useEffect(() => {
    if (ready) loadBlocks();
  }, [ready, loadBlocks]);

  useEffect(() => {
    if (ready && blocksLoaded) loadSlots();
  }, [ready, blocksLoaded, loadSlots]);

  async function onBook(slot: Slot) {
    setBusySlotId(slot.id);
    setError(null);
    try {
      // Branch session_kind based on whether there's an active block.
      const kind: "normal" | "assessment" = activeBlock ? "normal" : "assessment";

      const { appointment, payment } = await bookAppointment({
        availability_slot_id: slot.id,
        session_kind: kind,
      });

      if (kind === "normal") {
        // Normal session: appointment is :booked, no payment intent,
        // block decremented server-side. Go straight to confirmation.
        router.push(`/booking/confirmed/${appointment.id}`);
        return;
      }

      // Assessment session: needs the mock checkout.
      const intent = payment?.provider_reference;
      if (!intent || !payment) {
        setError("Booking succeeded but no payment intent was returned.");
        setBusySlotId(null);
        return;
      }
      router.push(
        `/checkout/${encodeURIComponent(intent)}?appointment=${appointment.id}&payment=${payment.id}`
      );
    } catch (e) {
      setError(isApiError(e) ? e.message : "Booking failed.");
      setBusySlotId(null);
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

      {/* Contextual banner reflecting what kind of session this will
          be. The user benefits from knowing whether their session
          will be charged separately (assessment) or drawn from their
          block (normal). */}
      {blocksLoaded && activeBlock && (
        <p className="mb-6 text-sm text-slate-600">
          Booking a <strong>normal session</strong> with{" "}
          {activeBlock.therapist_name ?? "your current therapist"}.{" "}
          You have <strong>{activeBlock.sessions_remaining}</strong> of{" "}
          {activeBlock.sessions_total} sessions remaining in your block.
        </p>
      )}
      {blocksLoaded && !activeBlock && !currentTherapistId && (
        <p className="mb-6 text-sm text-slate-600">
          Pick a date and a therapist. The first session with a new
          therapist is an <strong>assessment session</strong>{" "}
          (charged separately).
        </p>
      )}
      {blocksLoaded && !activeBlock && currentTherapistId && (
        // Phase 14: client has a therapist (assessment paid or seeded)
        // but no active block yet. They can only book with their
        // current therapist; to choose someone else they use the
        // Switch flow. Slots are filtered server-side too.
        <Card className="mb-6 bg-slate-50 ring-1 ring-slate-200 animate-in fade-in slide-in-from-top-1 duration-300">
          <p className="text-sm text-slate-700">
            Showing slots for your current therapist. To book with a
            different therapist,{" "}
            <Link
              href="/therapists"
              className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-800"
            >
              switch from the Therapists page
            </Link>{" "}
            first.
          </p>
        </Card>
      )}

      {failed && (
        <Alert kind="error">
          The previous payment didn&apos;t go through — the slot was
          released. Try again or pick a different time.
        </Alert>
      )}

      {error && <Alert kind="error">{error}</Alert>}

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
                loading={busySlotId === s.id}
                disabled={busySlotId !== null && busySlotId !== s.id}
                className="!w-auto"
              >
                Book
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
