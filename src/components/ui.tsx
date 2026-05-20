import React from "react";

export function Button({
  children,
  loading,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition active:scale-[0.99] disabled:opacity-60 sm:w-auto";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-soft hover:from-brand-700 hover:to-brand-700"
      : "bg-white text-brand-700 ring-1 ring-slate-200 hover:bg-slate-50";
  return (
    <button
      className={`${base} ${styles} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function Field({
  label,
  id,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-3 text-base outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Standard Card — large radius, soft shadow, subtle background tint.
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "bg-red-50 text-red-700 ring-red-100",
    success: "bg-green-50 text-green-700 ring-green-100",
    info: "bg-amber-50 text-amber-800 ring-amber-100",
  }[kind];
  return (
    <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ring-1 ${styles}`}>
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 py-6 text-sm text-slate-500"
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500"
      />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 px-5 py-10 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// Horizon-style gradient stat card. Used on dashboards.
//
// `tone` selects the accent pair. Icon is a small inline SVG component
// or emoji — kept as ReactNode so callers can pass anything.
type StatTone = "indigo" | "violet" | "cyan" | "amber" | "brand";

const STAT_TONES: Record<StatTone, { from: string; to: string; chip: string }> = {
  indigo: { from: "from-accent-indigo-50",  to: "to-white", chip: "bg-accent-indigo-500/10 text-accent-indigo-600" },
  violet: { from: "from-accent-violet-50",  to: "to-white", chip: "bg-accent-violet-500/10 text-accent-violet-600" },
  cyan:   { from: "from-accent-cyan-50",    to: "to-white", chip: "bg-accent-cyan-500/10 text-accent-cyan-600" },
  amber:  { from: "from-accent-amber-50",   to: "to-white", chip: "bg-accent-amber-500/10 text-accent-amber-600" },
  brand:  { from: "from-brand-50",          to: "to-white", chip: "bg-brand-500/10 text-brand-700" },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: StatTone;
}) {
  const t = STAT_TONES[tone];
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-3xl bg-gradient-to-br ${t.from} ${t.to} p-5 shadow-soft ring-1 ring-slate-100`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {icon && (
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${t.chip}`}
        >
          {icon}
        </span>
      )}
    </div>
  );
}

// Compact icons used by StatCards.
export const Icons = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path strokeLinecap="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l3-9h12l3 9M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 13h5l2 3h4l2-3h5" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  ),
  dollar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M17 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H7" />
    </svg>
  ),
};
