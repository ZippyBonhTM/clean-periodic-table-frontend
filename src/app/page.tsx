'use client';

import { useCallback, useState } from 'react';

import ElementsState from '@/components/organisms/elements/ElementsState';
import AuthModal from '@/components/organisms/auth/AuthModal';
import type { AuthModalMode } from '@/components/organisms/auth/AuthModal';
import PeriodicTable from '@/components/organisms/periodic-table/PeriodicTable';
import AppShell from '@/components/templates/AppShell';
import useAuthToken from '@/shared/hooks/useAuthToken';
import useElements from '@/shared/hooks/useElements';

export default function HomePage() {
  const { token, isHydrated, persistToken, removeToken } = useAuthToken();
  const { data, isLoading, error } = useElements(token);

  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const onLogout = useCallback(() => {
    removeToken();
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
      persistToken(nextToken);
      closeAuthModal();
    },
    [closeAuthModal, persistToken],
  );

  return (
    <AppShell
      hasToken={token !== null}
      onLogout={onLogout}
      authEntryMode="modal"
      onRequestLogin={() => openAuthModal('login')}
      onRequestRegister={() => openAuthModal('register')}
    >
      <section className="space-y-4">
        <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Interactive Chemistry Interface</p>
          <h2 className="text-2xl font-bold text-[var(--text-strong)] md:text-3xl">Periodic Table Views</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Explore the elements using classic periodic coordinates, category families, or compact comparison grid.
          </p>
        </div>

        {!isHydrated ? (
          <ElementsState tone="info" message="Loading local session..." />
        ) : token === null ? (
          <ElementsState
            tone="info"
            message="Authenticate to load elements from the backend API."
            actionLabel="Open login"
            onAction={() => openAuthModal('login')}
          />
        ) : isLoading ? (
          <ElementsState tone="info" message="Loading periodic table data from backend..." />
        ) : error !== null ? (
          <ElementsState tone="error" message={error} />
        ) : (
          <PeriodicTable elements={data} />
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
