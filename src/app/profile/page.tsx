"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Button, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchDocuments,
  uploadAvatar,
  uploadDocument,
  deleteDocument,
  AttachmentMeta,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";

export default function ProfilePage() {
  const { ready, user } = useRequireRole("client");
  const [docs, setDocs] = useState<AttachmentMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      setDocs(await fetchDocuments());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load documents.");
    }
  }, []);

  useEffect(() => {
    if (ready) loadDocs();
  }, [ready, loadDocs]);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await uploadAvatar(file);
      setNotice("Avatar updated.");
    } catch (err) {
      setError(isApiError(err) ? err.message : "Avatar upload failed.");
    } finally {
      setBusy(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  async function onDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await uploadDocument(file);
      setNotice("Document uploaded.");
      await loadDocs();
    } catch (err) {
      setError(isApiError(err) ? err.message : "Document upload failed.");
    } finally {
      setBusy(false);
      if (docInput.current) docInput.current.value = "";
    }
  }

  async function onDelete(id: number) {
    setBusy(true);
    setError(null);
    try {
      await deleteDocument(id);
      await loadDocs();
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not delete document.");
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
        My profile
      </h1>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <Card className="mb-5">
        <h2 className="text-base font-medium text-slate-800">
          {user?.full_name}
        </h2>
        <p className="text-sm text-slate-500">{user?.email}</p>

        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-slate-700">Avatar</p>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            onChange={onAvatar}
            disabled={busy}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-white"
          />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-800">Documents</h2>
        </div>
        <input
          ref={docInput}
          type="file"
          onChange={onDoc}
          disabled={busy}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-white"
        />

        {!docs && (
          <p className="mt-3 text-sm text-slate-500">Loading documents…</p>
        )}
        {docs && docs.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            No documents uploaded yet.
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {docs?.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm"
            >
              <span className="truncate">{d.filename}</span>
              <button
                onClick={() => d.id && onDelete(d.id)}
                disabled={busy}
                className="ml-3 shrink-0 text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
