"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchAdminTherapists,
  deleteAdminTherapist,
  promoteCoAdmin,
  demoteCoAdmin,
  AdminTherapist,
} from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";

export default function AdminTherapistsPage() {
  // Co-admins can view this page; the backend forbids the
  // promote/demote actions for non-admins. We additionally hide the
  // toggle for non-admins below to keep the UX honest.
  const { ready, user } = useRequireRole("admin");
  const isRealAdmin = user?.role === "admin";

  const [list, setList] = useState<AdminTherapist[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await fetchAdminTherapists());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load therapists.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function remove(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await deleteAdminTherapist(id);
      setConfirmId(null);
      await load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not remove therapist.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleCoAdmin(t: AdminTherapist) {
    setBusyId(t.id);
    setError(null);
    try {
      if (t.co_admin) await demoteCoAdmin(t.id);
      else await promoteCoAdmin(t.id);
      await load();
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Could not change co-admin status."
      );
    } finally {
      setBusyId(null);
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
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
          Therapists
        </h1>
        <Link href="/admin" className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800">
          ← Dashboard
        </Link>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {!list && <LoadingState label="Loading therapists…" />}
      {list && list.length === 0 && (
        <Alert kind="info">No therapists registered.</Alert>
      )}

      <div className="space-y-3">
        {list?.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800">
                    {t.user.full_name}
                  </p>
                  {t.co_admin && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Co-admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{t.user.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {t.specializations.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
              {confirmId === t.id ? (
                <div className="flex flex-col gap-2">
                  <Button
                    className="!w-auto"
                    loading={busyId === t.id}
                    onClick={() => remove(t.id)}
                  >
                    Confirm remove
                  </Button>
                  <Button
                    variant="ghost"
                    className="!w-auto"
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {isRealAdmin && (
                    <Button
                      variant="ghost"
                      className="!w-auto"
                      loading={busyId === t.id}
                      onClick={() => toggleCoAdmin(t)}
                    >
                      {t.co_admin ? "Demote co-admin" : "Promote to co-admin"}
                    </Button>
                  )}
                  {isRealAdmin && (
                    <Button
                      variant="ghost"
                      className="!w-auto"
                      onClick={() => setConfirmId(t.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
