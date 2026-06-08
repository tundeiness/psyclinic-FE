"use client";

import { useState } from "react";
import { Card, Field, Button, Alert } from "@/components/ui";
import {
  IntakeForm,
  IntakeFormInput,
  IntakeMedication,
  IntakeHistoryEntry,
  IntakeFamilyTreeEntry,
  IntakeSubstanceUseEntry,
} from "@/lib/intakeApi";

type Section<T> = T[];

// Convert form record → mutable input (strip server-only fields).
function toInput(record: IntakeForm | null): IntakeFormInput {
  if (!record) return { medications: [], history: [], family_tree: [], substance_use: [] };
  // Build the input by copying only the editable fields. Avoids
  // having to strip server-only fields by destructure-rest (which
  // creates lint warnings for the discarded names).
  return {
    session_date: record.session_date,
    session_start_time: record.session_start_time,
    session_end_time: record.session_end_time,
    preferred_address: record.preferred_address,
    date_of_birth: record.date_of_birth,
    age_at_intake: record.age_at_intake,
    phone_number: record.phone_number,
    state_of_origin: record.state_of_origin,
    sex: record.sex,
    relationship_status: record.relationship_status,
    gender_identity: record.gender_identity,
    email_address: record.email_address,
    home_address: record.home_address,
    profession: record.profession,
    work_hours: record.work_hours,
    religion_spirituality: record.religion_spirituality,
    referral_source: record.referral_source,
    presenting_complaint: record.presenting_complaint,
    therapy_goals: record.therapy_goals,
    self_harm_history: record.self_harm_history,
    self_harm_details: record.self_harm_details,
    suicidal_ideations: record.suicidal_ideations,
    suicide_plan_present: record.suicide_plan_present,
    suicide_means_available: record.suicide_means_available,
    prior_therapy: record.prior_therapy,
    prior_therapy_details: record.prior_therapy_details,
    medications: record.medications ?? [],
    history: record.history ?? [],
    family_tree: record.family_tree ?? [],
    substance_use: record.substance_use ?? [],
    living_conditions: record.living_conditions,
    other_concerns: record.other_concerns,
    legal_proceedings: record.legal_proceedings,
    legal_proceedings_details: record.legal_proceedings_details,
    legal_proceedings_status: record.legal_proceedings_status,
    emergency_contact_name: record.emergency_contact_name,
    emergency_contact_relationship: record.emergency_contact_relationship,
    emergency_contact_phone: record.emergency_contact_phone,
    emergency_contact_address: record.emergency_contact_address,
    other_details: record.other_details,
    case_formulation: record.case_formulation,
    provisional_diagnoses: record.provisional_diagnoses,
    treatment_plan: record.treatment_plan,
  };
}

interface Props {
  intake: IntakeForm | null;
  busy?: boolean;
  error?: string | null;
  onSave: (input: IntakeFormInput) => void | Promise<void>;
  onSign: () => void | Promise<void>;
}

export function IntakeFormView({ intake, busy, error, onSave, onSign }: Props) {
  const [form, setForm] = useState<IntakeFormInput>(() => toInput(intake));
  const signed = intake?.signed === true;

  // Generic field updater.
  function set<K extends keyof IntakeFormInput>(key: K, value: IntakeFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Generic JSONB-section list updater.
  function setSection<T>(key: keyof IntakeFormInput, list: Section<T>) {
    setForm((f) => ({ ...f, [key]: list as IntakeFormInput[typeof key] }));
  }

  function addRow<T>(key: keyof IntakeFormInput, blank: T) {
    setSection(key, [...(form[key] as Section<T>) ?? [], blank]);
  }

  function removeRow(key: keyof IntakeFormInput, idx: number) {
    const list = [...((form[key] as Section<unknown>) ?? [])];
    list.splice(idx, 1);
    setSection(key, list);
  }

  function updateRow<T>(key: keyof IntakeFormInput, idx: number, patch: Partial<T>) {
    const list = [...((form[key] as Section<T>) ?? [])];
    list[idx] = { ...list[idx], ...patch };
    setSection(key, list);
  }

  // Readonly helper: signed forms render inputs disabled so people can
  // still read content but not edit it. Visually we'll keep them as
  // text inputs rather than turning into plain text so layout doesn't
  // jump between modes.
  const ro = signed;

  return (
    <>
      {error && <Alert kind="error">{error}</Alert>}

      {signed && (
        <Alert kind="info">
          Signed {intake?.signed_at ? new Date(intake.signed_at).toLocaleString() : ""}
          {intake?.signed_by_name ? ` by ${intake.signed_by_name}` : ""}. This intake is now read-only.
        </Alert>
      )}

      {/* ---- SESSION METADATA ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Session
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            id="session_date" label="Date" type="date"
            value={form.session_date ?? ""}
            onChange={(e) => set("session_date", e.target.value)}
            disabled={ro}
          />
          <Field
            id="session_start_time" label="Start time" type="time"
            value={form.session_start_time ?? ""}
            onChange={(e) => set("session_start_time", e.target.value)}
            disabled={ro}
          />
          <Field
            id="session_end_time" label="End time" type="time"
            value={form.session_end_time ?? ""}
            onChange={(e) => set("session_end_time", e.target.value)}
            disabled={ro}
          />
        </div>
      </Card>

      {/* ---- DEMOGRAPHICS ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Demographics
        </h2>
        <Field
          id="preferred_address" label="How does the client prefer to be addressed?"
          value={form.preferred_address ?? ""}
          onChange={(e) => set("preferred_address", e.target.value)}
          disabled={ro}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="date_of_birth" label="Date of birth" type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => set("date_of_birth", e.target.value)}
            disabled={ro}
          />
          <Field
            id="age_at_intake" label="Age at intake" type="number"
            value={form.age_at_intake?.toString() ?? ""}
            onChange={(e) => set("age_at_intake", e.target.value ? Number(e.target.value) : null)}
            disabled={ro}
          />
          <Field
            id="phone_number" label="Phone"
            value={form.phone_number ?? ""}
            onChange={(e) => set("phone_number", e.target.value)}
            disabled={ro}
          />
          <Field
            id="state_of_origin" label="State of origin"
            value={form.state_of_origin ?? ""}
            onChange={(e) => set("state_of_origin", e.target.value)}
            disabled={ro}
          />
          <Field
            id="sex" label="Sex"
            value={form.sex ?? ""}
            onChange={(e) => set("sex", e.target.value)}
            disabled={ro}
          />
          <Field
            id="relationship_status" label="Relationship status"
            value={form.relationship_status ?? ""}
            onChange={(e) => set("relationship_status", e.target.value)}
            disabled={ro}
          />
          <Field
            id="gender_identity" label="Gender identity"
            value={form.gender_identity ?? ""}
            onChange={(e) => set("gender_identity", e.target.value)}
            disabled={ro}
          />
          <Field
            id="email_address" label="Email" type="email"
            value={form.email_address ?? ""}
            onChange={(e) => set("email_address", e.target.value)}
            disabled={ro}
          />
        </div>
        <TextArea
          label="Home address"
          value={form.home_address ?? ""}
          onChange={(v) => set("home_address", v)}
          disabled={ro}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="profession" label="Profession"
            value={form.profession ?? ""}
            onChange={(e) => set("profession", e.target.value)}
            disabled={ro}
          />
          <Field
            id="work_hours" label="Nature of work hours"
            value={form.work_hours ?? ""}
            onChange={(e) => set("work_hours", e.target.value)}
            disabled={ro}
          />
        </div>
        <TextArea
          label="Religion / views on spirituality"
          value={form.religion_spirituality ?? ""}
          onChange={(v) => set("religion_spirituality", v)}
          disabled={ro}
        />
        <TextArea
          label="Who referred client to psychotherapy?"
          value={form.referral_source ?? ""}
          onChange={(v) => set("referral_source", v)}
          disabled={ro}
        />
      </Card>

      {/* ---- PRESENTING COMPLAINT + GOALS ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Presenting complaint and goals
        </h2>
        <TextArea
          label="What brings client to therapy?"
          value={form.presenting_complaint ?? ""}
          onChange={(v) => set("presenting_complaint", v)}
          disabled={ro}
          rows={4}
        />
        <TextArea
          label="What does client hope to achieve through therapy?"
          value={form.therapy_goals ?? ""}
          onChange={(v) => set("therapy_goals", v)}
          disabled={ro}
          rows={3}
        />
      </Card>

      {/* ---- SUICIDE RISK SCREEN (high-importance, visually flagged) ---- */}
      <Card className="mb-5 bg-rose-50/50 ring-1 ring-rose-100">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-rose-700">
          Suicide risk screen
        </h2>
        <p className="mb-3 text-xs text-rose-700/80">
          Treat this section with care. Affirmative responses warrant
          immediate clinical attention and follow your practice&apos;s
          safety protocols.
        </p>
        <YesNoNull
          label="Is there a history of self-harm or suicide attempts?"
          value={form.self_harm_history ?? null}
          onChange={(v) => set("self_harm_history", v)}
          disabled={ro}
        />
        <TextArea
          label="Details (if any)"
          value={form.self_harm_details ?? ""}
          onChange={(v) => set("self_harm_details", v)}
          disabled={ro}
        />
        <Field
          id="suicidal_ideations" label="Suicidal ideations (past / present / none)"
          value={form.suicidal_ideations ?? ""}
          onChange={(e) => set("suicidal_ideations", e.target.value)}
          disabled={ro}
        />
        <YesNoNull
          label="Does client have a plan?"
          value={form.suicide_plan_present ?? null}
          onChange={(v) => set("suicide_plan_present", v)}
          disabled={ro}
        />
        <YesNoNull
          label="Is the means available?"
          value={form.suicide_means_available ?? null}
          onChange={(v) => set("suicide_means_available", v)}
          disabled={ro}
        />
      </Card>

      {/* ---- PRIOR THERAPY ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Prior therapy
        </h2>
        <YesNoNull
          label="Has client been to therapy before?"
          value={form.prior_therapy ?? null}
          onChange={(v) => set("prior_therapy", v)}
          disabled={ro}
        />
        <TextArea
          label="If yes, when?"
          value={form.prior_therapy_details ?? ""}
          onChange={(v) => set("prior_therapy_details", v)}
          disabled={ro}
        />
      </Card>

      {/* ---- MEDICATIONS ---- */}
      <Card className="mb-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Medications, supplements, vitamins
        </h2>
        <p className="mb-3 text-xs text-slate-500">Skip if none.</p>
        <Repeater
          rows={form.medications ?? []}
          columns={[
            { key: "drug", label: "Drug", w: "20%" },
            { key: "dosage", label: "Dosage", w: "15%" },
            { key: "started", label: "Started", w: "15%" },
            { key: "ends", label: "Ends", w: "15%" },
            { key: "medical_condition", label: "Medical condition", w: "35%" },
          ]}
          onUpdate={(i, patch) => updateRow<IntakeMedication>("medications", i, patch)}
          onRemove={(i) => removeRow("medications", i)}
          onAdd={() => addRow<IntakeMedication>("medications", {})}
          disabled={ro}
        />
      </Card>

      {/* ---- LIVING + OTHER ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Living conditions and concerns
        </h2>
        <TextArea
          label="Living conditions"
          value={form.living_conditions ?? ""}
          onChange={(v) => set("living_conditions", v)}
          disabled={ro}
        />
        <TextArea
          label="Any other concerns client would like to share?"
          value={form.other_concerns ?? ""}
          onChange={(v) => set("other_concerns", v)}
          disabled={ro}
        />
      </Card>

      {/* ---- LEGAL ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Legal proceedings
        </h2>
        <YesNoNull
          label="Has client been involved in any legal proceedings?"
          value={form.legal_proceedings ?? null}
          onChange={(v) => set("legal_proceedings", v)}
          disabled={ro}
        />
        <TextArea
          label="Details"
          value={form.legal_proceedings_details ?? ""}
          onChange={(v) => set("legal_proceedings_details", v)}
          disabled={ro}
        />
        <Field
          id="legal_status" label="Current status of legal proceedings"
          value={form.legal_proceedings_status ?? ""}
          onChange={(e) => set("legal_proceedings_status", e.target.value)}
          disabled={ro}
        />
      </Card>

      {/* ---- EMERGENCY CONTACT ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Emergency contact
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="ec_name" label="Name"
            value={form.emergency_contact_name ?? ""}
            onChange={(e) => set("emergency_contact_name", e.target.value)}
            disabled={ro}
          />
          <Field
            id="ec_rel" label="Relationship"
            value={form.emergency_contact_relationship ?? ""}
            onChange={(e) => set("emergency_contact_relationship", e.target.value)}
            disabled={ro}
          />
          <Field
            id="ec_phone" label="Phone number"
            value={form.emergency_contact_phone ?? ""}
            onChange={(e) => set("emergency_contact_phone", e.target.value)}
            disabled={ro}
          />
        </div>
        <TextArea
          label="Address"
          value={form.emergency_contact_address ?? ""}
          onChange={(v) => set("emergency_contact_address", v)}
          disabled={ro}
        />
      </Card>

      {/* ---- HISTORY TABLE ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          History
        </h2>
        <Repeater
          rows={form.history ?? []}
          columns={[
            { key: "period", label: "Period", w: "20%" },
            { key: "career_academic_event", label: "Career / academic event", w: "40%" },
            { key: "social_details", label: "Social details", w: "40%" },
          ]}
          onUpdate={(i, patch) => updateRow<IntakeHistoryEntry>("history", i, patch)}
          onRemove={(i) => removeRow("history", i)}
          onAdd={() => addRow<IntakeHistoryEntry>("history", {})}
          disabled={ro}
        />
      </Card>

      {/* ---- FAMILY TREE TABLE ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Family tree
        </h2>
        <Repeater
          rows={form.family_tree ?? []}
          columns={[
            { key: "relation", label: "Relation", w: "20%" },
            { key: "relationship_progression", label: "Relationship progression", w: "40%" },
            { key: "current_state", label: "Current state of relationship", w: "40%" },
          ]}
          onUpdate={(i, patch) => updateRow<IntakeFamilyTreeEntry>("family_tree", i, patch)}
          onRemove={(i) => removeRow("family_tree", i)}
          onAdd={() => addRow<IntakeFamilyTreeEntry>("family_tree", {})}
          disabled={ro}
        />
      </Card>

      {/* ---- SUBSTANCE USE TABLE ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Substance use
        </h2>
        <Repeater
          rows={form.substance_use ?? []}
          columns={[
            { key: "substance", label: "Substance", w: "25%" },
            { key: "frequency_mode", label: "Frequency and mode of use", w: "35%" },
            { key: "onset_progression", label: "Onset and progression", w: "40%" },
          ]}
          onUpdate={(i, patch) => updateRow<IntakeSubstanceUseEntry>("substance_use", i, patch)}
          onRemove={(i) => removeRow("substance_use", i)}
          onAdd={() => addRow<IntakeSubstanceUseEntry>("substance_use", {})}
          disabled={ro}
        />
      </Card>

      {/* ---- OTHER DETAILS ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Other details to note
        </h2>
        <TextArea
          label=""
          value={form.other_details ?? ""}
          onChange={(v) => set("other_details", v)}
          disabled={ro}
          rows={4}
        />
      </Card>

      {/* ---- SUMMARY ---- */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Summary
        </h2>
        <TextArea
          label="Case formulation"
          value={form.case_formulation ?? ""}
          onChange={(v) => set("case_formulation", v)}
          disabled={ro}
          rows={5}
        />
        <TextArea
          label="Provisional diagnoses"
          value={form.provisional_diagnoses ?? ""}
          onChange={(v) => set("provisional_diagnoses", v)}
          disabled={ro}
          rows={3}
        />
        <TextArea
          label="Treatment plan"
          value={form.treatment_plan ?? ""}
          onChange={(v) => set("treatment_plan", v)}
          disabled={ro}
          rows={5}
        />
      </Card>

      {/* ---- ACTIONS ---- */}
      {!signed && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onSave(form)}
            loading={busy}
            className="!w-auto"
            variant="ghost"
          >
            Save draft
          </Button>
          <Button
            onClick={async () => {
              await onSave(form);
              if (confirm("Sign this intake form? Once signed it cannot be edited.")) {
                await onSign();
              }
            }}
            loading={busy}
            className="!w-auto"
          >
            Save &amp; sign
          </Button>
        </div>
      )}

      {intake?.author_name && (
        <p className="mt-4 text-xs text-slate-500">
          Authored by {intake.author_name}.
        </p>
      )}
    </>
  );
}

// ---------- internal helpers ----------

function TextArea({
  label, value, onChange, disabled, rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div className="mb-3">
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className="w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-600"
      />
    </div>
  );
}

function YesNoNull({
  label, value, onChange, disabled,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex gap-2">
        {([
          [null, "Not asked"],
          [false, "No"],
          [true, "Yes"],
        ] as [boolean | null, string][]).map(([v, lbl]) => {
          const active = value === v;
          return (
            <button
              key={String(v)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(v)}
              className={[
                "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                active
                  ? (v === true ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                      : v === false ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      : "bg-slate-200 text-slate-700")
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface RepeaterColumn {
  key: string;
  label: string;
  w?: string;
}

function Repeater<T extends object>({
  rows, columns, onUpdate, onRemove, onAdd, disabled,
}: {
  rows: T[];
  columns: RepeaterColumn[];
  onUpdate: (idx: number, patch: Partial<T>) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="border-b border-slate-200 pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                style={c.w ? { width: c.w } : {}}
              >
                {c.label}
              </th>
            ))}
            {!disabled && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="py-3 text-center text-xs text-slate-400">
                No rows yet.
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className="py-1 pr-2">
                  <input
                    type="text"
                    value={((row as Record<string, unknown>)[c.key] as string) ?? ""}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(i, { [c.key]: e.target.value } as Partial<T>)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white/70 px-2 py-1 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
                  />
                </td>
              ))}
              {!disabled && (
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="text-xs text-slate-500 hover:text-red-600"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
        >
          + Add row
        </button>
      )}
    </div>
  );
}
