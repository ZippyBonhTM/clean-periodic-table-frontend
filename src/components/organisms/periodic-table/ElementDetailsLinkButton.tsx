'use client';

import { normalizeText } from './elementDetailsUtils';

type ElementDetailsLinkButtonProps = {
  href: string | null | undefined;
  label: string;
};

export default function ElementDetailsLinkButton({
  href,
  label,
}: ElementDetailsLinkButtonProps) {
  const normalizedHref = normalizeText(href);

  if (normalizedHref.length === 0) {
    return (
      <span className="text-xs font-semibold text-[var(--text-muted)]">
        {label}: unavailable
      </span>
    );
  }

  return (
    <a
      href={normalizedHref}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold text-orange-400 underline decoration-2 underline-offset-2 transition-colors hover:text-orange-300"
    >
      {label}
    </a>
  );
}
