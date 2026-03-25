import { ArticleApiConfigurationError } from '@/shared/api/articleApi';
import { ApiError } from '@/shared/api/httpClient';

type ArticleWorkspaceErrorText = {
  unavailable: string;
  loadFailed: string;
  loadFailedNetwork: string;
  signInRequired: string;
};

function resolveArticleWorkspaceMessage(
  error: unknown,
  text: ArticleWorkspaceErrorText,
): string {
  if (error instanceof ArticleApiConfigurationError) {
    return text.unavailable;
  }

  if (error instanceof ApiError && error.statusCode === 0) {
    return text.loadFailedNetwork;
  }

  if (error instanceof ApiError && error.statusCode === 404) {
    return text.unavailable;
  }

  if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
    return text.signInRequired;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return text.loadFailed;
}

export { resolveArticleWorkspaceMessage };
export type { ArticleWorkspaceErrorText };
