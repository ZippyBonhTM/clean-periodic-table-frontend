import { memo } from 'react';

import AppFooter from '@/components/shared/footer/AppFooter';
import AppHeader from '@/components/shared/header/AppHeader';

type AppShellProps = {
  children: React.ReactNode;
  hasToken: boolean;
  onLogout?: () => void;
};

function AppShell({ children, hasToken, onLogout }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <AppHeader hasToken={hasToken} onLogout={onLogout} />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}

export default memo(AppShell);
