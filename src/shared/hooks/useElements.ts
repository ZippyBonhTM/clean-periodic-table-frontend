'use client';

import { useEffect, useMemo, useState } from 'react';

import { refreshAccessToken } from '@/shared/api/authApi';
import { getCachedElements, listElements } from '@/shared/api/backendApi';
import { ApiError } from '@/shared/api/httpClient';
import { executeWithFreshToken, isUnauthorizedError } from '@/shared/hooks/authRequestUtils';
import {
  ELEMENTS_GENERIC_ERROR_MESSAGE,
  ELEMENTS_NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_ERROR_MESSAGE,
} from '@/shared/hooks/hookErrorMessages';
import type { ChemicalElement } from '@/shared/types/element';

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

async function refreshTokenOnce(
  onTokenRefresh: (token: string, options?: { clearSilentRefreshBlocked?: boolean }) => void,
): Promise<string> {
  const refreshResponse = await refreshAccessToken();
  onTokenRefresh(refreshResponse.accessToken, { clearSilentRefreshBlocked: true });
  return refreshResponse.accessToken;
}

function mapElementsErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 0) {
    return ELEMENTS_NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return ELEMENTS_GENERIC_ERROR_MESSAGE;
}

type UseElementsInput = {
  token: string | null;
  onTokenRefresh: (token: string, options?: { clearSilentRefreshBlocked?: boolean }) => void;
  onUnauthorized: () => void;
  initialData?: ChemicalElement[] | null;
};

function useElements({
  token,
  onTokenRefresh,
  onUnauthorized,
  initialData = null,
}: UseElementsInput): ElementsState {
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
      try {
        const { activeToken, result } = await executeWithFreshToken(
          token,
          async () => await refreshTokenOnce(onTokenRefresh),
          async (resolvedToken) => {
            return await listElements(resolvedToken, {
              forceRefresh: resolvedToken !== token,
            });
          },
        );

        if (isCancelled) {
          return;
        }

        setSnapshot({
          token: activeToken,
          data: result,
          error: null,
        });
      } catch (caughtError: unknown) {
        if (isCancelled) {
          return;
        }

        if (isUnauthorizedError(caughtError)) {
          onUnauthorized();
          setSnapshot({
            token,
            data: [],
            error: SESSION_EXPIRED_ERROR_MESSAGE,
          });
          return;
        }

        setSnapshot({
          token,
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
      return initialData ?? [];
    }

    if (snapshot.token === token) {
      return snapshot.data;
    }

    if (snapshot.data.length > 0 && snapshot.error === null) {
      return snapshot.data;
    }

    if (initialData !== null) {
      return initialData;
    }

    return cachedElements ?? [];
  }, [cachedElements, initialData, snapshot.data, snapshot.error, snapshot.token, token]);

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

    return (
      snapshot.token !== token &&
      cachedElements === null &&
      snapshot.data.length === 0 &&
      initialData === null
    );
  }, [cachedElements, initialData, snapshot.data.length, snapshot.token, token]);

  return {
    data: sortedElements,
    isLoading,
    error,
  };
}

export default useElements;
