"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchSessionBlocks,
  purchaseSessionBlock,
  SessionBlock,
} from "@/lib/clientApi";
import { fetchPublicPricing } from "@/lib/publicApi";
import { isApiError } from "@/lib/apiError";
import { formatNaira } from "@/lib/format";

export default function BuyBlockPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-5 py-10">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <BuyBlockPageInner />
    </Suspense>
  );
}

function BuyBlockPageInner() {
  const { ready } = useRequireRole("client");
  const router = useRouter();
  const search = useSearchParams();

  const [blocks, setBlocks] = useState<SessionBlock[] | null>(null);
  const [blockPrice, setBlockPrice] = useState<number | null>(null);
  const [installmentFirst, setInstallmentFirst] = useState<number | null>(null);
  const [installmentSecond, setInstallmentSecond] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Per-mode busy so one button's spinner doesn't show on the other.
  const [busyMode, setBusyMode] = useState<"full" | "installment" | null>(null);

  const failed = search.get("payment_failed") === "1";

  const load = useCallback(async () => {
    setError(null);
    try {
      const [bs, s] = await Promise.all([
        fetchSessionBlocks(),
        fetchPublicPricing(),
      ]);
      setBlocks(bs);
      setBlockPrice(s.block_full_price_cents);
      setInstallmentFirst(s.installment_first_amount_cents);
      setInstallmentSecond(s.installment_second_amount_cents);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  // Active block with sessions remaining — purchase is blocked.
  const activeBlock = blocks?.find(
    (b) => b.status === "active" && b.sessions_remaining > 0
  );

  async function onPurchase(mode: "full" | "installment") {
    setBusyMode(mode);
    setError(null);
    try {
      const { session_block, payment } = await purchaseSessionBlock(mode);
      const intent = payment.provider_reference;
      if (!intent) {
        setError("Block created but no payment intent was returned.");
        setBusyMode(null);
        return;
      }
      router.push(
        `/checkout/${encodeURIComponent(intent)}?block=${session_block.id}&payment=${payment.id}`
      );
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not start the purchase.");
      setBusyMode(null);
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
      <h1 className="mb-1 text-xl font-semibold text-brand-700 sm:text-2xl">
        Buy a session block
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Purchase 6 normal sessions with your current therapist.
      </p>

      {failed && (
        <Alert kind="error">
          The previous payment didn&apos;t go through. You can try
          again below.
        </Alert>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      {activeBlock && (
        <Card className="mb-5 bg-amber-50/50 ring-1 ring-amber-100">
          <p className="text-sm font-semibold text-amber-900">
            You already have an active block
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            {activeBlock.sessions_remaining} of {activeBlock.sessions_total}{" "}
            sessions remaining with {activeBlock.therapist_name ?? "your therapist"}.
            Use those up before buying another.
          </p>
          <Link
            href="/book"
            className="mt-3 inline-block rounded-xl bg-amber-200 px-3 py-1.5 text-sm font-semibold text-amber-900 no-underline transition hover:bg-amber-300"
          >
            Go to booking
          </Link>
        </Card>
      )}

      {!activeBlock && (
        <>
          <Card className="mb-4">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pay in full
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-800">
                {blockPrice !== null ? formatNaira(blockPrice) : "…"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                One payment up front. Use all 6 sessions at your own pace.
              </p>
            </div>
            <Button
              onClick={() => onPurchase("full")}
              loading={busyMode === "full"}
              disabled={busyMode !== null}
            >
              Pay in full
            </Button>
          </Card>

          <Card>
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Installment plan (60% / 40%)
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {installmentFirst !== null
                  ? formatNaira(installmentFirst)
                  : "…"}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  up front
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Then{" "}
                {installmentSecond !== null
                  ? formatNaira(installmentSecond)
                  : "…"}{" "}
                after you&apos;ve used 3 sessions. You can&apos;t book
                session 4 until the remainder is paid.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => onPurchase("installment")}
              loading={busyMode === "installment"}
              disabled={busyMode !== null}
            >
              Start installment plan
            </Button>
          </Card>

          <p className="mt-3 text-xs text-slate-500">
            You&apos;ll be redirected to a Stripe-shaped mock checkout.
            No real card is charged.
          </p>
        </>
      )}

      <div className="mt-6">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}
