"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { Card, Button } from "@/components/ui";

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

  // Role-aware welcome heading + action set.
  const isCoAdmin = user.role === "therapist" && user.therapist_profile?.co_admin === true;
  const banner = {
    client: {
      tag: "Client",
      greeting: `Welcome, ${user.full_name.split(" ")[0]}`,
      tagline: "Book a session, manage your appointments, and update your profile.",
    },
    therapist: {
      tag: isCoAdmin ? "Therapist · Co-admin" : "Therapist",
      greeting: `Welcome, ${user.full_name.split(" ")[0]}`,
      tagline: isCoAdmin
        ? "Your schedule, your clients, and admin tools the admin granted you."
        : "Manage your schedule, your clients and clinical notes.",
    },
    admin: {
      tag: "Admin",
      greeting: `Welcome back, ${user.full_name.split(" ")[0]}`,
      tagline: "Oversee the practice — applications, users and payment inflows.",
    },
  }[user.role];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          {banner.tag}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {banner.greeting}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/80">{banner.tagline}</p>
      </div>

      {user.role === "client" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
              Book a session
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Pick a date and a therapist. Your first session is free.
            </p>
            <Link href="/book" className="mt-4 inline-block">
              <Button className="!w-auto">Go to booking</Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              My appointments
            </p>
            <p className="mt-2 text-sm text-slate-600">
              See or cancel upcoming sessions.
            </p>
            <Link href="/appointments" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-cyan-600">
              Profile
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Update your avatar and documents.
            </p>
            <Link href="/profile" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Edit profile
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {user.role === "therapist" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
              My schedule
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Manage availability and see appointments.
            </p>
            <Link href="/therapist" className="mt-4 inline-block">
              <Button className="!w-auto">Open</Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              My clients
            </p>
            <p className="mt-2 text-sm text-slate-600">
              View profiles and write private clinical notes.
            </p>
            <Link href="/therapist/clients" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          {isCoAdmin && (
            <Card className="ring-2 ring-accent-amber-500/30">
              <p className="text-xs font-medium uppercase tracking-wide text-accent-amber-600">
                Co-admin tools
              </p>
              <p className="mt-2 text-sm text-slate-600">
                You have admin powers granted by the admin.
              </p>
              <Link href="/admin" className="mt-4 inline-block">
                <Button variant="ghost" className="!w-auto">
                  Admin workspace
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {user.role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
              Dashboard
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Counts, inflows, pending applications, calendar.
            </p>
            <Link href="/admin" className="mt-4 inline-block">
              <Button className="!w-auto">Open</Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              People
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Manage clients, therapists and co-admins.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/clients">
                <Button variant="ghost" className="!w-auto">
                  Clients
                </Button>
              </Link>
              <Link href="/admin/therapists">
                <Button variant="ghost" className="!w-auto">
                  Therapists
                </Button>
              </Link>
            </div>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-cyan-600">
              Settings
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Practice-wide flat rate.
            </p>
            <Link href="/admin/settings" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </main>
  );
}
