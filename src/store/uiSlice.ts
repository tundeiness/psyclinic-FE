import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Phase 17.1: app-wide toast notifications. Toasts are transient
// success/error/info cards that appear top-right and auto-dismiss
// after a few seconds. They coexist with inline `<Alert>` banners —
// toasts are for transient action feedback ("Saved", "Removed"),
// inline alerts are for persistent form-level errors that the user
// must read and act on.

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  // Duration in milliseconds. After this time the toast is removed
  // by the dispatcher (the useToast hook schedules the dismissal).
  durationMs: number;
}

interface UiState {
  toasts: Toast[];
}

const initialState: UiState = {
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    pushToast(state, action: PayloadAction<Toast>) {
      // Defensive: cap the number of simultaneous toasts so a
      // misbehaving page can't fill the screen with cards. Drop the
      // oldest if we'd exceed 5.
      state.toasts.push(action.payload);
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const { pushToast, dismissToast, clearToasts } = uiSlice.actions;
export default uiSlice.reducer;
