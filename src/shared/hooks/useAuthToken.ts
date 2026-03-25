'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { clearElementsCache } from '@/shared/api/backendApi';
import {
  clearClientServerAccessTokenCookie,
  persistClientServerAccessTokenCookie,
} from '@/shared/auth/clientAccessTokenCookie';
import {
  clearAccessToken,
  readAccessToken,
  readSilentRefreshBlocked,
  saveAccessToken,
  setSilentRefreshBlocked,
} from '@/shared/storage/accessTokenStorage';

type RemoveTokenOptions = {
  blockSilentRefresh?: boolean;
  expectedToken?: string | null;
};

type PersistTokenOptions = {
  clearSilentRefreshBlocked?: boolean;
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

function normalizeExpectedToken(expectedToken?: string | null): string | null {
  if (typeof expectedToken !== 'string') {
    return null;
  }

  const normalizedToken = expectedToken.trim();
  return normalizedToken.length > 0 ? normalizedToken : null;
}

function shouldInvalidateCurrentToken(
  currentToken: string | null,
  expectedToken?: string | null,
): boolean {
  const normalizedExpectedToken = normalizeExpectedToken(expectedToken);

  if (normalizedExpectedToken === null) {
    return true;
  }

  return currentToken === normalizedExpectedToken;
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (token === null) {
      clearClientServerAccessTokenCookie();
      return;
    }

    persistClientServerAccessTokenCookie(token);
  }, [isHydrated, token]);

  const persistToken = useCallback((nextToken: string, options: PersistTokenOptions = {}) => {
    const shouldClearSilentRefreshBlocked = options.clearSilentRefreshBlocked === true;
    const isSilentRefreshCurrentlyBlocked = readSilentRefreshBlocked();
    const currentToken = readAccessToken();

    if (!shouldClearSilentRefreshBlocked && isSilentRefreshCurrentlyBlocked) {
      return;
    }

    saveAccessToken(nextToken);

    if (currentToken !== null && currentToken !== nextToken) {
      clearElementsCache(currentToken);
    }

    if (shouldClearSilentRefreshBlocked) {
      setSilentRefreshBlocked(false);
    }

    emitTokenChange();
  }, []);

  const removeToken = useCallback((options: RemoveTokenOptions = {}) => {
    const currentToken = readAccessToken();

    if (!shouldInvalidateCurrentToken(currentToken, options.expectedToken)) {
      return;
    }

    clearElementsCache();
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
export { shouldInvalidateCurrentToken };
