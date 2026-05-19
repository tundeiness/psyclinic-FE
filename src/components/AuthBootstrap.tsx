"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { fetchMe, hasStoredToken, markInitialized } from "@/store/authSlice";

// On first mount: if a token is stored, fetch the current user (which
// sets `initialized` when it resolves). If there is no token, there is
// nothing to restore — mark auth initialized immediately so the UI can
// render public content instead of waiting forever.
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (hasStoredToken()) {
      dispatch(fetchMe());
    } else {
      dispatch(markInitialized());
    }
  }, [dispatch]);
  return null;
}
