"use client";

import Link from "next/link";
import { useAppSelector } from "@/store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlogEditor } from "@/components/BlogEditor";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  // Only therapists and admins can author. Anyone else → 403.
  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
    else if (user.role !== "therapist" && user.role !== "admin")
      router.replace("/forbidden?reason=role");
  }, [initialized, user, router]);

  if (!user || (user.role !== "therapist" && user.role !== "admin")) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
          Write a post
        </h1>
        <Link href="/blog/mine" className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800">
          ← My posts
        </Link>
      </div>
      <BlogEditor />
    </main>
  );
}
