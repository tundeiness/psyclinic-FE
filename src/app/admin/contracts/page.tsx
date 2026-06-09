"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Alert } from "@/components/ui";
import { useAppSelector } from "@/store";
import { hasAdminAccess } from "@/store/authSlice";
import {
  fetchPendingContracts,
  certifyContract,
  fetchContractDocument,
  AdminClientContract,
} from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime } from "@/lib/format";

export default function AdminContractsPage() {
  // Admin OR therapist can certify. Inline check rather than
  // extending useRequireRole to accept role arrays.
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);
  const allowed =
    !!user && (hasAdminAccess(user) || user.role === "therapist");

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace("/forbidden?reason=role");
  }, [initialized, user, allowed, router]);

  const ready = initialized && allowed;

  const [list, setList] = useState<AdminClientContract[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const items = await fetchPendingContracts();
      setList(items);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load contracts.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onCertify(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await certifyContract(id);
      await load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not certify.");
    } finally {
      setBusyId(null);
    }
  }

  async function onView(id: number) {
    try {
      const blob = await fetchContractDocument(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load document.");
    }
  }

  if (!ready) {
    return (
      <main className="px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-slate-800 sm:text-2xl">
        Contract certification queue
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Verify uploaded signed contracts. After certification, the
        client can purchase a session block.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {!list && <p className="text-sm text-slate-500">Loading…</p>}

      {list && list.length === 0 && (
        <Alert kind="info">No contracts awaiting certification.</Alert>
      )}

      <div className="space-y-3">
        {list?.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">{c.client_name}</p>
                <p className="text-xs text-slate-500">{c.client_email}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Uploaded {formatDateTime(c.signed_at)}
                </p>
                {c.sponsor_name && (
                  <p className="mt-1 text-xs text-slate-600">
                    Sponsor: {c.sponsor_name}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Version {c.contract_version}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="!w-auto"
                  onClick={() => onView(c.id)}
                  disabled={!c.has_uploaded_document}
                >
                  View document
                </Button>
                <Button
                  className="!w-auto"
                  onClick={() => onCertify(c.id)}
                  loading={busyId === c.id}
                  disabled={busyId !== null}
                >
                  Certify
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
