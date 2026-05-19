"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";

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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <section className="mb-8">
        <h1 className="text-2xl font-semibold text-brand-700 sm:text-3xl">
          Find the right therapist
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Browse our clinical psychologists, read about their focus areas,
          and book a session.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/therapists">
            <Button>Browse therapists</Button>
          </Link>
          <Link href="/signup">
            <Button variant="ghost">Create an account</Button>
          </Link>
        </div>
      </section>

      <Card>
        <div className="flex items-center gap-2 text-sm">
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
      </Card>
    </main>
  );
}
