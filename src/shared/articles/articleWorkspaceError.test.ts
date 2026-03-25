import { describe, expect, it } from 'vitest';

import { ArticleApiConfigurationError } from '@/shared/api/articleApi';
import { ApiError } from '@/shared/api/httpClient';
import { resolveArticleWorkspaceMessage } from '@/shared/articles/articleWorkspaceError';

const text = {
  unavailable: 'Indisponivel agora.',
  loadFailed: 'Falha ao carregar.',
  loadFailedNetwork: 'Falha de rede.',
  signInRequired: 'Entre para continuar.',
};

describe('articleWorkspaceError', () => {
  it('maps 404 responses to the localized unavailable copy instead of leaking raw not found text', () => {
    const message = resolveArticleWorkspaceMessage(new ApiError('Not found', 404), text);

    expect(message).toBe(text.unavailable);
  });

  it('maps configuration and auth failures to the expected localized copy', () => {
    expect(
      resolveArticleWorkspaceMessage(new ArticleApiConfigurationError(), text),
    ).toBe(text.unavailable);
    expect(resolveArticleWorkspaceMessage(new ApiError('Forbidden', 403), text)).toBe(
      text.signInRequired,
    );
  });

  it('keeps non-404 backend messages available when they are useful', () => {
    expect(
      resolveArticleWorkspaceMessage(new ApiError('Rate limit exceeded.', 429), text),
    ).toBe('Rate limit exceeded.');
  });
});
