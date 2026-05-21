"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Alert, Button, LoadingState, EmptyState } from "@/components/ui";
import { fetchPublicBlogPosts, BlogCard, absoluteImageUrl } from "@/lib/blogApi";
import { isApiError } from "@/lib/apiError";
import { useAppSelector } from "@/store";

function canAuthor(role?: string) {
  return role === "therapist" || role === "admin";
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [posts, setPosts] = useState<BlogCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicBlogPosts()
      .then(setPosts)
      .catch((e) =>
        setError(isApiError(e) ? e.message : "Could not load posts.")
      );
  }, []);

  const showAuthor = canAuthor(user?.role);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          Blog
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          From our therapists
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/80">
          Thoughts and guidance on mental health from our clinicians.
        </p>
        {showAuthor && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/blog/new">
              <button className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-soft transition hover:bg-slate-100">
                Write a post
              </button>
            </Link>
            <Link href="/blog/mine">
              <button className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
                My posts
              </button>
            </Link>
          </div>
        )}
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {!posts && !error && <LoadingState label="Loading posts…" />}
      {posts && posts.length === 0 && (
        <EmptyState
          title="No posts yet"
          hint={
            showAuthor
              ? "Write the first one for your community."
              : "Check back soon — our therapists are getting started."
          }
          action={
            showAuthor ? (
              <Link href="/blog/new">
                <Button className="!w-auto">Write a post</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((p) => (
          <Link key={p.id} href={`/blog/${p.id}`} className="group">
            <Card className="h-full overflow-hidden !p-0 transition group-hover:ring-2 group-hover:ring-brand-100">
              {p.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={absoluteImageUrl(p.cover_image_url) ?? ""}
                  alt=""
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
                  {p.author.role === "admin" ? "Admin" : "Therapist"}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-800 group-hover:text-brand-700">
                  {p.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {p.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.author.full_name}</span>
                  <span>{formatDate(p.published_at)}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
