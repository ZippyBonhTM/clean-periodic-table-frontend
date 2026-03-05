'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { refreshAccessToken, validateAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import { readJwtExpiryMs } from '@/shared/utils/jwt';

type AuthSessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unverified';

type UseAuthSessionInput = {
  token: string | null;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: () => void;
  allowAnonymousRefresh?: boolean;
  skipTokenValidation?: boolean;
};

type VerificationSnapshot = {
  token: string | null;
  status: Extract<AuthSessionStatus, 'authenticated' | 'unverified'>;
  message: string | null;
};

type UseAuthSessionOutput = {
  status: AuthSessionStatus;
  message: string | null;
  revalidate: () => void;
};

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

function mapVerificationErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 0) {
    return 'Could not verify your session due to network or CORS. Check service availability.';
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Could not verify your session right now.';
}

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
}

function useAuthSession({
  token,
  onTokenRefresh,
  onUnauthorized,
  allowAnonymousRefresh = true,
  skipTokenValidation = false,
}: UseAuthSessionInput): UseAuthSessionOutput {
  const [snapshot, setSnapshot] = useState<VerificationSnapshot>({
    token: null,
    status: 'unverified',
    message: null,
  });
  const [validationVersion, setValidationVersion] = useState(0);
  const [isRestoringAnonymousSession, setIsRestoringAnonymousSession] = useState(false);

  const refreshTokenOnce = useCallback(async () => {
    const refreshResponse = await refreshAccessToken();
    onTokenRefresh(refreshResponse.accessToken);
    return refreshResponse.accessToken;
  }, [onTokenRefresh]);

  const revalidate = useCallback(() => {
    setValidationVersion((previous) => previous + 1);
  }, []);

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
      const expiryMs = readJwtExpiryMs(currentToken);
      const shouldRefreshBeforeValidation =
        expiryMs !== null && expiryMs - Date.now() <= ACCESS_TOKEN_REFRESH_WINDOW_MS;

      if (shouldRefreshBeforeValidation) {
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

          if (isUnauthorizedError(refreshError)) {
            onUnauthorized();
            return;
          }

          setSnapshot({
            token: currentToken,
            status: 'unverified',
            message: mapVerificationErrorMessage(refreshError),
          });
          return;
        }
      }

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

            onUnauthorized();
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
  }, [allowAnonymousRefresh, onUnauthorized, refreshTokenOnce, skipTokenValidation, token, validationVersion]);

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
  }, [onUnauthorized, refreshTokenOnce, token]);

  useEffect(() => {
    const currentStatus =
      token === null
        ? isRestoringAnonymousSession
          ? 'checking'
          : 'anonymous'
        : snapshot.token === token
          ? snapshot.status
          : 'checking';

    if (currentStatus !== 'unverified') {
      return;
    }

    const onOnline = () => {
      revalidate();
    };

    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [isRestoringAnonymousSession, revalidate, snapshot.status, snapshot.token, token]);

  return useMemo(
    () => ({
      status:
        token === null
          ? isRestoringAnonymousSession
            ? 'checking'
            : 'anonymous'
          : snapshot.token === token
            ? snapshot.status
            : 'checking',
      message: token === null ? null : snapshot.token === token ? snapshot.message : null,
      revalidate,
    }),
    [isRestoringAnonymousSession, revalidate, snapshot.message, snapshot.status, snapshot.token, token],
  );
}

export default useAuthSession;
export type { AuthSessionStatus, UseAuthSessionOutput };
