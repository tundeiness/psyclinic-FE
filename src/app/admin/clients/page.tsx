"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, LoadingState } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchAdminClients,
  deleteAdminClient,
  AdminClient,
} from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";

export default function AdminClientsPage() {
  const { ready } = useRequireRole("admin");
  const [list, setList] = useState<AdminClient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await fetchAdminClients());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load clients.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function remove(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await deleteAdminClient(id);
      setConfirmId(null);
      await load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not remove client.");
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
          Clients
        </h1>
        <Link href="/admin" className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800">
          ← Dashboard
        </Link>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {!list && <LoadingState label="Loading clients…" />}
      {list && list.length === 0 && (
        <Alert kind="info">No clients registered.</Alert>
      )}

      <div className="space-y-3">
        {list?.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">
                  {c.user.full_name}
                </p>
                <p className="text-sm text-slate-500">{c.user.email}</p>
              </div>
              {confirmId === c.id ? (
                <div className="flex flex-col gap-2">
                  <Button
                    className="!w-auto"
                    loading={busyId === c.id}
                    onClick={() => remove(c.id)}
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
                <Button
                  variant="ghost"
                  className="!w-auto"
                  onClick={() => setConfirmId(c.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
