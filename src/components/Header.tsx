"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";

export function Header() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

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
      return (
        <>
          <Link href="/dashboard" className="text-slate-600 hover:text-brand-700">
            My schedule
          </Link>
          <Link
            href="/dashboard"
            className="text-slate-600 hover:text-brand-700"
          >
            My clients
          </Link>
        </>
      );
    }

    // admin
    return (
      <Link href="/dashboard" className="text-slate-600 hover:text-brand-700">
        Dashboard
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-lg font-semibold text-brand-700"
        >
          PsyClinic
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {navLinks()}
          {user && (
            <>
              <span className="hidden text-slate-500 sm:inline">
                {user.full_name}
              </span>
              <button
                onClick={() => dispatch(logout())}
                className="rounded-lg bg-brand-50 px-3 py-1.5 text-brand-700 hover:bg-brand-100"
              >
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
