"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui";

function ForbiddenContent() {
  const params = useSearchParams();
  const reason = params.get("reason");

  const message =
    reason === "role"
      ? "Your account doesn't have permission to view that page."
      : reason === "scope"
        ? "You can only view records you're directly associated with."
        : "You don't have permission to view that page.";

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-red-600">
          403
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-800">
          Access not allowed
        </h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-brand-700 underline"
        >
          Back to your dashboard
        </Link>
      </Card>
    </main>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-5 py-12">
          <Card>
            <p className="text-sm text-slate-500">Loading…</p>
          </Card>
        </main>
      }
    >
      <ForbiddenContent />
    </Suspense>
  );
}
