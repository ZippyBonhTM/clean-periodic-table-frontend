'use client';

import { usePathname } from 'next/navigation';
import { memo } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
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
      <div className="grid gap-4 min-[425px]:grid-cols-[minmax(0,1fr)_auto] min-[425px]:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Clean Periodic Table</p>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)] md:text-3xl">
            Chemical Explorer
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/search');

              return (
                <LinkButton
                  key={item.href}
                  href={item.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="rounded-xl px-3 py-2 text-sm"
                >
                  {item.label}
                </LinkButton>
              );
            })}
          </div>

          <div className="mt-3 hidden max-[425px]:block">
            <Button
              type="button"
              variant="ghost"
              size="md"
              uppercase
              onClick={onToggleTheme}
              className="bg-black/20 px-3 tracking-[0.14em]"
            >
              {theme === 'dark' ? 'Night Theme' : 'Light Theme'}
            </Button>
          </div>

        </div>

        <div className="flex flex-col gap-2 min-[425px]:items-end">
          <div className="flex flex-col gap-2 min-[425px]:items-end">
            <div className="min-[425px]:w-auto">
              <TokenStatus status={authStatus} />
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 min-[425px]:justify-end">
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
                <LinkButton
                  href="/login"
                  variant="ghost"
                  size="md"
                  uppercase
                  className="px-3"
                >
                  Login
                </LinkButton>
              ) : (
                <Button
                  variant="ghost"
                  size="md"
                  uppercase
                  className="px-3"
                  onClick={onRequestLogin}
                >
                  Login
                </Button>
              )}

              {!hasToken && authEntryMode === 'route' ? (
                <LinkButton
                  href="/register"
                  variant="ghost"
                  size="md"
                  uppercase
                  className="px-3"
                >
                  Register
                </LinkButton>
              ) : null}

              {!hasToken && authEntryMode === 'modal' ? (
                <Button
                  variant="ghost"
                  size="md"
                  uppercase
                  className="px-3"
                  onClick={onRequestRegister}
                >
                  Register
                </Button>
              ) : null}

              <UserAvatarPlaceholder hasToken={hasToken} />
            </div>
          </div>

          <div className="hidden self-end min-[425px]:block">
            <Button
              type="button"
              variant="ghost"
              size="md"
              uppercase
              onClick={onToggleTheme}
              className="bg-black/20 px-3 tracking-[0.14em]"
            >
              {theme === 'dark' ? 'Night Theme' : 'Light Theme'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(AppHeader);
export type { AuthEntryMode };
