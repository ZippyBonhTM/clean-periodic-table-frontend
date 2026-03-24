export const articleSavedListTextEn = {
  title: 'Your saved articles.',
  description:
    'Revisit public articles you saved without exposing this route publicly.',
  internalBadge: 'Internal Preview',
  yourArticles: 'Your articles',
  browseFeed: 'Browse feed',
  stats: {
    loadedCountLabel: 'saved articles loaded',
  },
  states: {
    loading: 'Loading your saved articles...',
    unavailable: 'The saved articles library is not available right now.',
    loadFailed: 'We could not load your saved articles right now.',
    loadFailedNetwork:
      'We could not load your saved articles. Check your connection and try again.',
    empty: 'You have not saved any articles yet.',
    signInRequired: 'Sign in to open your saved articles library.',
    loadingMore: 'Loading more saved articles...',
    loadMore: 'Load more',
    retry: 'Try again',
    discoverArticles: 'Discover articles',
  },
  cards: {
    untitled: 'Untitled article',
    noExcerpt: 'No excerpt available yet.',
    publicVisibility: 'Public',
    privateVisibility: 'Private',
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
    bylineFallback: 'Unknown author',
    publishedAtPrefix: 'Published',
    updatedAtPrefix: 'Updated',
    openArticle: 'Open article',
    unavailableArticle: 'Unavailable right now',
  },
} as const;
