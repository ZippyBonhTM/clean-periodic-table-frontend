'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { refreshAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import {
  AUTH_SESSION_GENERIC_ERROR_MESSAGE,
  AUTH_SESSION_NETWORK_ERROR_MESSAGE,
} from '@/shared/hooks/hookErrorMessages';
import useAuthSessionRefreshTimer from '@/shared/hooks/useAuthSessionRefreshTimer';
import useAuthSessionResolver from '@/shared/hooks/useAuthSessionResolver';

type AuthSessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unverified';

type UseAuthSessionInput = {
  token: string | null;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: () => void;
  allowAnonymousRefresh?: boolean;
  enableProactiveRefresh?: boolean;
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

function mapVerificationErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 0) {
    return AUTH_SESSION_NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return AUTH_SESSION_GENERIC_ERROR_MESSAGE;
}

function useAuthSession({
  token,
  onTokenRefresh,
  onUnauthorized,
  allowAnonymousRefresh = true,
  enableProactiveRefresh = false,
  skipTokenValidation = false,
}: UseAuthSessionInput): UseAuthSessionOutput {
  const [snapshot, setSnapshot] = useState<VerificationSnapshot>({
    token: null,
    status: 'unverified',
    message: null,
  });
  const [validationVersion, setValidationVersion] = useState(0);
  const [isRestoringAnonymousSession, setIsRestoringAnonymousSession] = useState(false);

  const resolvedStatus: AuthSessionStatus = useMemo(() => {
    if (token === null) {
      return isRestoringAnonymousSession ? 'checking' : 'anonymous';
    }

    if (snapshot.token === token) {
      return snapshot.status;
    }

    if (snapshot.status === 'authenticated' && snapshot.token !== null) {
      return 'authenticated';
    }

    return 'checking';
  }, [isRestoringAnonymousSession, snapshot.status, snapshot.token, token]);

  const resolvedMessage = useMemo(() => {
    if (token === null) {
      return null;
    }

    return snapshot.token === token ? snapshot.message : null;
  }, [snapshot.message, snapshot.token, token]);

  const refreshTokenOnce = useCallback(async () => {
    const refreshResponse = await refreshAccessToken();
    onTokenRefresh(refreshResponse.accessToken);
    return refreshResponse.accessToken;
  }, [onTokenRefresh]);

  const revalidate = useCallback(() => {
    setValidationVersion((previous) => previous + 1);
  }, []);

  useAuthSessionResolver({
    allowAnonymousRefresh,
    mapVerificationErrorMessage,
    onTokenRefresh,
    onUnauthorized,
    refreshTokenOnce,
    setIsRestoringAnonymousSession,
    setSnapshot,
    skipTokenValidation,
    token,
    validationVersion,
  });

  useAuthSessionRefreshTimer({
    enabled: enableProactiveRefresh,
    mapVerificationErrorMessage,
    onUnauthorized,
    refreshTokenOnce,
    setSnapshot,
    token,
  });

  useEffect(() => {
    if (resolvedStatus !== 'unverified') {
      return;
    }

    const onOnline = () => {
      revalidate();
    };

    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [revalidate, resolvedStatus]);

  return useMemo(
    () => ({
      status: resolvedStatus,
      message: resolvedMessage,
      revalidate,
    }),
    [revalidate, resolvedMessage, resolvedStatus],
  );
}

export default useAuthSession;
export type { AuthSessionStatus, UseAuthSessionOutput };
