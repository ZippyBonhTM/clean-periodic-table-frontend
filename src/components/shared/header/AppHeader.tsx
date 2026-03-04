'use client';

import Link from 'next/link';
import { memo } from 'react';

import Button from '@/components/atoms/Button';
import ThemeToggle from '@/components/molecules/ThemeToggle';
import TokenStatus from '@/components/molecules/TokenStatus';
import UserAvatarPlaceholder from '@/components/molecules/UserAvatarPlaceholder';
import type { AppTheme } from '@/shared/hooks/useTheme';

type AuthEntryMode = 'modal' | 'route';

type AppHeaderProps = {
  hasToken: boolean;
  theme: AppTheme;
  onToggleTheme: () => void;
  onLogout?: () => void;
  authEntryMode?: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
};

function AppHeader({
  hasToken,
  theme,
  onToggleTheme,
  onLogout,
  authEntryMode = 'route',
  onRequestLogin,
  onRequestRegister,
}: AppHeaderProps) {
  return (
    <header className="surface-panel rounded-3xl border border-[var(--border-subtle)] p-4 shadow-sm backdrop-blur md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Clean Periodic Table</p>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)] md:text-3xl">
              Chemical Explorer
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <TokenStatus hasToken={hasToken} />
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            <UserAvatarPlaceholder hasToken={hasToken} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
          >
            Periodic Table
          </Link>

          {!hasToken && authEntryMode === 'modal' ? (
            <>
              <Button variant="ghost" onClick={onRequestLogin}>
                Login
              </Button>
              <Button variant="ghost" onClick={onRequestRegister}>
                Register
              </Button>
            </>
          ) : null}

          {!hasToken && authEntryMode === 'route' ? (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
              >
                Register
              </Link>
            </>
          ) : null}

          {hasToken && onLogout !== undefined ? (
            <Button variant="secondary" onClick={onLogout}>
              Logout
            </Button>
          ) : null}

          <span className="ml-auto rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {theme === 'dark' ? 'Night Theme' : 'Light Theme'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default memo(AppHeader);
export type { AuthEntryMode };
