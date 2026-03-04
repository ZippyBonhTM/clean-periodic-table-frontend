'use client';

import { useEffect, useMemo, useState } from 'react';

import { getCachedElements, listElements } from '@/shared/api/backendApi';
import { ApiError } from '@/shared/api/httpClient';
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

function useElements(token: string | null): ElementsState {
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

    listElements(token)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setSnapshot({
          token,
          data: response,
          error: null,
        });
      })
      .catch((caughtError: unknown) => {
        if (isCancelled) {
          return;
        }

        if (caughtError instanceof ApiError) {
          setSnapshot({
            token,
            data: [],
            error: caughtError.message,
          });
          return;
        }

        setSnapshot({
          token,
          data: [],
          error: 'Could not load elements right now.',
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [token]);

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

    return cachedElements ?? [];
  }, [cachedElements, snapshot.data, snapshot.token, token]);

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

    return snapshot.token !== token && cachedElements === null;
  }, [cachedElements, snapshot.token, token]);

  return {
    data: sortedElements,
    isLoading,
    error,
  };
}

export default useElements;
