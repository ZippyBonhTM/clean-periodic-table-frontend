'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import LoginForm from '@/components/organisms/login/LoginForm';
import AppShell from '@/components/templates/AppShell';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';

export default function LoginPage() {
  const router = useRouter();
  const { token, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
  });

  const onSuccess = useCallback(
    (nextToken: string) => {
      persistToken(nextToken);
      router.push('/search');
    },
    [persistToken, router],
  );

  const onLogout = useCallback(() => {
    removeToken();
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
          <h2 className="text-2xl font-bold text-[var(--text-strong)]">Login Page</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            This route remains available for protected-flow redirects.
          </p>
        </div>

        <LoginForm onSuccess={onSuccess} mode="page" />
      </section>
    </AppShell>
  );
}
