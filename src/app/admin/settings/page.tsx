"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, Field } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import { fetchSettings, updateSettings } from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";

export default function AdminSettingsPage() {
  // useRequireRole("admin") admits both real admins and co-admins. The
  // backend will 403 a co-admin on the PATCH; we additionally hide the
  // editor for co-admins to avoid a misleading UX.
  const { ready, user } = useRequireRole("admin");
  const isRealAdmin = user?.role === "admin";

  const [rateDollars, setRateDollars] = useState<string>("");
  const [saved, setSaved] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await fetchSettings();
      setSaved(s.flat_rate_cents);
      setRateDollars((s.flat_rate_cents / 100).toFixed(2));
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load settings.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(rateDollars || "0") * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setError("Enter a non-negative amount.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const s = await updateSettings({ flat_rate_cents: cents });
      setSaved(s.flat_rate_cents);
      // Reflect the persisted value back into the input so the user
      // sees a concrete normalized confirmation (e.g. "50" → "50.00").
      setRateDollars((s.flat_rate_cents / 100).toFixed(2));
      setNotice(
        `Flat rate saved: $${(s.flat_rate_cents / 100).toFixed(2)}`
      );
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
          Practice settings
        </h1>
        <Link href="/admin" className="text-sm text-brand-700 underline">
          ← Dashboard
        </Link>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <Card>
        <h2 className="text-base font-medium text-slate-800">
          Flat session rate
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Charged for every paid booking across the whole practice. A
          client&apos;s first session is always free.
        </p>

        {!isRealAdmin && (
          <Alert kind="info">
            Read-only. Only the admin can change this setting.
          </Alert>
        )}

        {saved !== null && (
          <p className="mt-3 text-sm text-slate-500">
            Currently:{" "}
            <strong className="text-slate-800">
              ${(saved / 100).toFixed(2)}
            </strong>
          </p>
        )}

        <form onSubmit={onSave} className="mt-4">
          <Field
            id="rate"
            label="Flat rate (USD)"
            type="number"
            min="0"
            step="0.01"
            value={rateDollars}
            disabled={!isRealAdmin || busy}
            onChange={(e) => {
              setRateDollars(e.target.value);
              if (notice) setNotice(null);
            }}
          />
          {isRealAdmin && (
            <Button type="submit" loading={busy}>
              Save
            </Button>
          )}
        </form>
      </Card>
    </main>
  );
}
