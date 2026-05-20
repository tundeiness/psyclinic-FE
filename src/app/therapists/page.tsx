"use client";

import { useEffect, useState } from "react";
import { Card, Alert } from "@/components/ui";
import { fetchPublicTherapists, PublicTherapist } from "@/lib/publicApi";
import { isApiError } from "@/lib/apiError";

function rate(cents: number) {
  return cents > 0 ? `$${(cents / 100).toFixed(0)}/session` : "Rate on request";
}

export default function TherapistsPage() {
  const [list, setList] = useState<PublicTherapist[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicTherapists()
      .then(setList)
      .catch((e) =>
        setError(isApiError(e) ? e.message : "Could not load therapists.")
      );
  }, []);

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
          Read about each therapist before creating an account to book.
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
        {list?.map((t) => (
          <Card key={t.id}>
            <h2 className="text-base font-semibold text-slate-800">
              {t.full_name}
            </h2>
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
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                {t.years_experience
                  ? `${t.years_experience} yrs experience`
                  : "Experience N/A"}
              </span>
              <span className="font-medium text-slate-700">
                {rate(t.hourly_rate_cents)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
