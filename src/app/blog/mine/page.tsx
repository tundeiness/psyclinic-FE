"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import {
  Card,
  Button,
  Alert,
  LoadingState,
  EmptyState,
} from "@/components/ui";
import { fetchMyBlogPosts, BlogPost } from "@/lib/blogApi";
import { isApiError } from "@/lib/apiError";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyBlogPostsPage() {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
    else if (user.role !== "therapist" && user.role !== "admin")
      router.replace("/forbidden?reason=role");
  }, [initialized, user, router]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await fetchMyBlogPosts());
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load posts.");
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  const isModerator =
    user.role === "admin" ||
    (user.role === "therapist" && user.therapist_profile?.co_admin);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-700 sm:text-2xl">
            {isModerator ? "All posts" : "My posts"}
          </h1>
          <p className="text-sm text-slate-500">
            {isModerator
              ? "You can moderate any post."
              : "Drafts and published posts."}
          </p>
        </div>
        <Link href="/blog/new">
          <Button className="!w-auto">Write a post</Button>
        </Link>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {!posts && !error && <LoadingState label="Loading posts…" />}
      {posts && posts.length === 0 && (
        <EmptyState
          title="No posts yet"
          hint="Start writing — drafts are private until you publish."
          action={
            <Link href="/blog/new">
              <Button className="!w-auto">Write the first one</Button>
            </Link>
          }
        />
      )}

      <div className="grid gap-3">
        {posts?.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-800">
                    {p.title}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {p.author.full_name} · updated {formatDate(p.updated_at)}
                  {p.status === "published" &&
                    p.published_at &&
                    ` · published ${formatDate(p.published_at)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status === "published" && (
                  <Link href={`/blog/${p.id}`}>
                    <Button variant="ghost" className="!w-auto">
                      View
                    </Button>
                  </Link>
                )}
                <Link href={`/blog/${p.id}/edit`}>
                  <Button variant="ghost" className="!w-auto">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
