'use client';

import { useEffect } from 'react';

import { ACCESS_TOKEN_REFRESH_WINDOW_MS, isUnauthorizedError } from '@/shared/hooks/authRequestUtils';
import { readJwtExpiryMs } from '@/shared/utils/jwt';

type AuthSessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unverified';

type VerificationSnapshot = {
  token: string | null;
  status: Extract<AuthSessionStatus, 'authenticated' | 'unverified'>;
  message: string | null;
};

type UseAuthSessionRefreshTimerOptions = {
  mapVerificationErrorMessage: (error: unknown) => string;
  onUnauthorized: () => void;
  refreshTokenOnce: () => Promise<string>;
  setSnapshot: React.Dispatch<React.SetStateAction<VerificationSnapshot>>;
  token: string | null;
};

export default function useAuthSessionRefreshTimer({
  mapVerificationErrorMessage,
  onUnauthorized,
  refreshTokenOnce,
  setSnapshot,
  token,
}: UseAuthSessionRefreshTimerOptions) {
  useEffect(() => {
    if (token === null) {
      return;
    }

    const expiryMs = readJwtExpiryMs(token);

    if (expiryMs === null) {
      return;
    }

    let isCancelled = false;
    const refreshDelayMs = Math.max(0, expiryMs - Date.now() - ACCESS_TOKEN_REFRESH_WINDOW_MS);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const refreshedToken = await refreshTokenOnce();

          if (isCancelled) {
            return;
          }

          setSnapshot({
            token: refreshedToken,
            status: 'authenticated',
            message: null,
          });
        } catch (refreshError: unknown) {
          if (isCancelled) {
            return;
          }

          if (isUnauthorizedError(refreshError)) {
            onUnauthorized();
            return;
          }

          setSnapshot({
            token,
            status: 'unverified',
            message: mapVerificationErrorMessage(refreshError),
          });
        }
      })();
    }, refreshDelayMs);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [mapVerificationErrorMessage, onUnauthorized, refreshTokenOnce, setSnapshot, token]);
}
