'use client';

import { useEffect } from 'react';

import { validateAccessToken } from '@/shared/api/authApi';
import { isUnauthorizedError } from '@/shared/hooks/authRequestUtils';

type AuthSessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unverified';

type VerificationSnapshot = {
  token: string | null;
  status: Extract<AuthSessionStatus, 'authenticated' | 'unverified'>;
  message: string | null;
};

type UseAuthSessionResolverOptions = {
  allowAnonymousRefresh: boolean;
  mapVerificationErrorMessage: (error: unknown) => string;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: (options?: { blockSilentRefresh?: boolean; expectedToken?: string | null }) => void;
  refreshTokenOnce: () => Promise<string>;
  setIsRestoringAnonymousSession: React.Dispatch<React.SetStateAction<boolean>>;
  setSnapshot: React.Dispatch<React.SetStateAction<VerificationSnapshot>>;
  skipTokenValidation: boolean;
  token: string | null;
  validationVersion: number;
};

export default function useAuthSessionResolver({
  allowAnonymousRefresh,
  mapVerificationErrorMessage,
  onUnauthorized,
  refreshTokenOnce,
  setIsRestoringAnonymousSession,
  setSnapshot,
  skipTokenValidation,
  token,
  validationVersion,
}: UseAuthSessionResolverOptions) {
  useEffect(() => {
    let isCancelled = false;

    const resolveAnonymousSession = async () => {
      if (!allowAnonymousRefresh) {
        setIsRestoringAnonymousSession(false);
        return;
      }

      setIsRestoringAnonymousSession(true);

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
      } catch {
        // Keep anonymous when no refresh session exists.
      } finally {
        if (!isCancelled) {
          setIsRestoringAnonymousSession(false);
        }
      }
    };

    const resolveSession = async (currentToken: string) => {
      if (skipTokenValidation) {
        setSnapshot({
          token: currentToken,
          status: 'authenticated',
          message: null,
        });
        return;
      }

      try {
        await validateAccessToken(currentToken);

        if (isCancelled) {
          return;
        }

        setSnapshot({
          token: currentToken,
          status: 'authenticated',
          message: null,
        });
        return;
      } catch (validationError: unknown) {
        if (isCancelled) {
          return;
        }

        if (isUnauthorizedError(validationError)) {
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
            return;
          } catch (refreshError: unknown) {
            if (isCancelled) {
              return;
            }

            if (!isUnauthorizedError(refreshError)) {
              setSnapshot({
                token: currentToken,
                status: 'unverified',
                message: mapVerificationErrorMessage(refreshError),
              });
              return;
            }

            onUnauthorized({ expectedToken: currentToken });
            return;
          }
        }

        setSnapshot({
          token: currentToken,
          status: 'unverified',
          message: mapVerificationErrorMessage(validationError),
        });
      }
    };

    if (token === null) {
      void resolveAnonymousSession();

      return () => {
        isCancelled = true;
      };
    }

    setIsRestoringAnonymousSession(false);
    void resolveSession(token);

    return () => {
      isCancelled = true;
    };
  }, [
    allowAnonymousRefresh,
    mapVerificationErrorMessage,
    onUnauthorized,
    refreshTokenOnce,
    setIsRestoringAnonymousSession,
    setSnapshot,
    skipTokenValidation,
    token,
    validationVersion,
  ]);
}
