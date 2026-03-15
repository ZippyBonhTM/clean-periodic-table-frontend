'use client';

import { useCallback, useState } from 'react';

import { refreshAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import useSavedMoleculesLoader from '@/shared/hooks/useSavedMoleculesLoader';
import useSavedMoleculesMutations from '@/shared/hooks/useSavedMoleculesMutations';
import useSavedMoleculesSnapshot from '@/shared/hooks/useSavedMoleculesSnapshot';
import type {
  SavedMoleculesSnapshot,
  UseSavedMoleculesInput,
  UseSavedMoleculesOutput,
} from '@/shared/hooks/savedMolecules.types';
import type { SavedMolecule } from '@/shared/types/molecule';

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

  const { createMolecule, deleteMolecule, isMutating: isMoleculeMutating, updateMolecule } = useSavedMoleculesMutations({
    onUnauthorized,
    refreshTokenOnce,
    setSnapshot,
    sortSavedMolecules,
    token,
  });

  const { data, error, isLoading } = useSavedMoleculesSnapshot({
    snapshot,
    token,
  });

  return {
    data,
    isLoading,
    isMutating: isMoleculeMutating,
    error,
    reload,
    createMolecule,
    updateMolecule,
    deleteMolecule,
  };
}

export { mapSavedMoleculesErrorMessage };
export default useSavedMolecules;
