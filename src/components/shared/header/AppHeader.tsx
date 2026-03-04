'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';

import Button from '@/components/atoms/Button';
import TokenStatus from '@/components/molecules/TokenStatus';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import UserAvatarPlaceholder from '@/components/molecules/UserAvatarPlaceholder';
import type { AppTheme } from '@/shared/hooks/useTheme';

type AuthEntryMode = 'modal' | 'route';

type AppHeaderProps = {
  hasToken: boolean;
  authStatus: TokenStatusType;
  theme: AppTheme;
  onToggleTheme: () => void;
  onLogout?: () => void;
  authEntryMode?: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
};

const NAV_LINKS = [
  { href: '/periodic-table', label: 'Periodic Table' },
  { href: '/search', label: 'Search' },
];

function AppHeader({
  hasToken,
  authStatus,
  theme,
  onToggleTheme,
  onLogout,
  authEntryMode = 'route',
  onRequestLogin,
  onRequestRegister,
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="surface-panel rounded-3xl border border-[var(--border-subtle)] p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Clean Periodic Table</p>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)] md:text-3xl">
              Chemical Explorer
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <TokenStatus status={authStatus} />

            {hasToken ? (
              onLogout !== undefined ? (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs uppercase tracking-[0.08em]"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              ) : null
            ) : authEntryMode === 'route' ? (
              <Link
                href="/login"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
              >
                Login
              </Link>
            ) : (
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs uppercase tracking-[0.08em]"
                onClick={onRequestLogin}
              >
                Login
              </Button>
            )}

            {!hasToken && authEntryMode === 'route' ? (
              <Link
                href="/register"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
              >
                Register
              </Link>
            ) : null}

            {!hasToken && authEntryMode === 'modal' ? (
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs uppercase tracking-[0.08em]"
                onClick={onRequestRegister}
              >
                Register
              </Button>
            ) : null}

            <UserAvatarPlaceholder hasToken={hasToken} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/search');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-strong)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onToggleTheme}
            className="ml-auto rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
          >
            {theme === 'dark' ? 'Night Theme' : 'Light Theme'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default memo(AppHeader);
export type { AuthEntryMode };
