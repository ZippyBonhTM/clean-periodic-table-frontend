'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  clearAccessToken,
  readAccessToken,
  readSilentRefreshBlocked,
  saveAccessToken,
  setSilentRefreshBlocked,
} from '@/shared/storage/accessTokenStorage';

type RemoveTokenOptions = {
  blockSilentRefresh?: boolean;
};

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = () => onStoreChange();
  const onTokenChange = () => onStoreChange();

  window.addEventListener('storage', onStorage);
  window.addEventListener('auth-token-changed', onTokenChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('auth-token-changed', onTokenChange);
  };
}

function emitTokenChange(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event('auth-token-changed'));
}

function useAuthToken() {
  const token = useSyncExternalStore(subscribe, readAccessToken, () => null);
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const isSilentRefreshBlocked = useSyncExternalStore(
    subscribe,
    readSilentRefreshBlocked,
    () => false,
  );

  const persistToken = useCallback((nextToken: string) => {
    saveAccessToken(nextToken);
    setSilentRefreshBlocked(false);
    emitTokenChange();
  }, []);

  const removeToken = useCallback((options: RemoveTokenOptions = {}) => {
    clearAccessToken();
    setSilentRefreshBlocked(options.blockSilentRefresh === true);
    emitTokenChange();
  }, []);

  return {
    token,
    isHydrated,
    isSilentRefreshBlocked,
    persistToken,
    removeToken,
  };
}

export default useAuthToken;
