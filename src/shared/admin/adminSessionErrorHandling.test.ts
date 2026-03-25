import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/httpClient';
import { shouldPersistNegativeAdminSessionCache } from '@/shared/admin/adminSessionErrorHandling';

describe('adminSessionErrorHandling', () => {
  it('treats forbidden admin session responses as authoritative negative access', () => {
    expect(
      shouldPersistNegativeAdminSessionCache(
        new ApiError('Forbidden', 403, 'FORBIDDEN'),
      ),
    ).toBe(true);
  });

  it('does not treat unauthorized refresh/session failures as authoritative negative access', () => {
    expect(
      shouldPersistNegativeAdminSessionCache(
        new ApiError('Unauthorized', 401, 'UNAUTHORIZED'),
      ),
    ).toBe(false);
  });

  it('does not treat transient upstream failures as authoritative negative access', () => {
    expect(
      shouldPersistNegativeAdminSessionCache(
        new ApiError('Authentication service unavailable.', 503, 'UNAVAILABLE'),
      ),
    ).toBe(false);
  });

  it('does not treat network failures as authoritative negative access', () => {
    expect(
      shouldPersistNegativeAdminSessionCache(
        new ApiError('Network error', 0, 'NETWORK_ERROR'),
      ),
    ).toBe(false);
  });
});
