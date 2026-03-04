import { memo } from 'react';

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
          <a
            href="https://github.com/ZippyBonhTM/clean-periodic-table"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong-hover)]"
          >
            Backend Repo
          </a>
          <a
            href="https://github.com/ZippyBonhTM/clean-auth"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong-hover)]"
          >
            Auth Repo
          </a>
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
