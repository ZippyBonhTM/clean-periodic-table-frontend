type ArticleFeedBrowseMode = 'feed' | 'search' | 'hashtag';

type ArticleFeedBrowseFilters = {
  mode: ArticleFeedBrowseMode;
  query: string | null;
  hashtag: string | null;
};

type ArticleFeedBrowseSearchParamsInput = {
  q?: string | string[] | undefined;
  tag?: string | string[] | undefined;
};

function normalizeAsciiToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeSearchParamValue(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim() ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeHashtagValue(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = normalizeAsciiToken(rawValue?.trim() ?? '')
    .replace(/^#+/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function resolveArticleFeedBrowseFilters(
  input: ArticleFeedBrowseSearchParamsInput,
): ArticleFeedBrowseFilters {
  const query = normalizeSearchParamValue(input.q);

  if (query !== null) {
    return {
      mode: 'search',
      query,
      hashtag: null,
    };
  }

  const hashtag = normalizeHashtagValue(input.tag);

  if (hashtag !== null) {
    return {
      mode: 'hashtag',
      query: null,
      hashtag,
    };
  }

  return {
    mode: 'feed',
    query: null,
    hashtag: null,
  };
}

function buildArticleFeedBrowseSearchParams(input: {
  query?: string | null;
  hashtag?: string | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const query = normalizeSearchParamValue(input.query);

  if (query !== null) {
    searchParams.set('q', query);
    return searchParams;
  }

  const hashtag = normalizeHashtagValue(input.hashtag);

  if (hashtag !== null) {
    searchParams.set('tag', hashtag);
  }

  return searchParams;
}

export {
  buildArticleFeedBrowseSearchParams,
  normalizeHashtagValue,
  resolveArticleFeedBrowseFilters,
};
export type {
  ArticleFeedBrowseFilters,
  ArticleFeedBrowseMode,
  ArticleFeedBrowseSearchParamsInput,
};
