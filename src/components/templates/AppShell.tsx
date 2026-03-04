'use client';

import { memo } from 'react';

import AppFooter from '@/components/shared/footer/AppFooter';
import AppHeader from '@/components/shared/header/AppHeader';
import type { AuthEntryMode } from '@/components/shared/header/AppHeader';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import useTheme from '@/shared/hooks/useTheme';

type AppShellProps = {
  children: React.ReactNode;
  hasToken: boolean;
  authStatus: TokenStatusType;
  onLogout?: () => void;
  authEntryMode?: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
  showFooter?: boolean;
};

function AppShell({
  children,
  hasToken,
  authStatus,
  onLogout,
  authEntryMode = 'route',
  onRequestLogin,
  onRequestRegister,
  showFooter = true,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[var(--app-max-width)] flex-col gap-4 px-[var(--app-inline-padding)] py-5 md:py-8">
      <AppHeader
        hasToken={hasToken}
        authStatus={authStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={onLogout}
        authEntryMode={authEntryMode}
        onRequestLogin={onRequestLogin}
        onRequestRegister={onRequestRegister}
      />
      <main className="flex-1">{children}</main>
      {showFooter ? <AppFooter /> : null}
    </div>
  );
}

export default memo(AppShell);
