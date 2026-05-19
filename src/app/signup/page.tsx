"use client";

import { useState } from "react";
import { Card, Field, Button, Alert } from "@/components/ui";
import { signup } from "@/lib/publicApi";
import { isApiError } from "@/lib/apiError";

export default function SignupPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    role: "client" as "client" | "therapist",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors(null);
    setLoading(true);
    try {
      await signup(form);
      setDone(true);
    } catch (err) {
      if (isApiError(err)) {
        setErrors(err.details ?? [err.message]);
      } else {
        setErrors(["Sign up failed. Please try again."]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <Card>
          <Alert kind="success">
            Your account has been created and is <strong>pending admin
            approval</strong>. You&apos;ll be able to log in once an
            administrator approves your application. We&apos;ve also sent a
            confirmation to your email.
          </Alert>
          <a href="/" className="text-sm text-brand-700 underline">
            Back to home
          </a>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="mb-6 text-xl font-semibold text-brand-700">
        Create an account
      </h1>
      <Card>
        {errors && (
          <Alert kind="error">
            <ul className="list-disc pl-4">
              {errors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Alert>
        )}
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              I am a
            </span>
            <div className="flex gap-2">
              {(["client", "therapist"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("role", r)}
                  className={[
                    "flex-1 rounded-xl px-3 py-2 text-sm capitalize ring-1 transition",
                    form.role === r
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-600 ring-slate-200",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            <Field
              id="first_name"
              label="First name"
              required
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
            />
            <Field
              id="last_name"
              label="Last name"
              required
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
            />
          </div>
          <Field
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <Field
            id="phone"
            label="Phone (optional)"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <Field
            id="password_confirmation"
            label="Confirm password"
            type="password"
            required
            value={form.password_confirmation}
            onChange={(e) => set("password_confirmation", e.target.value)}
          />
          <Button type="submit" loading={loading}>
            Create account
          </Button>
        </form>
      </Card>
    </main>
  );
}
