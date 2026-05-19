"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { fetchMe, hasStoredToken } from "@/store/authSlice";

// On first mount, if a token is stored, fetch the current user so the
// UI reflects the logged-in state across reloads.
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (hasStoredToken()) {
      dispatch(fetchMe());
    }
  }, [dispatch]);
  return null;
}
