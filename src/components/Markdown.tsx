"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders Markdown safely:
// - No `rehype-raw` plugin → raw HTML in user input is NOT rendered.
// - `remark-gfm` adds tables, task lists, autolinks.
// - All links open in a new tab with noopener.
// - Tailwind classes give a typographic look without the `prose` plugin.
export function Markdown({ source }: { source: string }) {
  return (
    <div className="space-y-3 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 text-2xl font-semibold text-slate-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 text-xl font-semibold text-slate-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-200 bg-brand-50/40 px-4 py-2 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-100">
              {children}
            </pre>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
