'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { refreshAccessToken, validateAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';

type AuthSessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unverified';

type UseAuthSessionInput = {
  token: string | null;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: () => void;
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

function useAuthSession({
  token,
  onTokenRefresh,
  onUnauthorized,
}: UseAuthSessionInput): UseAuthSessionOutput {
  const [snapshot, setSnapshot] = useState<VerificationSnapshot>({
    token: null,
    status: 'unverified',
    message: null,
  });
  const [validationVersion, setValidationVersion] = useState(0);

  const revalidate = useCallback(() => {
    setValidationVersion((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (token === null) {
      return;
    }

    let isCancelled = false;

    const resolveSession = async () => {
      try {
        await validateAccessToken(token);

        if (isCancelled) {
          return;
        }

        setSnapshot({
          token,
          status: 'authenticated',
          message: null,
        });
        return;
      } catch (validationError: unknown) {
        if (isCancelled) {
          return;
        }

        if (validationError instanceof ApiError && validationError.statusCode === 401) {
          try {
            const refreshResponse = await refreshAccessToken();

            if (isCancelled) {
              return;
            }

            onTokenRefresh(refreshResponse.accessToken);
            setSnapshot({
              token: refreshResponse.accessToken,
              status: 'authenticated',
              message: null,
            });
            return;
          } catch (refreshError: unknown) {
            if (isCancelled) {
              return;
            }

            if (refreshError instanceof ApiError && refreshError.statusCode === 0) {
              setSnapshot({
                token,
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
          token,
          status: 'unverified',
          message: mapVerificationErrorMessage(validationError),
        });
      }
    };

    void resolveSession();

    return () => {
      isCancelled = true;
    };
  }, [onTokenRefresh, onUnauthorized, token, validationVersion]);

  useEffect(() => {
    const currentStatus =
      token === null
        ? 'anonymous'
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
  }, [revalidate, snapshot.status, snapshot.token, token]);

  return useMemo(
    () => ({
      status:
        token === null
          ? 'anonymous'
          : snapshot.token === token
            ? snapshot.status
            : 'checking',
      message: token === null ? null : snapshot.token === token ? snapshot.message : null,
      revalidate,
    }),
    [revalidate, snapshot.message, snapshot.status, snapshot.token, token],
  );
}

export default useAuthSession;
export type { AuthSessionStatus, UseAuthSessionOutput };
