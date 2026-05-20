"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { fetchMe, hasStoredToken, markInitialized } from "@/store/authSlice";

// On first mount: if a token is stored, fetch the current user (which
// sets `initialized` when it resolves). If there is no token, there is
// nothing to restore — mark auth initialized immediately so the UI can
// render public content instead of waiting forever.
//
// Also re-fetch /me when the tab regains focus so role-affecting changes
// (e.g. an admin promoting a therapist to co-admin) take effect on the
// affected user's next visit without requiring a re-login. Focus-only;
// no polling so we don't waste requests.
export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (hasStoredToken()) {
      dispatch(fetchMe());
    } else {
      dispatch(markInitialized());
    }
  }, [dispatch]);

  useEffect(() => {
    function onFocus() {
      if (hasStoredToken()) dispatch(fetchMe());
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [dispatch]);

  return null;
}
