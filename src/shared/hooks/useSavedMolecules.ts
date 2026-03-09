'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createSavedMolecule,
  deleteSavedMolecule,
  listSavedMolecules,
  updateSavedMolecule,
} from '@/shared/api/moleculeApi';
import { refreshAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';
import { readJwtExpiryMs } from '@/shared/utils/jwt';

type SavedMoleculesSnapshot = {
  token: string | null;
  data: SavedMolecule[];
  error: string | null;
};

type UseSavedMoleculesInput = {
  token: string | null;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: () => void;
};

type UseSavedMoleculesOutput = {
  data: SavedMolecule[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  reload: () => void;
  createMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  updateMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
  deleteMolecule: (moleculeId: string) => Promise<void>;
};

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

function sortSavedMolecules(data: SavedMolecule[]): SavedMolecule[] {
  return [...data].sort((first, second) => {
    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
  });
}

function shouldRefreshBeforeRequest(token: string): boolean {
  const expiryMs = readJwtExpiryMs(token);

  if (expiryMs === null) {
    return false;
  }

  return expiryMs - Date.now() <= ACCESS_TOKEN_REFRESH_WINDOW_MS;
}

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
}

function mapSavedMoleculesErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 0) {
    return 'Could not sync your molecules due to network or CORS. Please try again.';
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Could not sync saved molecules right now.';
}

function useSavedMolecules({ token, onTokenRefresh, onUnauthorized }: UseSavedMoleculesInput): UseSavedMoleculesOutput {
  const [snapshot, setSnapshot] = useState<SavedMoleculesSnapshot>({
    token: null,
    data: [],
    error: null,
  });
  const [isMutating, setIsMutating] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  const refreshTokenOnce = useCallback(async () => {
    const refreshResponse = await refreshAccessToken();
    onTokenRefresh(refreshResponse.accessToken);
    return refreshResponse.accessToken;
  }, [onTokenRefresh]);

  const executeWithFreshToken = useCallback(
    async <Result,>(
      currentToken: string,
      operation: (activeToken: string) => Promise<Result>,
    ): Promise<{ activeToken: string; result: Result }> => {
      let activeToken = currentToken;

      if (shouldRefreshBeforeRequest(activeToken)) {
        activeToken = await refreshTokenOnce();
      }

      try {
        const result = await operation(activeToken);
        return { activeToken, result };
      } catch (caughtError: unknown) {
        if (!isUnauthorizedError(caughtError)) {
          throw caughtError;
        }

        const refreshedToken = await refreshTokenOnce();
        const result = await operation(refreshedToken);
        return { activeToken: refreshedToken, result };
      }
    },
    [refreshTokenOnce],
  );

  const reload = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (token === null) {
      setSnapshot({
        token: null,
        data: [],
        error: null,
      });
      return;
    }

    let isCancelled = false;

    const loadSavedMolecules = async () => {
      try {
        const { activeToken, result } = await executeWithFreshToken(token, async (resolvedToken) => {
          return await listSavedMolecules(resolvedToken);
        });

        if (isCancelled) {
          return;
        }

        setSnapshot({
          token: activeToken,
          data: sortSavedMolecules(result),
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
            error: 'Your session expired. Please login again.',
          });
          return;
        }

        setSnapshot({
          token,
          data: [],
          error: mapSavedMoleculesErrorMessage(caughtError),
        });
      }
    };

    void loadSavedMolecules();

    return () => {
      isCancelled = true;
    };
  }, [executeWithFreshToken, onUnauthorized, reloadVersion, token]);

  const createMolecule = useCallback(
    async (input: SaveMoleculeInput): Promise<SavedMolecule> => {
      if (token === null) {
        throw new Error('Authentication is required to save molecules.');
      }

      setIsMutating(true);

      try {
        const { activeToken, result } = await executeWithFreshToken(token, async (resolvedToken) => {
          return await createSavedMolecule(resolvedToken, input);
        });

        setSnapshot((currentSnapshot) => ({
          token: activeToken,
          data: sortSavedMolecules([result, ...currentSnapshot.data.filter((entry) => entry.id !== result.id)]),
          error: null,
        }));

        return result;
      } catch (caughtError: unknown) {
        if (isUnauthorizedError(caughtError)) {
          onUnauthorized();
        }

        throw caughtError;
      } finally {
        setIsMutating(false);
      }
    },
    [executeWithFreshToken, onUnauthorized, token],
  );

  const updateMoleculeById = useCallback(
    async (moleculeId: string, input: SaveMoleculeInput): Promise<SavedMolecule> => {
      if (token === null) {
        throw new Error('Authentication is required to update molecules.');
      }

      setIsMutating(true);

      try {
        const { activeToken, result } = await executeWithFreshToken(token, async (resolvedToken) => {
          return await updateSavedMolecule(resolvedToken, moleculeId, input);
        });

        setSnapshot((currentSnapshot) => ({
          token: activeToken,
          data: sortSavedMolecules(
            currentSnapshot.data.map((entry) => (entry.id === result.id ? result : entry)),
          ),
          error: null,
        }));

        return result;
      } catch (caughtError: unknown) {
        if (isUnauthorizedError(caughtError)) {
          onUnauthorized();
        }

        throw caughtError;
      } finally {
        setIsMutating(false);
      }
    },
    [executeWithFreshToken, onUnauthorized, token],
  );

  const deleteMoleculeById = useCallback(
    async (moleculeId: string): Promise<void> => {
      if (token === null) {
        throw new Error('Authentication is required to delete molecules.');
      }

      setIsMutating(true);

      try {
        const { activeToken } = await executeWithFreshToken(token, async (resolvedToken) => {
          await deleteSavedMolecule(resolvedToken, moleculeId);
        });

        setSnapshot((currentSnapshot) => ({
          token: activeToken,
          data: currentSnapshot.data.filter((entry) => entry.id !== moleculeId),
          error: null,
        }));
      } catch (caughtError: unknown) {
        if (isUnauthorizedError(caughtError)) {
          onUnauthorized();
        }

        throw caughtError;
      } finally {
        setIsMutating(false);
      }
    },
    [executeWithFreshToken, onUnauthorized, token],
  );

  const data = useMemo(() => {
    if (token === null) {
      return [];
    }

    if (snapshot.token === token) {
      return snapshot.data;
    }

    return snapshot.data;
  }, [snapshot.data, snapshot.token, token]);

  const error = useMemo(() => {
    if (token === null) {
      return null;
    }

    return snapshot.token === token ? snapshot.error : null;
  }, [snapshot.error, snapshot.token, token]);

  const isLoading = useMemo(() => {
    if (token === null) {
      return false;
    }

    return snapshot.token !== token && snapshot.data.length === 0;
  }, [snapshot.data.length, snapshot.token, token]);

  return {
    data,
    isLoading,
    isMutating,
    error,
    reload,
    createMolecule,
    updateMolecule: updateMoleculeById,
    deleteMolecule: deleteMoleculeById,
  };
}

export { mapSavedMoleculesErrorMessage };
export default useSavedMolecules;
