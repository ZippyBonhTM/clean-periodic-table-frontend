'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import RegisterForm from '@/components/organisms/register/RegisterForm';
import AppShell from '@/components/templates/AppShell';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';

export default function RegisterPage() {
  const router = useRouter();
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
      router.replace('/search');
    },
    [persistToken, router],
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
        <RegisterForm onSuccess={onSuccess} mode="page" />
      </section>
    </AppShell>
  );
}
