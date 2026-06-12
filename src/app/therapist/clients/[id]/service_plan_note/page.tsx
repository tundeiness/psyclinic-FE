"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import {
  fetchServicePlanNote,
  createServicePlanNote,
  updateServicePlanNote,
  signServicePlanNote,
  ServicePlanNote,
  ServicePlanNoteInput,
} from "@/lib/servicePlanNoteApi";
import { downloadServicePlanNotePdf } from "@/lib/therapistApi";
import { isApiError } from "@/lib/apiError";
import { useToast } from "@/lib/useToast";

// Phase 16: service plan note — treatment-planning record written at
// session 2. One per client globally. Same pattern as the intake
// page: read or create, save drafts, save & sign (locks), download
// PDF (watermarked when unsigned).
export default function ServicePlanNotePage() {
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

  const [note, setNote] = useState<ServicePlanNote | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"saving" | "signing" | "downloading" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Form state — one entry per backend field.
  const [form, setForm] = useState<ServicePlanNoteInput>({
    assessment_summary: "",
    presenting_problems: "",
    treatment_goals: "",
    interventions_planned: "",
    session_frequency: "",
    estimated_duration: "",
    risk_considerations: "",
    discharge_criteria: "",
    prepared_on: "",
  });

  const hydrateForm = useCallback((n: ServicePlanNote | null) => {
    if (!n) return;
    setForm({
      assessment_summary: n.assessment_summary ?? "",
      presenting_problems: n.presenting_problems ?? "",
      treatment_goals: n.treatment_goals ?? "",
      interventions_planned: n.interventions_planned ?? "",
      session_frequency: n.session_frequency ?? "",
      estimated_duration: n.estimated_duration ?? "",
      risk_considerations: n.risk_considerations ?? "",
      discharge_criteria: n.discharge_criteria ?? "",
      prepared_on: n.prepared_on ?? "",
    });
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchServicePlanNote(clientId);
      setNote(r);
      hydrateForm(r);
    } catch (e) {
      setError(
        isApiError(e)
          ? e.code === "forbidden"
            ? "You don't have access to this client's service plan note."
            : e.message
          : "Could not load the service plan note."
      );
    } finally {
      setLoaded(true);
    }
  }, [clientId, hydrateForm]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  function updateField<K extends keyof ServicePlanNoteInput>(
    key: K,
    value: ServicePlanNoteInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSave() {
    setBusy("saving");
    setError(null);
    try {
      const r = note
        ? await updateServicePlanNote(clientId, form)
        : await createServicePlanNote(clientId, form);
      setNote(r);
      hydrateForm(r);
      toast.success("Draft saved");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not save the service plan note.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function onSign() {
    // Always save current form state before signing so the signed
    // record reflects what's on screen, not the last persisted state.
    setBusy("signing");
    setError(null);
    try {
      let target = note;
      target = target
        ? await updateServicePlanNote(clientId, form)
        : await createServicePlanNote(clientId, form);
      const signed = await signServicePlanNote(clientId);
      setNote(signed);
      hydrateForm(signed);
      void target; // referenced for clarity; not needed downstream
      toast.success("Service plan signed and locked");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not sign the service plan note.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function onDownloadPdf() {
    if (!note) return;
    setBusy("downloading");
    setError(null);
    try {
      const blob = await downloadServicePlanNotePdf(clientId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `service-plan-${clientId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (e) {
      const msg = isApiError(e) ? e.message : "Could not download PDF.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  if (!ready || !loaded) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  const locked = !!note?.signed;
  const fieldClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <a
        href={`/therapist/clients/${clientId}`}
        className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
      >
        ← Back to client
      </a>

      <div className="mb-1 mt-4 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">
          Service plan note
        </h1>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={busy !== null || !note}
          title={
            !note
              ? "Save the plan once before downloading."
              : "Download a Cerca-branded PDF."
          }
          className="rounded-xl border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "downloading" ? "Preparing…" : "Download PDF"}
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        One per client — typically written at the second session. Once
        signed, the plan is read-only.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {locked && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Signed{" "}
          {note?.signed_at
            ? `on ${new Date(note.signed_at).toLocaleDateString()}`
            : ""}
          {note?.signed_by_name ? ` by ${note.signed_by_name}` : ""}. This plan
          is locked.
        </div>
      )}

      <div className="space-y-5">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Plan details
          </h2>
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Prepared on
              <input
                type="date"
                value={form.prepared_on ?? ""}
                onChange={(e) => updateField("prepared_on", e.target.value)}
                disabled={locked || busy !== null}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Assessment summary
          </h2>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Clinical impression
            <textarea
              rows={4}
              value={form.assessment_summary ?? ""}
              onChange={(e) =>
                updateField("assessment_summary", e.target.value)
              }
              disabled={locked || busy !== null}
              className={fieldClass}
              placeholder="Concise clinical picture: presenting symptoms, severity, relevant history."
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Presenting problems
            <textarea
              rows={3}
              value={form.presenting_problems ?? ""}
              onChange={(e) =>
                updateField("presenting_problems", e.target.value)
              }
              disabled={locked || busy !== null}
              className={fieldClass}
              placeholder="The issues being treated, in clinical terms."
            />
          </label>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Treatment plan
          </h2>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Treatment goals
            <textarea
              rows={4}
              value={form.treatment_goals ?? ""}
              onChange={(e) => updateField("treatment_goals", e.target.value)}
              disabled={locked || busy !== null}
              className={fieldClass}
              placeholder="Measurable goals: what does success look like?"
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Interventions planned
            <textarea
              rows={4}
              value={form.interventions_planned ?? ""}
              onChange={(e) =>
                updateField("interventions_planned", e.target.value)
              }
              disabled={locked || busy !== null}
              className={fieldClass}
              placeholder="Modalities and techniques (CBT, EMDR, ACT, etc.)."
            />
          </label>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Logistics
          </h2>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Session frequency
            <input
              type="text"
              value={form.session_frequency ?? ""}
              onChange={(e) =>
                updateField("session_frequency", e.target.value)
              }
              disabled={locked || busy !== null}
              className={fieldClass}
              placeholder="e.g. Weekly for 6 weeks, then biweekly."
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Estimated duration
            <input
              type="text"
              value={form.estimated_duration ?? ""}
              onChange={(e) =>
                updateField("estimated_duration", e.target.value)
              }
              disabled={locked || busy !== null}
              className={fieldClass}
              placeholder="e.g. 12-16 sessions."
            />
          </label>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Risk considerations
          </h2>
          <textarea
            rows={3}
            value={form.risk_considerations ?? ""}
            onChange={(e) =>
              updateField("risk_considerations", e.target.value)
            }
            disabled={locked || busy !== null}
            className={`${fieldClass} mt-3`}
            placeholder="Anything that warrants clinical caution. Leave blank if no acute risk."
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Discharge criteria
          </h2>
          <textarea
            rows={3}
            value={form.discharge_criteria ?? ""}
            onChange={(e) => updateField("discharge_criteria", e.target.value)}
            disabled={locked || busy !== null}
            className={`${fieldClass} mt-3`}
            placeholder="What would conclude treatment — symptom thresholds, functional milestones, etc."
          />
        </section>
      </div>

      {!locked && (
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={busy !== null}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy === "saving" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={onSign}
            disabled={busy !== null}
            className="rounded-xl border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
          >
            {busy === "signing" ? "Signing…" : "Save & sign"}
          </button>
        </div>
      )}
    </main>
  );
}
