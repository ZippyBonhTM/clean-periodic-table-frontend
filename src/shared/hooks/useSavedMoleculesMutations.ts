'use client';

import { useCallback, useState } from 'react';

import {
  createSavedMolecule,
  deleteSavedMolecule,
  updateSavedMolecule,
} from '@/shared/api/moleculeApi';
import { executeWithFreshToken, isUnauthorizedError } from '@/shared/hooks/authRequestUtils';
import type { SavedMoleculesSnapshot } from '@/shared/hooks/savedMolecules.types';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculesMutationsOptions = {
  onUnauthorized: () => void;
  refreshTokenOnce: () => Promise<string>;
  setSnapshot: React.Dispatch<React.SetStateAction<SavedMoleculesSnapshot>>;
  sortSavedMolecules: (data: SavedMolecule[]) => SavedMolecule[];
  token: string | null;
};

export default function useSavedMoleculesMutations({
  onUnauthorized,
  refreshTokenOnce,
  setSnapshot,
  sortSavedMolecules,
  token,
}: UseSavedMoleculesMutationsOptions) {
  const [isMutating, setIsMutating] = useState(false);

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
    [onUnauthorized, refreshTokenOnce, setSnapshot, sortSavedMolecules, token],
  );

  const updateMolecule = useCallback(
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
          data: sortSavedMolecules(currentSnapshot.data.map((entry) => (entry.id === result.id ? result : entry))),
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
    [onUnauthorized, refreshTokenOnce, setSnapshot, sortSavedMolecules, token],
  );

  const deleteMolecule = useCallback(
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
    [onUnauthorized, refreshTokenOnce, setSnapshot, token],
  );

  return {
    createMolecule,
    deleteMolecule,
    isMutating,
    updateMolecule,
  };
}
