"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { UserMenu } from "@/components/UserMenu";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

// Inline icons (currentColor-driven) — kept compact and dependency-free.
const ICON = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  therapists: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path strokeLinecap="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1A2 2 0 114.3 17l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1A2 2 0 117 4.3l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1A2 2 0 1119.7 7l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { href: "/admin",            label: "Dashboard",  icon: ICON.dashboard },
  { href: "/admin/clients",    label: "Clients",    icon: ICON.clients },
  { href: "/admin/therapists", label: "Therapists", icon: ICON.therapists },
  { href: "/admin/settings",   label: "Settings",   icon: ICON.settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  // We do NOT redirect here — the individual admin pages call
  // useRequireRole("admin") which handles the redirect cleanly. The
  // layout just renders the chrome for whatever passes through.

  const titleByPath: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/clients": "Clients",
    "/admin/therapists": "Therapists",
    "/admin/settings": "Settings",
  };
  const pageTitle = titleByPath[pathname ?? "/admin"] ?? "Admin";

  const sidebarContent = (
    <>
      <Link href="/admin" className="flex items-center gap-2 px-6 py-6">
        <span
          aria-hidden
          className="inline-block h-8 w-8 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft"
        />
        <span className="text-lg font-semibold text-slate-800">PsyClinic</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-gradient-to-br from-brand-50 to-white text-brand-700 shadow-soft ring-1 ring-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
              ].join(" ")}
            >
              <span
                className={
                  active ? "text-brand-600" : "text-slate-400"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        {user && (
          <>
            <p className="text-xs font-medium text-slate-500">Signed in as</p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl bg-slate-100 px-3 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Exit admin
              </Link>
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                {ICON.logout}
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — fixed on the left */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white/80 backdrop-blur lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white shadow-2xl lg:hidden">
            <div className="flex justify-end px-3 py-3">
              <button
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                {ICON.close}
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main pane — offset on lg by sidebar width */}
      <div className="lg:pl-64">
        {/* Top utility bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/60 bg-white/70 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            {ICON.menu}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Admin · PsyClinic
            </p>
            <h1 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
              {pageTitle}
            </h1>
          </div>

          {user && (
            <UserMenu />
          )}
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
