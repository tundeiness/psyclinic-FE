"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, Button, Alert } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  BlogPost,
} from "@/lib/blogApi";
import { isApiError } from "@/lib/apiError";

type Status = "draft" | "published";

export function BlogEditor({
  initial,
}: {
  initial?: BlogPost; // omit for "new"
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!initial;

  async function save(asStatus: Status) {
    setBusy(true);
    setError(null);
    try {
      if (isEdit) {
        await updateBlogPost(initial!.id, {
          title,
          body,
          status: asStatus,
        });
        router.push("/blog/mine");
      } else {
        const created = await createBlogPost({
          title,
          body,
          status: asStatus,
        });
        if (asStatus === "published") {
          router.push(`/blog/${created.id}`);
        } else {
          router.push("/blog/mine");
        }
      }
    } catch (err) {
      if (isApiError(err)) {
        setError(err.details?.join(", ") || err.message);
      } else {
        setError("Could not save the post.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!isEdit) return;
    if (
      !confirm(
        "Delete this post? This cannot be undone."
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await deleteBlogPost(initial!.id);
      router.push("/blog/mine");
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  const canSave = title.trim().length > 0 && body.trim().length > 0 && !busy;

  return (
    <>
      {error && <Alert kind="error">{error}</Alert>}

      <Card className="mb-5">
        <Field
          id="title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <p className="mb-1 mt-2 block text-sm font-medium text-slate-700">
          Content (Markdown)
        </p>
        <p className="mb-2 text-xs text-slate-500">
          Supported: <code>**bold**</code>, <code>_italic_</code>,{" "}
          <code># heading</code>, <code>- list</code>,{" "}
          <code>[link](https://…)</code>, tables, code blocks. Raw HTML is
          ignored for safety.
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          placeholder="Write your post in Markdown…"
          className="w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 font-mono text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
      </Card>

      <Card className="mb-5">
        <p className="text-sm font-medium text-slate-700">Preview</p>
        <div className="mt-3 rounded-2xl bg-slate-50 p-4">
          {body.trim() ? (
            <Markdown source={body} />
          ) : (
            <p className="text-sm text-slate-400">Start typing to preview.</p>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => save("draft")}
          loading={busy}
          disabled={!canSave}
          variant="ghost"
          className="!w-auto"
        >
          Save as draft
        </Button>
        <Button
          onClick={() => save("published")}
          loading={busy}
          disabled={!canSave}
          className="!w-auto"
        >
          {isEdit && initial?.status === "published"
            ? "Save changes"
            : "Publish"}
        </Button>
        {isEdit && (
          <Button
            onClick={onDelete}
            loading={busy}
            variant="ghost"
            className="!w-auto !text-red-600"
          >
            Delete
          </Button>
        )}
      </div>
    </>
  );
}
