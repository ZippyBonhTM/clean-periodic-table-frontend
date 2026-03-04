'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  clearAccessToken,
  readAccessToken,
  saveAccessToken,
} from '@/shared/storage/accessTokenStorage';

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

  const persistToken = useCallback((nextToken: string) => {
    saveAccessToken(nextToken);
    emitTokenChange();
  }, []);

  const removeToken = useCallback(() => {
    clearAccessToken();
    emitTokenChange();
  }, []);

  return {
    token,
    isHydrated,
    persistToken,
    removeToken,
  };
}

export default useAuthToken;
