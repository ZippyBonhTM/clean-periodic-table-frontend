export const articleDetailTextEn = {
  eyebrow: 'Article Detail',
  backToFeed: 'Back to articles',
  internalBadge: 'Internal Preview',
  actions: {
    saveArticle: 'Save article',
    savingArticle: 'Saving article...',
    savedArticle: 'Saved',
  },
  notices: {
    saveRequiresLogin: 'Sign in to save this article.',
    saveSucceeded: 'Article saved successfully.',
    saveFailed: 'We could not save this article right now.',
    saveFailedNetwork: 'We could not save this article. Check your connection and try again.',
    unavailable: 'The article detail experience is not available right now.',
  },
  unavailableTitle: 'This article is not available right now.',
  unavailableDescription:
    'The detail route is ready, but the frontend could not load the requested article from the article API.',
  authorFallback: 'Unknown author',
  status: {
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
  },
  meta: {
    updatedLabel: 'Updated',
    publishedLabel: 'Published',
    slugLabel: 'Slug',
    hashtagsLabel: 'Topics',
    noHashtags: 'No hashtags',
  },
} as const;
