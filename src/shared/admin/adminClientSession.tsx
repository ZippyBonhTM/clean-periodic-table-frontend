'use client';

import { createContext, useContext } from 'react';

import type { AuthSessionStatus } from '@/shared/hooks/useAuthSession';

type RemoveTokenOptions = {
  blockSilentRefresh?: boolean;
};

type AdminClientSessionValue = {
  token: string | null;
  authStatus: AuthSessionStatus;
  isHydrated: boolean;
  isSilentRefreshBlocked: boolean;
  persistToken: (token: string) => void;
  refreshTokenOnce: () => Promise<string>;
  removeToken: (options?: RemoveTokenOptions) => void;
};

const AdminClientSessionContext = createContext<AdminClientSessionValue | null>(null);

type AdminClientSessionProviderProps = {
  value: AdminClientSessionValue;
  children: React.ReactNode;
};

function AdminClientSessionProvider({ value, children }: AdminClientSessionProviderProps) {
  return (
    <AdminClientSessionContext.Provider value={value}>
      {children}
    </AdminClientSessionContext.Provider>
  );
}

function useAdminClientSession(): AdminClientSessionValue {
  const context = useContext(AdminClientSessionContext);

  if (context === null) {
    throw new Error('useAdminClientSession must be used inside AdminClientSessionProvider.');
  }

  return context;
}

export { AdminClientSessionProvider, useAdminClientSession };
export type { AdminClientSessionValue };
