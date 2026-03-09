'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

import ElementsState from '@/components/organisms/elements/ElementsState';
import type { AuthModalMode } from '@/components/organisms/auth/AuthModal';
import AppShell from '@/components/templates/AppShell';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useSavedMolecules from '@/shared/hooks/useSavedMolecules';
import useAuthToken from '@/shared/hooks/useAuthToken';
import useElements from '@/shared/hooks/useElements';

const MolecularEditor = dynamic(() => import('@/components/organisms/molecular-editor/MolecularEditor'), {
  loading: () => <ElementsState tone="info" message="Preparing molecular editor..." showProgress />,
});

const AuthModal = dynamic(() => import('@/components/organisms/auth/AuthModal'));

type MolecularEditorWorkspaceMode = 'editor' | 'gallery';

type MolecularEditorWorkspaceProps = {
  pageMode?: MolecularEditorWorkspaceMode;
};

function MolecularEditorWorkspace({ pageMode = 'editor' }: MolecularEditorWorkspaceProps) {
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
  const shouldLoadElements = pageMode === 'editor' && hasValidSession;
  const { data, isLoading, error } = useElements({
    token: shouldLoadElements ? token : null,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
  });
  const savedMolecules = useSavedMolecules({
    token: hasValidSession ? token : null,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
  });

  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
        <ElementsState tone="info" message="Loading local session..." />
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
      viewportMain
    >
      <section className="flex min-h-full flex-col">
        {authSession.status === 'checking' ? (
          <ElementsState tone="info" message="Validating session..." />
        ) : authSession.status === 'unverified' ? (
          <ElementsState
            tone="error"
            message={authSession.message ?? 'Could not verify your session right now.'}
            actionLabel="Try again"
            onAction={authSession.revalidate}
          />
        ) : !hasValidSession ? (
          <ElementsState
            tone="info"
            message={pageMode === 'editor' ? 'Authenticate to use the molecular editor.' : 'Authenticate to access the molecule gallery.'}
            actionLabel="Open login"
            onAction={() => openAuthModal('login')}
          />
        ) : pageMode === 'editor' && isLoading ? (
          <ElementsState tone="info" message="Preparing the chemical element library..." showProgress />
        ) : pageMode === 'editor' && error !== null ? (
          <ElementsState tone="error" message={error} />
        ) : (
          <MolecularEditor
            pageMode={pageMode}
            elements={pageMode === 'editor' ? data : []}
            savedMolecules={savedMolecules.data}
            savedMoleculesError={savedMolecules.error}
            isSavedMoleculesLoading={savedMolecules.isLoading}
            isSavedMoleculesMutating={savedMolecules.isMutating}
            onReloadSavedMolecules={savedMolecules.reload}
            onCreateSavedMolecule={savedMolecules.createMolecule}
            onUpdateSavedMolecule={savedMolecules.updateMolecule}
            onDeleteSavedMolecule={savedMolecules.deleteMolecule}
          />
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

export default MolecularEditorWorkspace;
export type { MolecularEditorWorkspaceMode };
