"use client";

import { useEffect, useState } from "react";

type ApiStatus = "checking" | "online" | "offline";

export default function HomePage() {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    fetch(`${base}/up`)
      .then((r) => setStatus(r.ok ? "online" : "offline"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10 sm:max-w-2xl">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-brand-700 sm:text-3xl">
          PsyClinic
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Find a therapist and book a session.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Welcome</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This is the foundation slice. Auth, the public therapist
          directory, booking, payments, and dashboards arrive in the next
          slices.
        </p>

        <div className="mt-6 flex items-center gap-2 text-sm">
          <span
            className={[
              "inline-block h-2.5 w-2.5 rounded-full",
              status === "online"
                ? "bg-green-500"
                : status === "offline"
                  ? "bg-red-500"
                  : "bg-amber-400",
            ].join(" ")}
            aria-hidden
          />
          <span className="text-slate-700">
            {status === "checking" && "Checking API connection…"}
            {status === "online" && "API connected (localhost:3000)"}
            {status === "offline" &&
              "API unreachable — is the backend running on :3000?"}
          </span>
        </div>
      </section>

      <footer className="mt-auto pt-10 text-center text-xs text-slate-500">
        Responsive on phone, tablet, and desktop.
      </footer>
    </main>
  );
}
