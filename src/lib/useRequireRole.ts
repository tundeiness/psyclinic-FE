"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { hasAdminAccess } from "@/store/authSlice";

// Guards a page to a specific role. While auth is resolving, callers
// should render a loading state (returned `ready` is false until then).
//
// Special case: requireRole("admin") also lets through co-admins (a
// therapist whose `co_admin` flag is true), since they have admin-like
// powers granted by the real admin.
export function useRequireRole(role: "client" | "therapist" | "admin") {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  const allowed =
    !!user &&
    (user.role === role || (role === "admin" && hasAdminAccess(user)));

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/login");
    } else if (!allowed) {
      router.replace("/forbidden?reason=role");
    }
  }, [initialized, user, allowed, router]);

  return { ready: initialized && allowed, user };
}
