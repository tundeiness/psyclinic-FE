"use client";

import { useEffect, useState } from "react";

// Renders a live-updating "Expires in X" pill. Styling intensifies
// as the deadline approaches: neutral → amber → red. Returns null
// (renders nothing) if no expiresAt was provided.
//
// Updates every 15 seconds — enough to feel live without thrashing
// the page. The host component re-renders too on its own data
// refreshes, which keeps the value in sync after server-driven
// state changes.
export function ExpiryCountdown({
  expiresAt,
}: {
  expiresAt: string | undefined;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const deadline = new Date(expiresAt).getTime();
  const remaining = deadline - now;

  // Already expired (server hasn't yet swept). Show a quiet
  // "expired" pill — the host will refresh and remove the row.
  if (remaining <= 0) {
    return (
      <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
        Expired — refreshing…
      </span>
    );
  }

  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  const label =
    minutes >= 2
      ? `Expires in ${minutes} min`
      : minutes === 1
      ? "Expires in 1 min"
      : `Expires in ${seconds}s`;

  // Style by urgency.
  // - >10 min: subtle grey
  // - 5-10 min: amber
  // - <5 min: red
  const tone =
    minutes >= 10
      ? "bg-slate-100 text-slate-700"
      : minutes >= 5
      ? "bg-amber-100 text-amber-900"
      : "bg-red-100 text-red-900";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
