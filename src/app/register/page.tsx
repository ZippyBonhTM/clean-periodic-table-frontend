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
        <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Dedicated Route</p>
          <h2 className="text-2xl font-bold text-[var(--text-strong)]">Register Page</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            This route remains available for protected-flow redirects.
          </p>
        </div>

        <RegisterForm onSuccess={onSuccess} mode="page" />
      </section>
    </AppShell>
  );
}
