'use client';

import { memo } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownContentProps = {
  content: string;
  tone?: 'default' | 'inverted';
  compact?: boolean;
  className?: string;
};

function MarkdownContent({
  content,
  tone = 'default',
  compact = false,
  className,
}: MarkdownContentProps) {
  const linkClassName =
    tone === 'inverted'
      ? 'text-white underline decoration-white/35 underline-offset-2'
      : 'text-(--accent) underline decoration-(--accent)/35 underline-offset-2';
  const blockSpacingClassName = compact ? 'space-y-1.5' : 'space-y-2';

  return (
    <div className={`${blockSpacingClassName} ${className ?? ''}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-black text-current">{children}</strong>,
          em: ({ children }) => <em className="italic text-current">{children}</em>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[0.95em] text-current">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-current/25 pl-3 italic text-current/90">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownContent);
