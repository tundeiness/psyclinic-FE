"use client";

import { useEffect, useState } from "react";

// Renders a live-updating "Expires in X" pill. Styling intensifies
// as the deadline approaches: neutral → amber → red. Returns null
// (renders nothing) if no expiresAt was provided.
//
// Two scales supported:
//   - Default (minutes/seconds) for short windows like pending
//     payment expiry (~15 min in Phase 7.1).
//   - scale="long" for week/day countdowns like the Phase 13
//     6-week block expiry. Labels in days/weeks; urgency in days.
//
// Updates every 15 seconds for the short scale, every 60 seconds
// for the long scale — enough to feel live without thrashing.
// The host component re-renders too on its own data refreshes,
// which keeps the value in sync after server-driven state
// changes.
export function ExpiryCountdown({
  expiresAt,
  scale = "short",
  label = "Expires",
}: {
  expiresAt: string | undefined;
  scale?: "short" | "long";
  label?: string;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const intervalMs = scale === "long" ? 60_000 : 15_000;
    const tick = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(tick);
  }, [expiresAt, scale]);

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

  if (scale === "long") {
    return renderLong({ remaining, label });
  }

  // Short scale: minutes / seconds.
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  const shortLabel =
    minutes >= 2
      ? `${label} in ${minutes} min`
      : minutes === 1
      ? `${label} in 1 min`
      : `${label} in ${seconds}s`;

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
      {shortLabel}
    </span>
  );
}

// Long-scale renderer: weeks → days → "today" / "tomorrow".
// Used for the Phase 13 6-week block expiry.
function renderLong({
  remaining,
  label,
}: {
  remaining: number;
  label: string;
}) {
  const days = Math.floor(remaining / (24 * 60 * 60_000));
  const weeks = Math.floor(days / 7);

  let text: string;
  if (days >= 14) {
    text = `${label} in ${weeks} weeks`;
  } else if (days >= 7) {
    text = `${label} in 1 week`;
  } else if (days >= 2) {
    text = `${label} in ${days} days`;
  } else if (days === 1) {
    text = `${label} tomorrow`;
  } else {
    text = `${label} today`;
  }

  // Urgency tiers for long scale:
  // - >2 weeks: subtle grey (calm informational)
  // - 1-2 weeks: amber (gentle nudge)
  // - <1 week: red (urgent — book a session or lose the block)
  const tone =
    days >= 14
      ? "bg-slate-100 text-slate-700"
      : days >= 7
      ? "bg-amber-100 text-amber-900"
      : "bg-red-100 text-red-900";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {text}
    </span>
  );
}
