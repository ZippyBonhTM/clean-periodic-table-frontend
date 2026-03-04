'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import LoginForm from '@/components/organisms/login/LoginForm';
import AppShell from '@/components/templates/AppShell';
import useAuthToken from '@/shared/hooks/useAuthToken';

export default function LoginPage() {
  const router = useRouter();
  const { token, persistToken, removeToken } = useAuthToken();

  const onSuccess = useCallback(
    (nextToken: string) => {
      persistToken(nextToken);
      router.push('/');
    },
    [persistToken, router],
  );

  const onLogout = useCallback(() => {
    removeToken();
  }, [removeToken]);

  return (
    <AppShell hasToken={token !== null} onLogout={onLogout}>
      <LoginForm onSuccess={onSuccess} />
    </AppShell>
  );
}
