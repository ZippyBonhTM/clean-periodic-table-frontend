'use client';

import { useEffect, useMemo, useState } from 'react';

import { refreshAccessToken } from '@/shared/api/authApi';
import { getCachedElements, listElements } from '@/shared/api/backendApi';
import { ApiError } from '@/shared/api/httpClient';
import type { ChemicalElement } from '@/shared/types/element';
import { readJwtExpiryMs } from '@/shared/utils/jwt';

type ElementsSnapshot = {
  token: string | null;
  data: ChemicalElement[];
  error: string | null;
};

type ElementsState = {
  data: ChemicalElement[];
  isLoading: boolean;
  error: string | null;
};

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

function shouldRefreshBeforeRequest(token: string): boolean {
  const expiryMs = readJwtExpiryMs(token);

  if (expiryMs === null) {
    return false;
  }

  return expiryMs - Date.now() <= ACCESS_TOKEN_REFRESH_WINDOW_MS;
}

async function refreshTokenOnce(onTokenRefresh: (token: string) => void): Promise<string> {
  const refreshResponse = await refreshAccessToken();
  onTokenRefresh(refreshResponse.accessToken);
  return refreshResponse.accessToken;
}

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
}

function mapElementsErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 0) {
    return 'Could not refresh your session due to network or CORS. Please try again.';
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Could not load elements right now.';
}

type UseElementsInput = {
  token: string | null;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: () => void;
};

function useElements({ token, onTokenRefresh, onUnauthorized }: UseElementsInput): ElementsState {
  const [snapshot, setSnapshot] = useState<ElementsSnapshot>({
    token: null,
    data: [],
    error: null,
  });

  useEffect(() => {
    if (token === null) {
      return;
    }

    let isCancelled = false;

    const loadElements = async () => {
      let activeToken = token;
      let didAutoRefresh = false;

      try {
        if (shouldRefreshBeforeRequest(token)) {
          activeToken = await refreshTokenOnce(onTokenRefresh);
          didAutoRefresh = true;
        }

        const response = await listElements(activeToken, {
          forceRefresh: didAutoRefresh,
        });

        if (isCancelled) {
          return;
        }

        setSnapshot({
          token: activeToken,
          data: response,
          error: null,
        });
      } catch (caughtError: unknown) {
        if (isCancelled) {
          return;
        }

        if (isUnauthorizedError(caughtError)) {
          try {
            const refreshedToken = await refreshTokenOnce(onTokenRefresh);
            const refreshedElements = await listElements(refreshedToken, { forceRefresh: true });

            if (isCancelled) {
              return;
            }

            setSnapshot({
              token: refreshedToken,
              data: refreshedElements,
              error: null,
            });
            return;
          } catch (refreshError: unknown) {
            if (isCancelled) {
              return;
            }

            if (!isUnauthorizedError(refreshError)) {
              setSnapshot({
                token: activeToken,
                data: [],
                error: mapElementsErrorMessage(refreshError),
              });
              return;
            }

            onUnauthorized();
            setSnapshot({
              token,
              data: [],
              error: 'Your session expired. Please login again.',
            });
            return;
          }
        }

        setSnapshot({
          token: activeToken,
          data: [],
          error: mapElementsErrorMessage(caughtError),
        });
      }
    };

    void loadElements();

    return () => {
      isCancelled = true;
    };
  }, [onTokenRefresh, onUnauthorized, token]);

  const cachedElements = useMemo(() => {
    if (token === null) {
      return null;
    }

    return getCachedElements(token);
  }, [token]);

  const activeData = useMemo(() => {
    if (token === null) {
      return [];
    }

    if (snapshot.token === token) {
      return snapshot.data;
    }

    if (snapshot.data.length > 0 && snapshot.error === null) {
      return snapshot.data;
    }

    return cachedElements ?? [];
  }, [cachedElements, snapshot.data, snapshot.error, snapshot.token, token]);

  const sortedElements = useMemo(() => {
    return [...activeData].sort((first, second) => first.number - second.number);
  }, [activeData]);

  const error = useMemo(() => {
    if (token === null) {
      return null;
    }

    if (snapshot.token === token) {
      return snapshot.error;
    }

    return null;
  }, [snapshot.error, snapshot.token, token]);

  const isLoading = useMemo(() => {
    if (token === null) {
      return false;
    }

    return snapshot.token !== token && cachedElements === null && snapshot.data.length === 0;
  }, [cachedElements, snapshot.data.length, snapshot.token, token]);

  return {
    data: sortedElements,
    isLoading,
    error,
  };
}

export default useElements;
