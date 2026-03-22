import type { AdminAuthorizationSource } from '@/shared/admin/adminUpstream';

type BackendAdminSessionResolution = 'granted' | 'forbidden' | 'unavailable';

function shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution(
  source: AdminAuthorizationSource,
  resolution: BackendAdminSessionResolution,
): boolean {
  return source === 'auto' && resolution === 'unavailable';
}

export {
  shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution,
};
export type { BackendAdminSessionResolution };
