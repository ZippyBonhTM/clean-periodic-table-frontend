'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import RegisterForm from '@/components/organisms/register/RegisterForm';
import AppShell from '@/components/templates/AppShell';
import useAuthToken from '@/shared/hooks/useAuthToken';

export default function RegisterPage() {
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
      <RegisterForm onSuccess={onSuccess} />
    </AppShell>
  );
}
