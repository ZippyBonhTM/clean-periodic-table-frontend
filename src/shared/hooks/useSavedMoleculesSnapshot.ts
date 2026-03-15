'use client';

import { useMemo } from 'react';

import type { SavedMolecule } from '@/shared/types/molecule';

type SavedMoleculesSnapshot = {
  token: string | null;
  data: SavedMolecule[];
  error: string | null;
};

export default function useSavedMoleculesSnapshot({
  snapshot,
  token,
}: {
  snapshot: SavedMoleculesSnapshot;
  token: string | null;
}) {
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
    error,
    isLoading,
  };
}
