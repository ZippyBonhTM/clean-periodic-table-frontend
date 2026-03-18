'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

import useAuthText from '@/components/organisms/auth/useAuthText';
import ElementsState from '@/components/organisms/elements/ElementsState';
import type { AuthModalMode } from '@/components/organisms/auth/AuthModal';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';
import AppShell from '@/components/templates/AppShell';
import {
  resolveElementsWorkspaceMessage,
  resolveSessionWorkspaceMessage,
} from '@/components/templates/workspaceErrorCopy';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import type { PeriodicTableMode } from '@/components/organisms/periodic-table/PeriodicTable';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import useElements from '@/shared/hooks/useElements';

function PeriodicTableLoadingState() {
  const text = usePeriodicTableText();

  return <ElementsState tone="info" message={text.common.loading} showProgress />;
}

const PeriodicTable = dynamic(() => import('@/components/organisms/periodic-table/PeriodicTable'), {
  loading: PeriodicTableLoadingState,
});

const AuthModal = dynamic(() => import('@/components/organisms/auth/AuthModal'));

type ElementsWorkspaceProps = {
  tableMode: PeriodicTableMode;
};

function ElementsWorkspace({ tableMode }: ElementsWorkspaceProps) {
  const text = useAuthText();
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
    skipTokenValidation: true,
  });
  const hasValidSession = authSession.status === 'authenticated';
  const tokenStatus: TokenStatusType = authSession.status;
  const { data, isLoading, error } = useElements({
    token: hasValidSession ? token : null,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
  });

  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const resolvedSessionMessage = resolveSessionWorkspaceMessage(authSession.message, text);
  const resolvedElementsError = resolveElementsWorkspaceMessage(error, text);

  const onLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  const openAuthModal = useCallback((mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const onAuthSuccess = useCallback(
    (nextToken: string) => {
      persistToken(nextToken, { clearSilentRefreshBlocked: true });
      closeAuthModal();
    },
    [closeAuthModal, persistToken],
  );

  if (!isHydrated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[var(--app-max-width)] items-center px-[var(--app-inline-padding)] py-6">
        <ElementsState tone="info" message={text.workspace.loadingSession} />
      </main>
    );
  }

  return (
    <AppShell
      hasToken={hasValidSession}
      authStatus={isHydrated ? tokenStatus : 'checking'}
      onLogout={onLogout}
      authEntryMode="modal"
      onRequestLogin={() => openAuthModal('login')}
      onRequestRegister={() => openAuthModal('register')}
      showFooter={false}
    >
      <section className="space-y-4">
        {authSession.status === 'checking' ? (
          <ElementsState tone="info" message={text.workspace.checkingSession} />
        ) : authSession.status === 'unverified' ? (
          <ElementsState
            tone="error"
            message={resolvedSessionMessage}
            actionLabel={text.common.tryAgain}
            onAction={authSession.revalidate}
          />
        ) : !hasValidSession ? (
          <ElementsState
            tone="info"
            message={text.workspace.signInForElements}
            actionLabel={text.common.openLogin}
            onAction={() => openAuthModal('login')}
          />
        ) : isLoading ? (
          <ElementsState
            tone="info"
            message={text.workspace.loadingPeriodicTable}
            showProgress
          />
        ) : resolvedElementsError !== null ? (
          <ElementsState tone="error" message={resolvedElementsError} />
        ) : (
          <PeriodicTable elements={data} mode={tableMode} />
        )}
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authModalMode}
        onClose={closeAuthModal}
        onSuccess={onAuthSuccess}
      />
    </AppShell>
  );
}

export default ElementsWorkspace;
