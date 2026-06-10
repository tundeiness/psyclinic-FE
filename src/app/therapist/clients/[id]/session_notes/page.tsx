"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchClient,
  fetchMyAppointments,
  TherapistClient,
  Appointment,
} from "@/lib/therapistApi";
import { fetchSessionNote } from "@/lib/sessionNoteApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime } from "@/lib/format";

// Per-appointment note status. We fetch all this client's appointments
// (via the therapist's own list) then ask the backend for each one's
// note state. N+1 in the simplest sense, but N is small (this client's
// appointments only, ~10 max in practice for v1).
type RowState = {
  appointment: Appointment;
  noteStatus: "loading" | "none" | "draft" | "signed";
};

export default function ClientSessionNotesPage() {
  const { ready } = useRequireRole("therapist");
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [client, setClient] = useState<TherapistClient | null>(null);
  const [rows, setRows] = useState<RowState[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, all] = await Promise.all([
        fetchClient(clientId),
        fetchMyAppointments(),
      ]);
      setClient(c);

      // Filter to this client. Session notes only make sense for
      // booked or completed appointments — exclude pending payments,
      // cancellations, payment failures.
      const mine = all
        .filter((a) => a.client.id === clientId)
        .filter((a) => a.status === "booked" || a.status === "completed")
        .sort(
          (a, b) =>
            new Date(b.slot.starts_at).getTime() -
            new Date(a.slot.starts_at).getTime()
        );

      // Initialize all rows as loading, then look up each note.
      const initialRows: RowState[] = mine.map((a) => ({
        appointment: a,
        noteStatus: "loading",
      }));
      setRows(initialRows);

      // Look up notes concurrently.
      const updated = await Promise.all(
        mine.map(async (a): Promise<RowState> => {
          try {
            const n = await fetchSessionNote(a.id);
            const status: RowState["noteStatus"] = !n
              ? "none"
              : n.signed
              ? "signed"
              : "draft";
            return { appointment: a, noteStatus: status };
          } catch {
            return { appointment: a, noteStatus: "none" };
          }
        })
      );
      setRows(updated);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You can only view clients who have booked with you."
            : e.message
          : "Could not load."
      );
    }
  }, [clientId]);

  useEffect(() => {
    if (ready && !Number.isNaN(clientId)) load();
  }, [ready, clientId, load]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/therapist/clients/${clientId}`}
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to client
      </Link>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {client && (
        <>
          <h1 className="mt-4 text-xl font-semibold text-slate-800">
            Session notes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            For {client.user.full_name}. One note per session.
          </p>

          <div className="mt-5 space-y-2">
            {rows === null && (
              <p className="text-sm text-slate-500">Loading…</p>
            )}
            {rows && rows.length === 0 && (
              <Alert kind="info">
                No sessions yet. Notes are attached to booked or
                completed appointments.
              </Alert>
            )}
            {rows?.map((row) => (
              <Card key={row.appointment.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDateTime(row.appointment.slot.starts_at)}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {row.appointment.status} ·{" "}
                      <NoteStatusLabel status={row.noteStatus} />
                    </p>
                  </div>
                  <Link
                    href={`/therapist/appointments/${row.appointment.id}/note`}
                    className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 no-underline transition hover:bg-brand-100"
                  >
                    {row.noteStatus === "signed"
                      ? "View"
                      : row.noteStatus === "draft"
                      ? "Continue"
                      : "Start note"}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function NoteStatusLabel({ status }: { status: RowState["noteStatus"] }) {
  if (status === "loading") return <span>…</span>;
  if (status === "signed")
    return <span className="text-emerald-700">Signed</span>;
  if (status === "draft")
    return <span className="text-amber-700">Draft</span>;
  return <span className="text-slate-500">No note yet</span>;
}
