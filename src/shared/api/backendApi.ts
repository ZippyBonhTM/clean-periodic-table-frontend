import { requestJson } from './httpClient';
import type { ChemicalElement } from '@/shared/types/element';

type ElementsCacheEntry = {
  data: ChemicalElement[];
  fetchedAt: number;
};

type ListElementsOptions = {
  signal?: AbortSignal;
  forceRefresh?: boolean;
};

const ELEMENTS_CACHE_TTL_MS = 1000 * 60 * 5;
const elementsCache = new Map<string, ElementsCacheEntry>();
const pendingByToken = new Map<string, Promise<ChemicalElement[]>>();

function resolveBackendRequestBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

function isExpired(entry: ElementsCacheEntry): boolean {
  return Date.now() - entry.fetchedAt > ELEMENTS_CACHE_TTL_MS;
}

function getCachedElements(token: string): ChemicalElement[] | null {
  const cached = elementsCache.get(token);

  if (cached === undefined) {
    return null;
  }

  if (isExpired(cached)) {
    elementsCache.delete(token);
    return null;
  }

  return cached.data;
}

function cacheElements(token: string, data: ChemicalElement[]): void {
  elementsCache.set(token, {
    data,
    fetchedAt: Date.now(),
  });
}

async function listElements(
  token: string,
  input: ListElementsOptions = {},
): Promise<ChemicalElement[]> {
  const shouldForceRefresh = input.forceRefresh === true;

  if (!shouldForceRefresh) {
    const cached = getCachedElements(token);

    if (cached !== null) {
      return cached;
    }

    const pending = pendingByToken.get(token);
    if (pending !== undefined) {
      return pending;
    }
  }

  const pendingRequest = requestJson<ChemicalElement[]>(
    resolveBackendRequestBaseUrl(),
    '/api/elements',
    {
    method: 'GET',
      credentials: 'include',
      signal: input.signal,
    },
  )
    .then((response) => {
      cacheElements(token, response);
      return response;
    })
    .finally(() => {
      pendingByToken.delete(token);
    });

  pendingByToken.set(token, pendingRequest);
  return pendingRequest;
}

function clearElementsCache(token?: string): void {
  if (token !== undefined) {
    elementsCache.delete(token);
    pendingByToken.delete(token);
    return;
  }

  elementsCache.clear();
  pendingByToken.clear();
}

export { clearElementsCache, getCachedElements, listElements };
