import { ApiError } from '@/shared/api/httpClient';

function shouldPersistNegativeAdminSessionCache(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 403;
}

export { shouldPersistNegativeAdminSessionCache };
