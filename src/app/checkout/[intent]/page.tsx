"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Alert } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchPayment,
  simulateMockPayment,
  Payment,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatNaira } from "@/lib/format";

// When real Stripe is wired up, NEXT_PUBLIC_PAYMENTS_MODE will be set
// to "stripe" and this whole page becomes unreachable / shows a
// fallback. Until then, it's the mock checkout simulator.
const PAYMENTS_MODE = process.env.NEXT_PUBLIC_PAYMENTS_MODE ?? "mock";

// Next.js 14 requires components that call useSearchParams() to be
// wrapped in a Suspense boundary.
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-5 py-10">
          <p className="text-sm text-slate-500">Loading checkout…</p>
        </main>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
  const { ready } = useRequireRole("client");
  const router = useRouter();
  const params = useParams<{ intent: string }>();
  const search = useSearchParams();

  const appointmentId = Number(search.get("appointment") || "0");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"succeed" | "fail" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The booking flow passes both appointment id and payment id in the
  // query string. If a user refreshes the page mid-flow, the URL
  // The booking flow passes appointment + payment IDs in the query
  // string. The block-purchase flow passes payment + block IDs. In
  // both cases the payment id is what we use to look up the amount;
  // the other ids are for post-success routing context.
  const load = useCallback(async () => {
    const paymentIdStr = search.get("payment");
    if (!paymentIdStr) {
      setError(
        "Payment context missing. Open this page from the booking or " +
        "block-purchase flow."
      );
      setLoaded(true);
      return;
    }
    setError(null);
    try {
      const p = await fetchPayment(Number(paymentIdStr));
      setPayment(p);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load payment.");
    } finally {
      setLoaded(true);
    }
  }, [search]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onSimulate(outcome: "succeed" | "fail") {
    setBusy(outcome);
    setError(null);
    try {
      const res = await simulateMockPayment(params.intent, outcome);
      if (res.payment_status === "succeeded") {
        // Route post-checkout based on what was paid for.
        if (res.payable_type === "SessionBlock" && res.session_block_id) {
          router.replace(`/blocks/purchased/${res.session_block_id}`);
        } else {
          router.replace(`/booking/confirmed/${appointmentId}`);
        }
      } else {
        // Failure: route back to the right "start over" page.
        if (res.payable_type === "SessionBlock") {
          router.replace("/buy-block?payment_failed=1");
        } else {
          router.replace("/book?payment_failed=1");
        }
      }
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Could not process the simulated payment."
      );
      setBusy(null);
    }
  }

  // Real-Stripe-mode runtime guard. Should also be excluded from the
  // build (see next.config.js), but defense in depth.
  if (PAYMENTS_MODE === "stripe") {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <Alert kind="error">
          This is the mock checkout page, which is disabled in Stripe
          mode. Please use the real checkout flow.
        </Alert>
      </main>
    );
  }

  if (!ready || !loaded) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <p className="text-sm text-slate-500">Loading checkout…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="mb-1 text-xl font-semibold text-brand-700">
        Mock checkout
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Stripe-shaped simulator. No real card is charged. When Stripe
        is configured, this page is replaced by Stripe&apos;s hosted
        checkout.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      {payment && (
        <Card className="mb-5">
          <p className="text-sm text-slate-600">Amount due</p>
          <p className="text-2xl font-semibold text-slate-800">
            {formatNaira(payment.amount_cents)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Intent: <code className="font-mono">{params.intent}</code>
          </p>
        </Card>
      )}

      <Card>
        <p className="mb-3 text-sm text-slate-700">
          Choose how the simulated card behaves:
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => onSimulate("succeed")}
            loading={busy === "succeed"}
            disabled={busy !== null || !!error}
          >
            Simulate success
          </Button>
          <Button
            variant="ghost"
            onClick={() => onSimulate("fail")}
            loading={busy === "fail"}
            disabled={busy !== null || !!error}
          >
            Simulate failure
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Closing this page leaves your appointment in{" "}
          <strong>pending payment</strong>. You can resume from your
          dashboard.
        </p>
      </Card>
    </main>
  );
}
