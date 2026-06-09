export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

// v2 pricing: kobo (smallest naira unit, 1 NGN = 100 kobo). The
// backend stores amounts as `amount_cents` for legacy column-name
// reasons, but the values are kobo. Format as naira for display.
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100);
  return `\u20A6${naira.toLocaleString()}`;  // ₦ symbol + grouped
}
