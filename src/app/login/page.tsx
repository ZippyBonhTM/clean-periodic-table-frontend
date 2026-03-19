'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import LoginForm from '@/components/organisms/login/LoginForm';
import AppShell from '@/components/templates/AppShell';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useAppLocale();
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
  });

  const onSuccess = useCallback(
    (nextToken: string) => {
      persistToken(nextToken, { clearSilentRefreshBlocked: true });
      router.replace(buildLocalizedAppPath(locale, '/periodic-table'));
    },
    [locale, persistToken, router],
  );

  const onLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  return (
    <AppShell
      hasToken={authSession.status === 'authenticated'}
      authStatus={authSession.status}
      onLogout={onLogout}
      authEntryMode="route"
    >
      <section className="space-y-4">
        <LoginForm onSuccess={onSuccess} mode="page" />
      </section>
    </AppShell>
  );
}
