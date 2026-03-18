'use client';

import { useEffect } from 'react';

import { listSavedMolecules } from '@/shared/api/moleculeApi';
import { executeWithFreshToken, isUnauthorizedError } from '@/shared/hooks/authRequestUtils';
import { SESSION_EXPIRED_ERROR_MESSAGE } from '@/shared/hooks/hookErrorMessages';
import type { SavedMolecule } from '@/shared/types/molecule';

type SavedMoleculesSnapshot = {
  token: string | null;
  data: SavedMolecule[];
  error: string | null;
};

type UseSavedMoleculesLoaderOptions = {
  mapSavedMoleculesErrorMessage: (error: unknown) => string;
  onUnauthorized: () => void;
  refreshTokenOnce: () => Promise<string>;
  reloadVersion: number;
  setSnapshot: React.Dispatch<React.SetStateAction<SavedMoleculesSnapshot>>;
  sortSavedMolecules: (data: SavedMolecule[]) => SavedMolecule[];
  token: string | null;
};

export default function useSavedMoleculesLoader({
  mapSavedMoleculesErrorMessage,
  onUnauthorized,
  refreshTokenOnce,
  reloadVersion,
  setSnapshot,
  sortSavedMolecules,
  token,
}: UseSavedMoleculesLoaderOptions) {
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
        const { activeToken, result } = await executeWithFreshToken(token, refreshTokenOnce, async (resolvedToken) => {
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
            error: SESSION_EXPIRED_ERROR_MESSAGE,
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
  }, [mapSavedMoleculesErrorMessage, onUnauthorized, refreshTokenOnce, reloadVersion, setSnapshot, sortSavedMolecules, token]);
}
