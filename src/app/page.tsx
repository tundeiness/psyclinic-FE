"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { Card, Button } from "@/components/ui";

type ApiStatus = "checking" | "online" | "offline";

export default function HomePage() {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    if (initialized && user) router.replace("/dashboard");
  }, [initialized, user, router]);

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    fetch(`${base}/up`)
      .then((r) => setStatus(r.ok ? "online" : "offline"))
      .catch(() => setStatus("offline"));
  }, []);

  if (!initialized || user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-800 p-8 text-white shadow-soft sm:p-12">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          PsyClinic
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Find the right therapist for you
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
          Browse our clinical psychologists, read about their focus areas,
          and book a session in minutes. Your first session is on us.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/therapists">
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-soft transition hover:bg-slate-100">
              Browse therapists
            </button>
          </Link>
          <Link href="/signup">
            <button className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
              Create an account
            </button>
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
            01 — Browse
          </p>
          <p className="mt-2 text-sm text-slate-600">
            See our therapists, their focus areas and experience.
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
            02 — Book
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Pick a date, choose a slot, and reserve in seconds.
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-accent-cyan-600">
            03 — Talk
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Meet your therapist. First session free, flat rate after.
          </p>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span
          className={[
            "inline-block h-2 w-2 rounded-full",
            status === "online"
              ? "bg-green-500"
              : status === "offline"
                ? "bg-red-500"
                : "bg-amber-400",
          ].join(" ")}
          aria-hidden
        />
        {status === "checking" && "Checking API connection…"}
        {status === "online" && "API connected (localhost:3000)"}
        {status === "offline" &&
          "API unreachable — is the backend running on :3000?"}
      </div>
    </main>
  );
}
