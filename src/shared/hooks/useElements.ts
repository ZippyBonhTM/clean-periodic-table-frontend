'use client';

import { useEffect, useMemo, useState } from 'react';

import { listElements } from '@/shared/api/backendApi';
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

    const abortController = new AbortController();

    listElements(token, abortController.signal)
      .then((response) => {
        setSnapshot({
          token,
          data: response,
          error: null,
        });
      })
      .catch((caughtError: unknown) => {
        if (abortController.signal.aborted) {
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
      abortController.abort();
    };
  }, [token]);

  const sortedElements = useMemo(() => {
    if (snapshot.token !== token || token === null) {
      return [];
    }

    return [...snapshot.data].sort((first, second) => first.number - second.number);
  }, [snapshot, token]);

  const error = useMemo(() => {
    if (snapshot.token !== token || token === null) {
      return null;
    }

    return snapshot.error;
  }, [snapshot, token]);

  const isLoading = useMemo(
    () => token !== null && snapshot.token !== token,
    [snapshot.token, token],
  );

  return {
    data: sortedElements,
    isLoading,
    error,
  };
}

export default useElements;
