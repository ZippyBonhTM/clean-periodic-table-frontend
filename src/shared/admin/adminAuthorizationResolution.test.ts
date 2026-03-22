import { describe, expect, it } from 'vitest';

import { shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution } from '@/shared/admin/adminAuthorizationResolution';

describe('adminAuthorizationResolution', () => {
  it('allows legacy fallback only when auto mode cannot resolve backend authority', () => {
    expect(
      shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution('auto', 'unavailable'),
    ).toBe(true);
    expect(
      shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution('auto', 'forbidden'),
    ).toBe(false);
    expect(
      shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution('backend', 'unavailable'),
    ).toBe(false);
    expect(
      shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution('legacy-auth', 'unavailable'),
    ).toBe(false);
  });
});
