import { memo } from 'react';

import LinkButton from '@/components/atoms/LinkButton';

function AppFooter() {
  return (
    <footer className="surface-panel rounded-2xl border border-[var(--border-subtle)] px-4 py-4 text-xs text-[var(--text-muted)] shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-strong)]">Clean Periodic Table</p>
          <p>
            Interface interativa da tabela periódica com integração entre autenticação e API de
            elementos químicos.
          </p>
        </div>

        <nav aria-label="Project repositories" className="flex flex-wrap gap-2">
          <LinkButton
            href="https://github.com/ZippyBonhTM/clean-periodic-table"
            external
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="md"
            className="rounded-md px-3 text-xs text-[var(--accent)] hover:text-[var(--accent-strong-hover)]"
          >
            Backend Repo
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
            Auth Repo
          </LinkButton>
        </nav>
      </div>

      <p className="mt-3 border-t border-[var(--border-subtle)] pt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
        Créditos: projeto idealizado e desenvolvido por ZippyBonhTM. Colaboração técnica de
        implementação no Frontend e Backend com Codex (GPT-5/OpenAI).
      </p>
    </footer>
  );
}

export default memo(AppFooter);
