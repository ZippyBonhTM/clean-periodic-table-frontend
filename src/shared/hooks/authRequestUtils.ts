'use client';

import { ApiError } from '@/shared/api/httpClient';
import { readJwtExpiryMs } from '@/shared/utils/jwt';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

function shouldRefreshBeforeRequest(token: string): boolean {
  const expiryMs = readJwtExpiryMs(token);

  if (expiryMs === null) {
    return false;
  }

  return expiryMs - Date.now() <= ACCESS_TOKEN_REFRESH_WINDOW_MS;
}

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
}

async function executeWithFreshToken<Result>(
  currentToken: string,
  refreshTokenOnce: () => Promise<string>,
  operation: (activeToken: string) => Promise<Result>,
): Promise<{ activeToken: string; result: Result }> {
  let activeToken = currentToken;

  if (shouldRefreshBeforeRequest(activeToken)) {
    activeToken = await refreshTokenOnce();
  }

  try {
    const result = await operation(activeToken);
    return { activeToken, result };
  } catch (caughtError: unknown) {
    if (!isUnauthorizedError(caughtError)) {
      throw caughtError;
    }

    const refreshedToken = await refreshTokenOnce();
    const result = await operation(refreshedToken);
    return { activeToken: refreshedToken, result };
  }
}

export { ACCESS_TOKEN_REFRESH_WINDOW_MS, executeWithFreshToken, isUnauthorizedError, shouldRefreshBeforeRequest };
