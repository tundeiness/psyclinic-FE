"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { Alert, LoadingState } from "@/components/ui";
import { BlogEditor } from "@/components/BlogEditor";
import { fetchBlogPost, BlogPost } from "@/lib/blogApi";
import { isApiError } from "@/lib/apiError";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, initialized } = useAppSelector((s) => s.auth);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
    else if (user.role !== "therapist" && user.role !== "admin")
      router.replace("/forbidden?reason=role");
  }, [initialized, user, router]);

  useEffect(() => {
    if (!user || Number.isNaN(id)) return;
    fetchBlogPost(id)
      .then(setPost)
      .catch((e) =>
        setError(
          isApiError(e) && e.status === 403
            ? "You can only edit your own posts."
            : isApiError(e)
              ? e.message
              : "Could not load the post."
        )
      );
  }, [user, id]);

  if (!user) {
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
          Edit post
        </h1>
        <Link href="/blog/mine" className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800">
          ← My posts
        </Link>
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      {!post && !error && <LoadingState label="Loading post…" />}
      {post && <BlogEditor initial={post} />}
    </main>
  );
}
