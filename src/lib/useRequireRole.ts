"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { hasAdminAccess } from "@/store/authSlice";

type Role = "client" | "therapist" | "admin";

// Guards a page to a specific role (or list of roles). While auth
// is resolving, callers should render a loading state (returned
// `ready` is false until then).
//
// Special case: when "admin" is in the accepted list, co-admins
// (therapists whose `co_admin` flag is true) are also let through
// since they have admin-like powers.
//
// Usage:
//   useRequireRole("therapist")          // single role
//   useRequireRole(["therapist", "admin"]) // multiple roles
export function useRequireRole(roleOrRoles: Role | Role[]) {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  const accepted: Role[] = Array.isArray(roleOrRoles)
    ? roleOrRoles
    : [roleOrRoles];

  const allowed =
    !!user &&
    (accepted.includes(user.role as Role) ||
      (accepted.includes("admin") && hasAdminAccess(user)));

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
