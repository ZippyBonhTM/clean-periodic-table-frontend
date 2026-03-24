'use client';

import { ApiError } from '@/shared/api/httpClient';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
}

async function executeWithFreshToken<Result>(
  currentToken: string,
  refreshTokenOnce: () => Promise<string>,
  operation: (activeToken: string) => Promise<Result>,
): Promise<{ activeToken: string; result: Result }> {
  try {
    const result = await operation(currentToken);
    return { activeToken: currentToken, result };
  } catch (caughtError: unknown) {
    if (!isUnauthorizedError(caughtError)) {
      throw caughtError;
    }

    const refreshedToken = await refreshTokenOnce();
    const result = await operation(refreshedToken);
    return { activeToken: refreshedToken, result };
  }
}

export { ACCESS_TOKEN_REFRESH_WINDOW_MS, executeWithFreshToken, isUnauthorizedError };
