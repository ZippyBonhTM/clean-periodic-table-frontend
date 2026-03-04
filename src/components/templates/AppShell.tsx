'use client';

import { memo } from 'react';

import AppFooter from '@/components/shared/footer/AppFooter';
import AppHeader from '@/components/shared/header/AppHeader';
import type { AuthEntryMode } from '@/components/shared/header/AppHeader';
import useTheme from '@/shared/hooks/useTheme';

type AppShellProps = {
  children: React.ReactNode;
  hasToken: boolean;
  onLogout?: () => void;
  authEntryMode?: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
};

function AppShell({
  children,
  hasToken,
  onLogout,
  authEntryMode = 'route',
  onRequestLogin,
  onRequestRegister,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1300px] flex-col gap-4 px-3 py-5 md:px-8 md:py-8">
      <AppHeader
        hasToken={hasToken}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={onLogout}
        authEntryMode={authEntryMode}
        onRequestLogin={onRequestLogin}
        onRequestRegister={onRequestRegister}
      />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}

export default memo(AppShell);
