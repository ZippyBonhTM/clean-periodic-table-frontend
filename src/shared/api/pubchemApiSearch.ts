import { ApiError, requestJson } from '@/shared/api/httpClient';
import type {
  PubChemAutocompleteResponse,
  PubChemCidResponse,
  PubChemCompoundSearchResult,
  PubChemPropertiesResponse,
} from '@/shared/api/pubchemApi.types';

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov';
const PUBCHEM_RESULT_LIMIT = 6;

function normalizePubChemName(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized !== undefined && normalized.length > 0 ? normalized : fallback;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const nextValues: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();

    if (normalized.length === 0) {
      return;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    nextValues.push(normalized);
  });

  return nextValues;
}

function dedupeNumbers(values: number[]): number[] {
  const seen = new Set<number>();
  const nextValues: number[] = [];

  values.forEach((value) => {
    if (!Number.isFinite(value) || seen.has(value)) {
      return;
    }

    seen.add(value);
    nextValues.push(value);
  });

  return nextValues;
}

async function requestPubChemCidsByName(
  query: string,
  nameType: 'complete' | 'word',
  signal?: AbortSignal,
): Promise<number[]> {
  const encodedQuery = encodeURIComponent(query.trim());

  if (encodedQuery.length === 0) {
    return [];
  }

  try {
    const response = await requestJson<PubChemCidResponse>(
      PUBCHEM_BASE_URL,
      `/rest/pug/compound/name/${encodedQuery}/cids/JSON?name_type=${nameType}`,
      {
        signal,
      },
    );

    return dedupeNumbers(response.IdentifierList?.CID ?? []);
  } catch (caughtError: unknown) {
    if (caughtError instanceof ApiError && caughtError.statusCode === 404) {
      return [];
    }

    throw caughtError;
  }
}

async function listPubChemAutocompleteSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return trimmedQuery.length === 0 ? [] : [trimmedQuery];
  }

  const encodedQuery = encodeURIComponent(trimmedQuery);
  const response = await requestJson<PubChemAutocompleteResponse>(
    PUBCHEM_BASE_URL,
    `/rest/autocomplete/compound/${encodedQuery}/JSON`,
    {
      signal,
    },
  );

  return dedupeStrings([trimmedQuery, ...(response.dictionary_terms?.compound ?? [])]).slice(0, 8);
}

async function listPubChemCompoundResultsByTerm(
  term: string,
  signal?: AbortSignal,
): Promise<PubChemCompoundSearchResult[]> {
  const trimmedTerm = term.trim();

  if (trimmedTerm.length === 0) {
    return [];
  }

  const exactCids = await requestPubChemCidsByName(trimmedTerm, 'complete', signal);
  const fallbackCids =
    exactCids.length >= PUBCHEM_RESULT_LIMIT ? [] : await requestPubChemCidsByName(trimmedTerm, 'word', signal);
  const resolvedCids = dedupeNumbers([...exactCids, ...fallbackCids]).slice(0, PUBCHEM_RESULT_LIMIT);

  if (resolvedCids.length === 0) {
    return [];
  }

  const response = await requestJson<PubChemPropertiesResponse>(
    PUBCHEM_BASE_URL,
    `/rest/pug/compound/cid/${resolvedCids.join(',')}/property/Title,IUPACName,MolecularFormula/JSON`,
    {
      signal,
    },
  );
  const propertiesByCid = new Map((response.PropertyTable?.Properties ?? []).map((entry) => [entry.CID, entry]));

  return resolvedCids.map((cid) => {
    const properties = propertiesByCid.get(cid);

    return {
      cid,
      title: normalizePubChemName(properties?.Title, `CID ${cid}`),
      iupacName: properties?.IUPACName?.trim() ?? null,
      molecularFormula: properties?.MolecularFormula?.trim() ?? null,
      matchedTerm: trimmedTerm,
    };
  });
}

async function listPubChemCompoundSearchResults(
  query: string,
  signal?: AbortSignal,
): Promise<{
  activeTerm: string | null;
  suggestions: string[];
  results: PubChemCompoundSearchResult[];
}> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return {
      activeTerm: null,
      suggestions: [],
      results: [],
    };
  }

  const suggestions = await listPubChemAutocompleteSuggestions(trimmedQuery, signal);
  const activeTerm = suggestions[0] ?? trimmedQuery;

  return {
    activeTerm,
    suggestions,
    results: await listPubChemCompoundResultsByTerm(activeTerm, signal),
  };
}

export {
  listPubChemAutocompleteSuggestions,
  listPubChemCompoundResultsByTerm,
  listPubChemCompoundSearchResults,
};
