"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { UserMenu } from "@/components/UserMenu";

export function Header() {
  const user = useAppSelector((s) => s.auth.user);
  const pathname = usePathname();

  // The admin section has its own sidebar + top bar chrome (see
  // src/app/admin/layout.tsx). Suppress the global header there so we
  // don't double-stack navigation.
  if (pathname?.startsWith("/admin")) return null;

  // Navigation differs entirely by role. Logged-out visitors see the
  // public marketing surface; authenticated users see only their own
  // workspace links (no "browse therapists" / "sign up" for staff).
  function navLinks() {
    if (!user) {
      return (
        <>
          <Link href="/therapists" className="text-slate-600 hover:text-brand-700">
            Therapists
          </Link>
          <Link href="/blog" className="text-slate-600 hover:text-brand-700">
            Blog
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-brand-700">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
          >
            Sign up
          </Link>
        </>
      );
    }

    if (user.role === "client") {
      return (
        <>
          <Link href="/book" className="text-slate-600 hover:text-brand-700">
            Book
          </Link>
          <Link
            href="/appointments"
            className="text-slate-600 hover:text-brand-700"
          >
            Appointments
          </Link>
          <Link href="/therapists" className="text-slate-600 hover:text-brand-700">
            Therapists
          </Link>
          <Link href="/blog" className="text-slate-600 hover:text-brand-700">
            Blog
          </Link>
          <Link
            href="/profile"
            className="text-slate-600 hover:text-brand-700"
          >
            Profile
          </Link>
        </>
      );
    }

    if (user.role === "therapist") {
      const isCoAdmin = user.therapist_profile?.co_admin === true;
      return (
        <>
          <Link href="/therapist" className="text-slate-600 hover:text-brand-700">
            My schedule
          </Link>
          <Link
            href="/therapist/clients"
            className="text-slate-600 hover:text-brand-700"
          >
            My clients
          </Link>
          <Link href="/blog" className="text-slate-600 hover:text-brand-700">
            Blog
          </Link>
          <Link
            href="/blog/new"
            className="rounded-lg bg-accent-indigo-50 px-2 py-1 text-xs font-medium text-accent-indigo-600"
            title="Write a blog post"
          >
            Write
          </Link>
          {isCoAdmin && (
            <Link
              href="/admin"
              className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
              title="Co-admin access granted by the admin"
            >
              Admin
            </Link>
          )}
        </>
      );
    }

    // admin
    return (
      <>
        <Link href="/admin" className="text-base font-semibold text-slate-700 no-underline hover:text-brand-700">
          Dashboard
        </Link>
        <Link
          href="/admin/clients"
          className="text-slate-600 hover:text-brand-700"
        >
          Clients
        </Link>
        <Link
          href="/admin/therapists"
          className="text-slate-600 hover:text-brand-700"
        >
          Therapists
        </Link>
        <Link href="/blog" className="text-slate-600 hover:text-brand-700">
          Blog
        </Link>
        <Link
          href="/blog/new"
          className="rounded-lg bg-accent-indigo-50 px-2 py-1 text-xs font-medium text-accent-indigo-600"
          title="Write a blog post"
        >
          Write
        </Link>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          {/* Cerca Africa wordmark — sourced from the clinic's policy
              document. PNG with solid white background; works on the
              white header. Swap for an SVG/transparent PNG later when
              available. Native dims 310x120 → ~83x32 at h-8. */}
          <Image
            src="/logo.png"
            alt="Cerca Africa Mind & Behaviour Clinic"
            width={310}
            height={120}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm">
          {navLinks()}
          {user && <UserMenu />}
        </nav>
      </div>
    </header>
  );
}
