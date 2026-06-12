"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { dismissToast, Toast } from "@/store/uiSlice";

// Top-right floating stack of toast cards. Each card has a colored
// left border per kind, a brief message, and a manual close X.
// Animation uses tailwindcss-animate utilities already in use across
// the app (slide-in-from-top + fade-in on mount).
//
// Mounted once in the root layout (inside <Providers>). Toasts queue
// vertically; the slice caps at 5 simultaneous toasts.
export function ToastContainer() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const dispatch = useAppDispatch();

  if (toasts.length === 0) return null;

  return (
    <div
      // pointer-events: none on the wrapper so the toast stack
      // doesn't intercept clicks on the page behind it. Individual
      // cards re-enable pointer events so they remain dismissable.
      // The container sits fixed top-right with safe-area padding
      // so it doesn't collide with iOS notch + status bar.
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-end gap-2 px-4 sm:right-6 sm:top-6 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onDismiss={() => dispatch(dismissToast(t.id))}
        />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const kindStyles: Record<typeof toast.kind, string> = {
    success:
      "border-l-4 border-l-emerald-500 bg-white text-slate-800 shadow-lg ring-1 ring-emerald-100",
    error:
      "border-l-4 border-l-rose-500 bg-white text-slate-800 shadow-lg ring-1 ring-rose-100",
    info:
      "border-l-4 border-l-brand-500 bg-white text-slate-800 shadow-lg ring-1 ring-brand-100",
  };

  const iconColor: Record<typeof toast.kind, string> = {
    success: "text-emerald-600",
    error: "text-rose-600",
    info: "text-brand-600",
  };

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm animate-in slide-in-from-top-2 fade-in duration-200 ${kindStyles[toast.kind]}`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${iconColor[toast.kind]}`} aria-hidden="true">
        {toast.kind === "success" && (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            />
          </svg>
        )}
        {toast.kind === "error" && (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            />
          </svg>
        )}
        {toast.kind === "info" && (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            />
          </svg>
        )}
      </span>
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          />
        </svg>
      </button>
    </div>
  );
}
