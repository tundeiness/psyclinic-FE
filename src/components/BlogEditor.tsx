"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, Button, Alert } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
  BlogPost,
} from "@/lib/blogApi";
import { isApiError } from "@/lib/apiError";

type Status = "draft" | "published";

// Small curated emoji set. ~80 common picks across categories so we
// don't need a 150KB library (emoji-mart) for what the user actually
// reaches for. Native OS emoji picker still works if they want
// something not in this list.
const EMOJI = [
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃",
  "😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚",
  "🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮",
  "🤐","😯","😪","😫","🥱","😴","😌","😛","😜","🤪",
  "🤗","🤭","🤫","👍","👎","👏","🙌","🙏","👌","✌️",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","✨",
  "🎉","🔥","💯","💡","⭐","🌟","☀️","🌙","☁️","🌈",
  "📌","📍","✅","❌","⚠️","ℹ️","🎯","📝","📚","☕",
];

export function BlogEditor({
  initial,
}: {
  initial?: BlogPost;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial;

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // Insert text at the current cursor position in the body textarea.
  // If the textarea isn't focused, falls back to appending at the end.
  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setBody((b) => b + snippet);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + snippet + body.slice(end);
    setBody(next);
    // Restore focus + caret after the inserted snippet on next tick
    // (after React re-renders with the new value).
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function save(asStatus: Status) {
    setBusy(true);
    setError(null);
    try {
      if (isEdit) {
        await updateBlogPost(initial!.id, { title, body, status: asStatus });
        router.push("/blog/mine");
      } else {
        const created = await createBlogPost({ title, body, status: asStatus });
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
    if (!confirm("Delete this post? This cannot be undone.")) return;
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

  async function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so picking the same file again re-fires onChange.
    if (imageInputRef.current) imageInputRef.current.value = "";

    if (!isEdit) {
      setError(
        "Save the post as a draft first — images attach to an existing post."
      );
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const img = await uploadBlogImage(initial!.id, file, "");
      if (!img.url) {
        setError("Upload succeeded but no URL returned.");
        return;
      }
      // Convert relative Active Storage URL to absolute so it works
      // when rendered in Markdown <img src=...>.
      const absolute = img.url.startsWith("http")
        ? img.url
        : `${apiBase}${img.url}`;
      // Insert Markdown image syntax at the cursor. Newlines around it
      // so it renders on its own line cleanly.
      insertAtCursor(`\n\n![](${absolute})\n\n`);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.details?.join(", ") || err.message);
      } else {
        setError("Image upload failed.");
      }
    } finally {
      setUploading(false);
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
          <code>[link](https://…)</code>, tables, code blocks, images via
          the toolbar below. Raw HTML is ignored for safety.
        </p>

        {/* Toolbar */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {/* Insert image */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading || !isEdit}
            title={
              isEdit
                ? "Insert an image (JPG, PNG, GIF, WebP — up to 5 MB)"
                : "Save the post as draft first, then you can insert images"
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden>🖼️</span>
            {uploading ? "Uploading…" : "Insert image"}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={onImagePick}
          />

          {/* Emoji picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              title="Insert emoji"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
              aria-haspopup="menu"
              aria-expanded={emojiOpen}
            >
              <span aria-hidden>😊</span>
              Emoji
            </button>
            {emojiOpen && (
              <div
                role="menu"
                className="absolute left-0 z-20 mt-1 grid w-64 grid-cols-10 gap-1 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-slate-100"
              >
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      insertAtCursor(e);
                      setEmojiOpen(false);
                    }}
                    className="rounded-lg p-1 text-lg leading-none transition hover:bg-slate-100"
                    aria-label={`Insert ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isEdit && (
            <p className="text-xs text-slate-500">
              Save a draft to enable image uploads.
            </p>
          )}
        </div>

        <textarea
          ref={textareaRef}
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
