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
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition active:scale-[0.99] disabled:opacity-60 sm:w-auto";
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "bg-white text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50";
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ${className}`}>
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
    <div className={`mb-4 rounded-xl px-4 py-3 text-sm ring-1 ${styles}`}>
      {children}
    </div>
  );
}
