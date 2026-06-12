import { useCallback } from "react";
import { useAppDispatch } from "@/store";
import { pushToast, dismissToast, ToastKind } from "@/store/uiSlice";

// Generates a sufficiently-unique toast id. Doesn't need to be a real
// UUID — just unique enough that two toasts dispatched in the same
// tick don't collide. The Date.now()+random suffix is fine for this.
function newId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_DURATION_MS = 4000;

// usage:
//   const toast = useToast();
//   toast.success("Saved");
//   toast.error("Could not save");
//   toast.info("Working…");
export function useToast() {
  const dispatch = useAppDispatch();

  const push = useCallback(
    (kind: ToastKind, message: string, durationMs = DEFAULT_DURATION_MS) => {
      const id = newId();
      dispatch(pushToast({ id, kind, message, durationMs }));
      // Schedule auto-dismiss. We let the timer run even if the user
      // manually dismisses — the dismissToast reducer is idempotent
      // (filters by id; if already gone, no-op).
      window.setTimeout(() => {
        dispatch(dismissToast(id));
      }, durationMs);
    },
    [dispatch]
  );

  return {
    success: useCallback(
      (msg: string, durationMs?: number) => push("success", msg, durationMs),
      [push]
    ),
    error: useCallback(
      // Errors get a slightly longer default so the user has time
      // to read them.
      (msg: string, durationMs = 6000) => push("error", msg, durationMs),
      [push]
    ),
    info: useCallback(
      (msg: string, durationMs?: number) => push("info", msg, durationMs),
      [push]
    ),
  };
}
