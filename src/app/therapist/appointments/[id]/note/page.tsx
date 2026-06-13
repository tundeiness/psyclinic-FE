"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Alert, Field, TextArea } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchSessionNote,
  createSessionNote,
  updateSessionNote,
  signSessionNote,
  SessionNote,
  SessionNoteInput,
} from "@/lib/sessionNoteApi";
import { downloadSessionNotePdf } from "@/lib/therapistApi";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";
import { formatDateTime } from "@/lib/format";

export default function SessionNotePage() {
  const { ready } = useRequireRole(["therapist", "admin"]);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const appointmentId = Number(params.id);

  const [note, setNote] = useState<SessionNote | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable form state. Pre-filled from the existing note when we
  // load one. For a brand-new note, fields start blank.
  const [sessionNumber, setSessionNumber] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>("");
  const [sessionStartTime, setSessionStartTime] = useState<string>("");
  const [sessionEndTime, setSessionEndTime] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [addressedAndPlan, setAddressedAndPlan] = useState<string>("");
  const [clinicianImpression, setClinicianImpression] = useState<string>("");

  const [busy, setBusy] = useState<"saving" | "signing" | "downloading" | null>(null);
  const toast = useToast();
  // Transient "saved as draft" acknowledgement. Set to a timestamp on
  // successful save; auto-dismisses after a few seconds. Signed-and-
  // locked uses its own permanent banner.
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (savedAt === null) return;
    const t = setTimeout(() => setSavedAt(null), 4_000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const fillForm = useCallback((n: SessionNote | null) => {
    setSessionNumber(n?.session_number?.toString() ?? "");
    setSessionDate(n?.session_date ?? "");
    setSessionStartTime(n?.session_start_time ?? "");
    setSessionEndTime(n?.session_end_time ?? "");
    setReview(n?.review ?? "");
    setAddressedAndPlan(n?.addressed_and_plan ?? "");
    setClinicianImpression(n?.clinician_impression ?? "");
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const n = await fetchSessionNote(appointmentId);
      setNote(n);
      fillForm(n);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load the note.");
    } finally {
      setLoaded(true);
    }
  }, [appointmentId, fillForm]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  function currentInput(): SessionNoteInput {
    return {
      session_number: sessionNumber.trim() ? Number(sessionNumber) : null,
      session_date: sessionDate || null,
      session_start_time: sessionStartTime || null,
      session_end_time: sessionEndTime || null,
      review: review || null,
      addressed_and_plan: addressedAndPlan || null,
      clinician_impression: clinicianImpression || null,
    };
  }

  async function onSave() {
    setBusy("saving");
    setError(null);
    try {
      const saved = note
        ? await updateSessionNote(appointmentId, currentInput())
        : await createSessionNote(appointmentId, currentInput());
      setNote(saved);
      fillForm(saved);
      setSavedAt(Date.now());
      toast.success("Draft saved");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not save the note.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function onSign() {
    // Always save current form state before signing so the signed
    // record reflects what's on screen, not what was last persisted.
    setBusy("signing");
    setError(null);
    try {
      let target = note;
      if (target) {
        target = await updateSessionNote(appointmentId, currentInput());
      } else {
        target = await createSessionNote(appointmentId, currentInput());
      }
      const signed = await signSessionNote(appointmentId);
      setNote(signed);
      fillForm(signed);
      void target;
      toast.success("Session note signed and locked");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not sign the note.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  // Phase 15: download a Cerca-branded PDF of this session note.
  // The backend watermarks the PDF when the note is still a draft,
  // so the button is enabled in all states. Available only once the
  // note exists in the DB — there's nothing to render before that.
  async function onDownloadPdf() {
    if (!note) return;
    setBusy("downloading");
    setError(null);
    try {
      const blob = await downloadSessionNotePdf(appointmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-note-${appointmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not download PDF.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  if (!ready || !loaded) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  const locked = note?.signed === true;
  const appointmentMeta = note?.appointment;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-4">
        <Link
          href="/therapist"
          className="text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to schedule
        </Link>
      </div>

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
          Session note
        </h1>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={busy !== null || !note}
          title={
            !note
              ? "Save the note once before downloading."
              : "Download a Cerca-branded PDF."
          }
          className="rounded-xl border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "downloading" ? "Preparing…" : "Download PDF"}
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-600">
        Document what was reviewed, addressed, and your clinical
        impression. Once signed, the note is read-only.
      </p>

      {appointmentMeta?.slot_starts_at && (
        <Card className="mb-5 bg-slate-50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Appointment
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {formatDateTime(appointmentMeta.slot_starts_at)} ·{" "}
            <span className="capitalize">{appointmentMeta.status}</span>
          </p>
        </Card>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      {locked && (
        <Alert kind="success">
          Signed by {note?.signed_by_name ?? "you"} on{" "}
          {note?.signed_at ? formatDateTime(note.signed_at) : "—"}.
          This note is locked.
        </Alert>
      )}

      {/* Transient "saved as draft" toast. Fixed bottom-right so it
          doesn't push the form layout around. Auto-dismisses via the
          savedAt effect above. */}
      {savedAt !== null && !locked && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.08l6.79-6.79a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Saved as draft
        </div>
      )}

      <Card className="mt-5">
        <h2 className="text-base font-semibold text-slate-800">
          Session details
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field
            id="session_number"
            label="Session number"
            type="number"
            value={sessionNumber}
            disabled={locked}
            onChange={(e) => setSessionNumber(e.target.value)}
            placeholder="e.g. 3"
          />
          <Field
            id="session_date"
            label="Session date"
            type="date"
            value={sessionDate}
            disabled={locked}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          <Field
            id="session_start_time"
            label="Start time"
            type="time"
            value={sessionStartTime}
            disabled={locked}
            onChange={(e) => setSessionStartTime(e.target.value)}
          />
          <Field
            id="session_end_time"
            label="End time"
            type="time"
            value={sessionEndTime}
            disabled={locked}
            onChange={(e) => setSessionEndTime(e.target.value)}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <h2 className="text-base font-semibold text-slate-800">
          Narrative
        </h2>
        <div className="mt-4 space-y-4">
          <TextArea
            id="review"
            label="Review of the previous session and any assignments"
            value={review}
            disabled={locked}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            placeholder="What was reviewed at the start of this session…"
          />
          <TextArea
            id="addressed_and_plan"
            label="Issues addressed and plan for next session"
            value={addressedAndPlan}
            disabled={locked}
            onChange={(e) => setAddressedAndPlan(e.target.value)}
            rows={5}
            placeholder="What was worked on; assignments given; next steps…"
          />
          <TextArea
            id="clinician_impression"
            label="Clinician's impression"
            value={clinicianImpression}
            disabled={locked}
            onChange={(e) => setClinicianImpression(e.target.value)}
            rows={4}
            placeholder="Your observations and clinical impression…"
          />
        </div>
      </Card>

      {!locked && (
        <Card className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              <strong>Save</strong> keeps it editable. <strong>Sign</strong>{" "}
              locks the note permanently.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onSave}
                loading={busy === "saving"}
                disabled={busy !== null}
                className="!w-auto"
              >
                Save draft
              </Button>
              <Button
                onClick={onSign}
                loading={busy === "signing"}
                disabled={busy !== null}
                className="!w-auto"
              >
                Sign &amp; lock
              </Button>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}
