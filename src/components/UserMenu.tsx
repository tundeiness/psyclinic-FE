"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

// Avatar pill + dropdown card menu. Click-outside-to-close, Escape to
// close, role-aware menu items.
export function UserMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Resolve the API base for avatar URLs (backend serves Active Storage
  // attachments via Rails-relative paths that need to be absolute on
  // the frontend).
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const isCoAdmin =
    user.role === "therapist" && user.therapist_profile?.co_admin === true;

  // Build the avatar source: absolute URL of uploaded avatar, else null
  // (we'll show initials).
  const avatarUrl =
    user.avatar?.url
      ? user.avatar.url.startsWith("http")
        ? user.avatar.url
        : `${apiBase}${user.avatar.url}`
      : null;

  // Role-aware menu items. Everyone gets a profile/account link first
  // (avatar upload lives there). Then role-specific shortcuts. Log out
  // is rendered separately below.
  type Item = { label: string; href: string };
  const items: Item[] =
    user.role === "client"
      ? [{ label: "Profile", href: "/profile" }]
      : user.role === "admin"
        ? [
            { label: "Account", href: "/profile" },
            { label: "Settings", href: "/admin/settings" },
          ]
        : isCoAdmin
          ? [
              { label: "Account", href: "/profile" },
              { label: "My schedule", href: "/therapist" },
              { label: "Admin workspace", href: "/admin" },
            ]
          : [
              { label: "Account", href: "/profile" },
              { label: "My schedule", href: "/therapist" },
            ];

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="block h-10 w-10 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-soft ring-1 ring-white/20 transition hover:ring-2 hover:ring-brand-200"
        title={user.full_name}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={user.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {initials(user.full_name) || "U"}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-100"
        >
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-slate-800">
              <span aria-hidden>👋</span> Hey, {user.full_name.split(" ")[0]}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          <div className="border-t border-slate-100 py-1">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="block px-5 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                {it.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                dispatch(logout());
              }}
              className="block w-full px-5 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
