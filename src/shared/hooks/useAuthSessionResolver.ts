'use client';

import { useEffect } from 'react';

import { resolveAuthSession } from '@/shared/api/authApi';
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
  onTokenRefresh: (token: string, options?: { clearSilentRefreshBlocked?: boolean }) => void;
  onUnauthorized: (options?: { blockSilentRefresh?: boolean; expectedToken?: string | null }) => void;
  setIsRestoringAnonymousSession: React.Dispatch<React.SetStateAction<boolean>>;
  setSnapshot: React.Dispatch<React.SetStateAction<VerificationSnapshot>>;
  skipTokenValidation: boolean;
  token: string | null;
  validationVersion: number;
};

export default function useAuthSessionResolver({
  allowAnonymousRefresh,
  mapVerificationErrorMessage,
  onTokenRefresh,
  onUnauthorized,
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
        const resolvedSession = await resolveAuthSession();

        if (isCancelled) {
          return;
        }

        onTokenRefresh(resolvedSession.accessToken, { clearSilentRefreshBlocked: true });
        setSnapshot({
          token: resolvedSession.accessToken,
          status: 'authenticated',
          message: null,
        });
      } catch (resolveError: unknown) {
        if (!isUnauthorizedError(resolveError)) {
          setSnapshot({
            token: null,
            status: 'unverified',
            message: mapVerificationErrorMessage(resolveError),
          });
        }
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
        const resolvedSession = await resolveAuthSession(currentToken);

        if (isCancelled) {
          return;
        }

        if (resolvedSession.accessToken !== currentToken) {
          onTokenRefresh(resolvedSession.accessToken, { clearSilentRefreshBlocked: true });
        }

        setSnapshot({
          token: resolvedSession.accessToken,
          status: 'authenticated',
          message: null,
        });
        return;
      } catch (validationError: unknown) {
        if (isCancelled) {
          return;
        }

        if (isUnauthorizedError(validationError)) {
          onUnauthorized({ expectedToken: currentToken });
          return;
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
    onTokenRefresh,
    onUnauthorized,
    setIsRestoringAnonymousSession,
    setSnapshot,
    skipTokenValidation,
    token,
    validationVersion,
  ]);
}
