"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { login, clearAuthError } from "@/store/authSlice";
import { Card, Field, Button, Alert } from "@/components/ui";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, user } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(login({ email, password }));
  }

  // The backend returns 401 for pending/rejected accounts too. Surface a
  // helpful message rather than a generic "unauthorized".
  const friendlyError = error
    ? error.status === 401
      ? "Login failed. Your credentials may be wrong, or your account is still pending admin approval."
      : error.message
    : null;

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="mb-6 text-xl font-semibold text-brand-700">Log in</h1>
      <Card>
        {friendlyError && <Alert kind="error">{friendlyError}</Alert>}
        <form onSubmit={onSubmit}>
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" loading={loading}>
            Log in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{" "}
          <a href="/signup" className="text-brand-700 underline">
            Sign up
          </a>
        </p>
      </Card>
    </main>
  );
}
