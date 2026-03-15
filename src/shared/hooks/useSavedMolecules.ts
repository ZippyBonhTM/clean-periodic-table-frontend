'use client';

import { useCallback, useState } from 'react';

import {
  createSavedMolecule,
  deleteSavedMolecule,
  updateSavedMolecule,
} from '@/shared/api/moleculeApi';
import { refreshAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import { executeWithFreshToken, isUnauthorizedError } from '@/shared/hooks/authRequestUtils';
import useSavedMoleculesLoader from '@/shared/hooks/useSavedMoleculesLoader';
import useSavedMoleculesSnapshot from '@/shared/hooks/useSavedMoleculesSnapshot';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

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

function sortSavedMolecules(data: SavedMolecule[]): SavedMolecule[] {
  return [...data].sort((first, second) => {
    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
  });
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

  const reload = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  useSavedMoleculesLoader({
    mapSavedMoleculesErrorMessage,
    onUnauthorized,
    refreshTokenOnce,
    reloadVersion,
    setSnapshot,
    sortSavedMolecules,
    token,
  });

  const createMolecule = useCallback(
    async (input: SaveMoleculeInput): Promise<SavedMolecule> => {
      if (token === null) {
        throw new Error('Authentication is required to save molecules.');
      }

      setIsMutating(true);

      try {
        const { activeToken, result } = await executeWithFreshToken(token, refreshTokenOnce, async (resolvedToken) => {
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
    [onUnauthorized, refreshTokenOnce, token],
  );

  const updateMoleculeById = useCallback(
    async (moleculeId: string, input: SaveMoleculeInput): Promise<SavedMolecule> => {
      if (token === null) {
        throw new Error('Authentication is required to update molecules.');
      }

      setIsMutating(true);

      try {
        const { activeToken, result } = await executeWithFreshToken(token, refreshTokenOnce, async (resolvedToken) => {
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
    [onUnauthorized, refreshTokenOnce, token],
  );

  const deleteMoleculeById = useCallback(
    async (moleculeId: string): Promise<void> => {
      if (token === null) {
        throw new Error('Authentication is required to delete molecules.');
      }

      setIsMutating(true);

      try {
        const { activeToken } = await executeWithFreshToken(token, refreshTokenOnce, async (resolvedToken) => {
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
    [onUnauthorized, refreshTokenOnce, token],
  );

  const { data, error, isLoading } = useSavedMoleculesSnapshot({
    snapshot,
    token,
  });

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
