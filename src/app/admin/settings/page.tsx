"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Alert, Field } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchSettings,
  updateSettings,
  Settings,
} from "@/lib/adminApi";
import { isApiError } from "@/lib/apiError";

export default function AdminSettingsPage() {
  // useRequireRole("admin") admits both real admins and co-admins. The
  // backend will 403 a co-admin on the PATCH; we additionally hide the
  // editor for co-admins to avoid a misleading UX.
  const { ready, user } = useRequireRole("admin");
  const isRealAdmin = user?.role === "admin";

  // Legacy flat-rate (USD, cents). Will be retired in a later phase
  // along with the legacy booking flow. Kept here so existing tests
  // and deployment expectations don't regress unexpectedly.
  const [rateDollars, setRateDollars] = useState<string>("");
  const [savedFlatRate, setSavedFlatRate] = useState<number | null>(null);

  // v2 pricing — stored in kobo on the server (1 NGN = 100 kobo).
  // UI shows naira (whole) since fractional kobo isn't a practical
  // pricing unit for the clinic.
  const [assessmentNaira, setAssessmentNaira] = useState<string>("");
  const [blockNaira, setBlockNaira] = useState<string>("");
  const [firstPct, setFirstPct] = useState<string>("");
  const [secondPct, setSecondPct] = useState<string>("");
  const [installmentFirstKobo, setInstallmentFirstKobo] = useState<number | null>(null);
  const [installmentSecondKobo, setInstallmentSecondKobo] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function applySettings(s: Settings) {
    setSavedFlatRate(s.flat_rate_cents);
    setRateDollars((s.flat_rate_cents / 100).toFixed(2));

    // Server stores in kobo; show naira (integers, since kobo display
    // would be more digits than is useful for prices in the thousands
    // of naira).
    setAssessmentNaira(Math.round(s.assessment_session_price_cents / 100).toString());
    setBlockNaira(Math.round(s.block_full_price_cents / 100).toString());
    setFirstPct(s.block_installment_first_pct.toString());
    setSecondPct(s.block_installment_second_pct.toString());
    setInstallmentFirstKobo(s.installment_first_amount_cents);
    setInstallmentSecondKobo(s.installment_second_amount_cents);
  }

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await fetchSettings();
      applySettings(s);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load settings.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onSaveFlatRate(e: React.FormEvent) {
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
      applySettings(s);
      setNotice(`Flat rate saved: $${(s.flat_rate_cents / 100).toFixed(2)}`);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveV2Pricing(e: React.FormEvent) {
    e.preventDefault();
    const assessmentKobo = parseFloat(assessmentNaira || "0") * 100;
    const blockKobo = parseFloat(blockNaira || "0") * 100;
    const firstP = parseInt(firstPct || "0", 10);
    const secondP = parseInt(secondPct || "0", 10);

    if (![assessmentKobo, blockKobo].every((n) => Number.isFinite(n) && n >= 0)) {
      setError("Enter non-negative prices.");
      return;
    }
    if (firstP + secondP !== 100) {
      setError("Installment percentages must sum to 100.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const s = await updateSettings({
        assessment_session_price_cents: Math.round(assessmentKobo),
        block_full_price_cents: Math.round(blockKobo),
        block_installment_first_pct: firstP,
        block_installment_second_pct: secondP,
      });
      applySettings(s);
      setNotice("v2 pricing saved.");
    } catch (err) {
      if (isApiError(err)) {
        setError(err.details?.join(", ") || err.message);
      } else {
        setError("Could not save v2 pricing.");
      }
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
        <Link href="/admin" className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800">
          ← Dashboard
        </Link>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      {/* ---- v2 pricing (assessment + 6-session blocks + installment) ---- */}
      <Card className="mb-5">
        <h2 className="text-base font-medium text-slate-800">
          v2 pricing (₦, in naira)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Assessment session price (first session with a therapist) and
          6-session block price (subsequent normal sessions). Stored in
          kobo on the server; enter whole naira here. Stripe handles
          USD conversion at checkout for foreign cards (added in a
          later phase).
        </p>

        {!isRealAdmin && (
          <div className="mt-3">
            <Alert kind="info">
              Read-only. Only the admin can change pricing.
            </Alert>
          </div>
        )}

        <form onSubmit={onSaveV2Pricing} className="mt-4">
          <Field
            id="assessment_naira"
            label="Assessment session price (₦)"
            type="number"
            min="0"
            step="1"
            value={assessmentNaira}
            disabled={!isRealAdmin || busy}
            onChange={(e) => setAssessmentNaira(e.target.value)}
          />
          <Field
            id="block_naira"
            label="6-session block price (₦)"
            type="number"
            min="0"
            step="1"
            value={blockNaira}
            disabled={!isRealAdmin || busy}
            onChange={(e) => setBlockNaira(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="first_pct"
              label="First installment %"
              type="number"
              min="0"
              max="100"
              step="1"
              value={firstPct}
              disabled={!isRealAdmin || busy}
              onChange={(e) => setFirstPct(e.target.value)}
            />
            <Field
              id="second_pct"
              label="Second installment %"
              type="number"
              min="0"
              max="100"
              step="1"
              value={secondPct}
              disabled={!isRealAdmin || busy}
              onChange={(e) => setSecondPct(e.target.value)}
            />
          </div>

          {installmentFirstKobo !== null && installmentSecondKobo !== null && (
            <p className="mb-3 text-xs text-slate-500">
              Computed installments: ₦
              {Math.round(installmentFirstKobo / 100).toLocaleString()} up
              front + ₦
              {Math.round(installmentSecondKobo / 100).toLocaleString()}{" "}
              after 3 sessions.
            </p>
          )}

          {isRealAdmin && (
            <Button type="submit" loading={busy}>
              Save v2 pricing
            </Button>
          )}
        </form>
      </Card>

      {/* ---- Legacy flat-rate (kept for now; retired in a later phase) ---- */}
      <Card>
        <h2 className="text-base font-medium text-slate-800">
          Legacy flat session rate
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Used by the original booking flow before the v2 pricing model.
          Will be retired in an upcoming release.
        </p>

        {savedFlatRate !== null && (
          <p className="mt-3 text-sm text-slate-500">
            Currently:{" "}
            <strong className="text-slate-800">
              ${(savedFlatRate / 100).toFixed(2)}
            </strong>
          </p>
        )}

        <form onSubmit={onSaveFlatRate} className="mt-4">
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
              Save flat rate
            </Button>
          )}
        </form>
      </Card>
    </main>
  );
}
