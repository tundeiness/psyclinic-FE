"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Alert, LoadingState } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { fetchPublicBlogPost, BlogPost } from "@/lib/blogApi";
import { isApiError } from "@/lib/apiError";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPostPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    fetchPublicBlogPost(id)
      .then(setPost)
      .catch((e) =>
        setError(
          isApiError(e) && e.status === 404
            ? "This post is not available."
            : isApiError(e)
              ? e.message
              : "Could not load the post."
        )
      );
  }, [id]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/blog" className="text-sm text-brand-700 underline">
        ← All posts
      </Link>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      {!post && !error && <LoadingState label="Loading post…" />}

      {post && (
        <article className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
            {post.author.role === "admin" ? "Admin" : "Therapist"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-800">
            {post.title}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>{post.author.full_name}</span>
            <span>·</span>
            <span>{formatDate(post.published_at)}</span>
          </div>

          <Card className="mt-6">
            <Markdown source={post.body} />
          </Card>
        </article>
      )}
    </main>
  );
}
