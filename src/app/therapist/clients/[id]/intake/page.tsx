"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import {
  fetchIntakeForm,
  createIntakeForm,
  updateIntakeForm,
  signIntakeForm,
  IntakeForm,
  IntakeFormInput,
} from "@/lib/intakeApi";
import { isApiError } from "@/lib/apiError";
import { IntakeFormView } from "@/components/IntakeFormView";

export default function IntakePage() {
  // Therapists and admins both reach this page; the backend authorizes.
  // We accept either client-side and let the API decide who can act on
  // a specific intake (admin can see any; therapist only their own
  // clients). Clients get bounced.
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);
  const allowed = !!user && (user.role === "therapist" || user.role === "admin");
  const ready = initialized && allowed;

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace("/forbidden?reason=role");
  }, [initialized, user, allowed, router]);

  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [intake, setIntake] = useState<IntakeForm | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchIntakeForm(clientId);
      setIntake(r);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You don't have access to this client's intake form."
            : e.message
          : "Could not load the intake form."
      );
    } finally {
      setLoaded(true);
    }
  }, [clientId]);

  useEffect(() => {
    if (ready && !Number.isNaN(clientId)) load();
  }, [ready, clientId, load]);

  async function onSave(input: IntakeFormInput) {
    setBusy(true);
    setError(null);
    try {
      const r = intake?.id
        ? await updateIntakeForm(clientId, input)
        : await createIntakeForm(clientId, input);
      setIntake(r);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.details?.join(", ") || e.message
          : "Could not save the intake form."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSign() {
    setBusy(true);
    setError(null);
    try {
      const r = await signIntakeForm(clientId);
      setIntake(r);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not sign the intake form.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !loaded) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <a
        href={`/therapist/clients/${clientId}`}
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to client
      </a>

      <h1 className="mb-1 mt-4 text-xl font-semibold text-slate-800">
        Intake form
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        One per client — completed at the first session.
      </p>

      <IntakeFormView
        intake={intake}
        busy={busy}
        error={error}
        onSave={onSave}
        onSign={onSign}
      />
    </main>
  );
}
