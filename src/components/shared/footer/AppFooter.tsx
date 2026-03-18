import { memo } from 'react';

import LinkButton from '@/components/atoms/LinkButton';
import useAppFooterText from '@/components/shared/footer/useAppFooterText';

function AppFooter() {
  const text = useAppFooterText();

  return (
    <footer className="surface-panel rounded-2xl border border-[var(--border-subtle)] px-4 py-4 text-xs text-[var(--text-muted)] shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-strong)]">{text.brandTitle}</p>
          <p>{text.description}</p>
        </div>

        <nav aria-label={text.repositoriesLabel} className="flex flex-wrap gap-2">
          <LinkButton
            href="https://github.com/ZippyBonhTM/clean-periodic-table-frontend"
            external
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="md"
            className="rounded-md px-3 text-xs text-[var(--accent)] hover:text-[var(--accent-strong-hover)]"
          >
            {text.links.frontend}
          </LinkButton>
          <LinkButton
            href="https://github.com/ZippyBonhTM/clean-periodic-table-backend"
            external
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="md"
            className="rounded-md px-3 text-xs text-[var(--accent)] hover:text-[var(--accent-strong-hover)]"
          >
            {text.links.backend}
          </LinkButton>
          <LinkButton
            href="https://github.com/ZippyBonhTM/clean-auth"
            external
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="md"
            className="rounded-md px-3 text-xs text-[var(--accent)] hover:text-[var(--accent-strong-hover)]"
          >
            {text.links.auth}
          </LinkButton>
        </nav>
      </div>

      <p className="mt-3 border-t border-[var(--border-subtle)] pt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
        {text.credits}
      </p>
    </footer>
  );
}

export default memo(AppFooter);
