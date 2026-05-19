"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (initialized && !user) router.push("/login");
  }, [initialized, user, router]);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  const byRole: Record<string, { title: string; items: string[] }> = {
    client: {
      title: `Welcome, ${user.full_name}`,
      items: [
        "Browse therapists and view their availability calendar",
        "Book a session and pay securely",
        "See and manage your appointments",
        "Upload your avatar and documents",
      ],
    },
    therapist: {
      title: `Welcome, ${user.full_name}`,
      items: [
        "Your schedule and upcoming appointment dates",
        "Clients who booked you — view their profile",
        "Write private clinical notes on a selected client",
        "Notifications and messages from the admin",
      ],
    },
    admin: {
      title: `Welcome, ${user.full_name}`,
      items: [
        "Pending applications — approve or reject",
        "Clients and therapists — manage and remove",
        "Payment inflows and the practice calendar",
        "Notifications about new applications",
      ],
    },
  };

  const view = byRole[user.role];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-1 text-xl font-semibold text-brand-700 sm:text-2xl">
        {view.title}
      </h1>
      <p className="mb-6 text-sm capitalize text-slate-500">
        Signed in as {user.role}
      </p>
      <Card>
        <h2 className="text-base font-medium text-slate-800">
          Your workspace
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          The following is being built and delivered in upcoming slices:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {view.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
