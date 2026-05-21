"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import {
  fetchDocuments,
  uploadAvatar,
  deleteAvatar,
  uploadDocument,
  deleteDocument,
  AttachmentMeta,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { fetchMe } from "@/store/authSlice";
import { useAppDispatch } from "@/store";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector((s) => s.auth);

  const [docs, setDocs] = useState<AttachmentMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  // Any signed-in user can use this page. Only the client variant shows
  // documents; everyone else sees just avatar.
  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, user, router]);

  const isClient = user?.role === "client";

  const loadDocs = useCallback(async () => {
    try {
      setDocs(await fetchDocuments());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load documents.");
    }
  }, []);

  useEffect(() => {
    if (user && isClient) loadDocs();
  }, [user, isClient, loadDocs]);

  // After avatar mutations, refresh /me so the UserMenu pill picks
  // up the new (or removed) photo right away — no re-login required.
  async function refreshAuth() {
    await dispatch(fetchMe());
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await uploadAvatar(file);
      await refreshAuth();
      setNotice("Avatar updated.");
    } catch (err) {
      setError(isApiError(err) ? err.message : "Avatar upload failed.");
    } finally {
      setBusy(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  async function onAvatarRemove() {
    if (!confirm("Remove your avatar photo?")) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await deleteAvatar();
      await refreshAuth();
      setNotice("Avatar removed.");
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not remove avatar.");
    } finally {
      setBusy(false);
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

  async function onDeleteDoc(id: number) {
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

  if (!initialized || !user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <LoadingState label="Loading…" />
      </main>
    );
  }

  // Build the avatar preview URL — same logic as UserMenu so they
  // stay visually consistent.
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const avatarUrl =
    user.avatar?.url
      ? user.avatar.url.startsWith("http")
        ? user.avatar.url
        : `${apiBase}${user.avatar.url}`
      : null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-6 text-xl font-semibold text-brand-700 sm:text-2xl">
        {isClient ? "My profile" : "Account"}
      </h1>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <Card className="mb-5">
        <div className="flex items-start gap-5">
          {/* Preview — shows the actual avatar that's been uploaded,
              or a gradient initials block. */}
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 ring-1 ring-slate-200">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={user.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                {user.full_name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") || "U"}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-medium text-slate-800">
              {user.full_name}
            </h2>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs capitalize text-slate-500">
              {user.role}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-1 text-sm font-medium text-slate-700">
            Profile photo
          </p>
          <p className="mb-2 text-xs text-slate-500">
            JPG or PNG. Square images look best in the dropdown menu and
            sidebar.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              onChange={onAvatar}
              disabled={busy}
              className="block w-full max-w-sm text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-white sm:w-auto"
            />
            {avatarUrl && (
              <Button
                variant="ghost"
                className="!w-auto !text-red-600"
                onClick={onAvatarRemove}
                disabled={busy}
              >
                Remove photo
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isClient && (
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
                  onClick={() => d.id && onDeleteDoc(d.id)}
                  disabled={busy}
                  className="ml-3 shrink-0 text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
