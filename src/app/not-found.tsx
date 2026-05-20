"use client";

import Link from "next/link";
import { Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
          404
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-800">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you were looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-brand-700 underline"
        >
          Go to your dashboard
        </Link>
      </Card>
    </main>
  );
}
