"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Alert, Button, TextArea } from "@/components/ui";
import { fetchPublicTherapists, PublicTherapist } from "@/lib/publicApi";
import {
  previewTherapistSwitch,
  switchTherapist,
  TherapistSwitchPreview,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { useAppSelector } from "@/store";

export default function TherapistsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [list, setList] = useState<PublicTherapist[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Switch confirmation modal state. When non-null, the modal is
  // shown for that therapist.
  const [switchTarget, setSwitchTarget] = useState<PublicTherapist | null>(null);

  useEffect(() => {
    fetchPublicTherapists()
      .then(setList)
      .catch((e) =>
        setError(isApiError(e) ? e.message : "Could not load therapists.")
      );
  }, []);

  const isClient = user?.role === "client";
  const currentTherapistId = user?.client_profile?.current_therapist_id ?? null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          Therapists
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Meet our team
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/80">
          {isClient
            ? "Choose a therapist to start with, or switch to a different one."
            : "Read about each therapist before creating an account to book."}
        </p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {!list && !error && (
        <p className="text-sm text-slate-500">Loading therapists…</p>
      )}

      {list && list.length === 0 && (
        <Alert kind="info">
          No therapists are available to display yet.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list?.map((t) => {
          const isCurrent = isClient && t.id === currentTherapistId;
          const isOther = isClient && t.id !== currentTherapistId;
          return (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-800">
                  {t.full_name}
                </h2>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    Your therapist
                  </span>
                )}
              </div>
              {t.headline && (
                <p className="mt-0.5 text-sm text-brand-600">{t.headline}</p>
              )}
              {t.bio && (
                <p className="mt-2 line-clamp-4 text-sm text-slate-600">
                  {t.bio}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.specializations.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <span>
                  {t.years_experience
                    ? `${t.years_experience} yrs experience`
                    : "Experience N/A"}
                </span>
              </div>
              {isOther && (
                <Button
                  variant="ghost"
                  className="mt-3 !w-auto"
                  onClick={() => setSwitchTarget(t)}
                >
                  {currentTherapistId
                    ? "Switch to this therapist"
                    : "Choose this therapist"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {switchTarget && (
        <SwitchConfirmModal
          target={switchTarget}
          onClose={() => setSwitchTarget(null)}
        />
      )}
    </main>
  );
}

// Modal shown when a logged-in client clicks "Switch to this
// therapist." Fetches the preview (so we can show concrete numbers
// of forfeited sessions and pending appointments), then on confirm
// calls the switch endpoint. Slides in per the Phase 12+ animation
// convention.
function SwitchConfirmModal({
  target,
  onClose,
}: {
  target: PublicTherapist;
  onClose: () => void;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<TherapistSwitchPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    previewTherapistSwitch(target.id)
      .then(setPreview)
      .catch((e) =>
        setError(isApiError(e) ? e.message : "Could not preview switch.")
      );
  }, [target.id]);

  async function onConfirm() {
    setBusy(true);
    setError(null);
    try {
      await switchTherapist({
        to_therapist_profile_id: target.id,
        reason: reason.trim() || undefined,
      });
      // Drop them on the dashboard with a fresh page so the client
      // profile data is reloaded (current_therapist_id will have
      // changed).
      router.refresh();
      window.location.href = "/dashboard?switched=1";
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not switch therapist.");
      setBusy(false);
    }
  }

  const canConfirm = preview?.can_switch === true;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-lg font-semibold text-slate-800">
          Switch to {target.full_name}?
        </h2>

        {error && (
          <div className="mt-3">
            <Alert kind="error">{error}</Alert>
          </div>
        )}

        {!preview && !error && (
          <p className="mt-3 text-sm text-slate-500">Loading preview…</p>
        )}

        {preview && (
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {preview.current_therapist && (
              <p>
                Currently treating with{" "}
                <strong>{preview.current_therapist.full_name}</strong>.
              </p>
            )}
            {preview.forfeited_sessions_count > 0 && (
              <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                <p className="font-medium text-amber-900">
                  {preview.forfeited_sessions_count} unused session
                  {preview.forfeited_sessions_count === 1 ? "" : "s"} will be
                  forfeited
                </p>
                <p className="mt-1 text-xs text-amber-900/80">
                  Per the clinic&apos;s policy, fees for unused sessions
                  are non-refundable.
                </p>
              </div>
            )}
            {preview.pending_appointments_count > 0 && (
              <div className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-100">
                <p className="font-medium text-rose-900">
                  You have {preview.pending_appointments_count} upcoming
                  appointment
                  {preview.pending_appointments_count === 1 ? "" : "s"} with
                  your current therapist
                </p>
                <p className="mt-1 text-xs text-rose-900/80">
                  Please cancel these from{" "}
                  <a href="/appointments" className="underline">
                    My appointments
                  </a>{" "}
                  before switching.
                </p>
              </div>
            )}
            <p className="text-xs text-slate-600">
              Your first session with {target.full_name} will be an
              assessment (&#x20A6;50,000).
            </p>
            {canConfirm && (
              <TextArea
                id="switch_reason"
                label="Reason for switching (optional)"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Helps us improve. Visible to clinic staff."
              />
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" className="!w-auto" onClick={onClose}>
            Cancel
          </Button>
          {canConfirm && (
            <Button
              className="!w-auto"
              loading={busy}
              disabled={busy}
              onClick={onConfirm}
            >
              Confirm switch
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
