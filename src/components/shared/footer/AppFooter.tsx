import { memo } from 'react';

function AppFooter() {
  return (
    <footer className="surface-panel rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-xs text-[var(--text-muted)] shadow-sm">
      Periodic Table UI focused on visualization, theme switching, and secure API integration.
    </footer>
  );
}

export default memo(AppFooter);
