"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Button, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchClient,
  fetchClientNotes,
  createClientNote,
  TherapistClient,
  ClientNote,
} from "@/lib/therapistApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime } from "@/lib/format";

export default function ClientDetailPage() {
  const { ready } = useRequireRole("therapist");
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [client, setClient] = useState<TherapistClient | null>(null);
  const [notes, setNotes] = useState<ClientNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, n] = await Promise.all([
        fetchClient(clientId),
        fetchClientNotes(clientId),
      ]);
      setClient(c);
      setNotes(n);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You can only view clients who have booked with you."
            : e.message
          : "Could not load client."
      );
    }
  }, [clientId]);

  useEffect(() => {
    if (ready && !Number.isNaN(clientId)) load();
  }, [ready, clientId, load]);

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createClientNote(clientId, draft.trim());
      setDraft("");
      const n = await fetchClientNotes(clientId);
      setNotes(n);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not save note.");
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
      <a href="/therapist/clients" className="text-sm text-brand-700 underline">
        ← Back to clients
      </a>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {client && (
        <>
          <Card className="mb-6 mt-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {client.user.full_name}
            </h1>
            <p className="text-sm text-slate-500">{client.user.email}</p>
            {client.date_of_birth && (
              <p className="mt-1 text-sm text-slate-600">
                DOB: {client.date_of_birth}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-medium text-slate-800">
              Private clinical notes
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Only you can see these. The client cannot.
            </p>

            <form onSubmit={onAddNote} className="mt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                placeholder="Write a note about this session…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <div className="mt-2">
                <Button
                  type="submit"
                  loading={busy}
                  disabled={!draft.trim()}
                  className="!w-auto"
                >
                  Save note
                </Button>
              </div>
            </form>

            <div className="mt-5 space-y-3">
              {!notes && (
                <p className="text-sm text-slate-500">Loading notes…</p>
              )}
              {notes && notes.length === 0 && (
                <p className="text-sm text-slate-500">No notes yet.</p>
              )}
              {notes?.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl bg-brand-50 px-4 py-3 text-sm"
                >
                  <p className="whitespace-pre-wrap text-slate-700">
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
