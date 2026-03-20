export const articleFeedTextEn = {
  eyebrow: 'Article System',
  title: 'Public chemistry writing starts here.',
  description:
    'A read-only article feed for chemistry notes, explainers, and experiments, prepared to grow into the full Article System.',
  internalBadge: 'Internal Preview',
  stats: {
    loadedCountLabel: 'articles loaded',
    availabilityAvailable: 'Public feed available',
    availabilityUnavailable: 'Feed waiting for backend connection',
  },
  states: {
    unavailable: 'The public article feed is not available yet on this environment.',
    empty: 'No public articles have been published yet.',
    loadMore: 'Load more',
    loadingMore: 'Loading more articles...',
    loadMoreFailed: 'Could not load more articles right now.',
    retry: 'Try again',
  },
  cards: {
    untitled: 'Untitled article',
    noExcerpt: 'No excerpt available yet.',
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
    bylineFallback: 'Unknown author',
    hashtagFallback: 'No hashtags',
    scoreLabel: 'Score',
    openArticle: 'Open article',
  },
} as const;
