"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import { fetchSessionBlocks, SessionBlock } from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";

export default function BlockPurchasedPage() {
  const { ready } = useRequireRole("client");
  const params = useParams<{ id: string }>();
  const blockId = Number(params.id);

  const [block, setBlock] = useState<SessionBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await fetchSessionBlocks();
      setBlock(all.find((b) => b.id === blockId) ?? null);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load block details.");
    } finally {
      setLoaded(true);
    }
  }, [blockId]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  if (!ready || !loaded) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      {error && <Alert kind="error">{error}</Alert>}

      {block && (
        <>
          <Alert kind="success">
            Payment successful — your session block is ready.
          </Alert>

          <Card className="mt-5">
            <h1 className="text-lg font-semibold text-slate-800">
              Your 6-session block
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              With <strong>{block.therapist_name}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {block.sessions_remaining} of {block.sessions_total} sessions
              remaining.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              You can now book normal sessions with your therapist.
              Each booking uses one session from this block.
            </p>
          </Card>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/book"
              className="rounded-xl bg-brand-500 px-3 py-2 text-center text-sm font-semibold text-white no-underline transition hover:bg-brand-600"
            >
              Book a session
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-200"
            >
              Dashboard
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
