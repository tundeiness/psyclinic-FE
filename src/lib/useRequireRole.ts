"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";

// Guards a page to a specific role. While auth is resolving, callers
// should render a loading state (returned `ready` is false until then).
export function useRequireRole(role: "client" | "therapist" | "admin") {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace("/dashboard");
    }
  }, [initialized, user, role, router]);

  return { ready: initialized && !!user && user.role === role, user };
}
