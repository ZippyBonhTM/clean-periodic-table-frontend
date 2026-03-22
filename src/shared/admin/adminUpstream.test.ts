import { afterEach, describe, expect, it } from 'vitest';

import {
  buildAdminUpstreamApiUrl,
  canFallbackToLegacyAdminAuthorization,
  resolveAdminAuthorizationSource,
  resolveAdminProxyTarget,
  resolveAdminUpstreamBaseUrl,
} from '@/shared/admin/adminUpstream';

const originalAdminApiUrl = process.env.ADMIN_API_URL;
const originalBackendApiUrl = process.env.BACKEND_API_URL;
const originalPublicBackendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const originalAdminAuthzSource = process.env.ADMIN_AUTHZ_SOURCE;
const originalPublicAdminAuthzSource = process.env.NEXT_PUBLIC_ADMIN_AUTHZ_SOURCE;

afterEach(() => {
  process.env.ADMIN_API_URL = originalAdminApiUrl;
  process.env.BACKEND_API_URL = originalBackendApiUrl;
  process.env.NEXT_PUBLIC_BACKEND_API_URL = originalPublicBackendApiUrl;
  process.env.ADMIN_AUTHZ_SOURCE = originalAdminAuthzSource;
  process.env.NEXT_PUBLIC_ADMIN_AUTHZ_SOURCE = originalPublicAdminAuthzSource;
});

describe('adminUpstream', () => {
  it('defaults to the legacy auth source for compatibility', () => {
    process.env.ADMIN_AUTHZ_SOURCE = '';
    process.env.NEXT_PUBLIC_ADMIN_AUTHZ_SOURCE = '';

    expect(resolveAdminAuthorizationSource()).toBe('legacy-auth');
    expect(resolveAdminProxyTarget()).toBe('legacy-auth');
    expect(canFallbackToLegacyAdminAuthorization()).toBe(true);
  });

  it('resolves the backend admin upstream from explicit or backend service urls', () => {
    process.env.ADMIN_API_URL = 'https://admin.example.com/internal/';
    expect(resolveAdminUpstreamBaseUrl()).toBe('https://admin.example.com/internal');
    expect(buildAdminUpstreamApiUrl('/api/v1/admin/users?cursor=next')?.toString()).toBe(
      'https://admin.example.com/internal/api/v1/admin/users?cursor=next',
    );

    process.env.ADMIN_API_URL = '';
    process.env.BACKEND_API_URL = 'https://backend.example.com';
    expect(resolveAdminUpstreamBaseUrl()).toBe('https://backend.example.com');
  });

  it('prefers the backend target when auto mode has a backend service configured', () => {
    process.env.ADMIN_AUTHZ_SOURCE = 'auto';
    process.env.BACKEND_API_URL = 'https://backend.example.com';

    expect(resolveAdminAuthorizationSource()).toBe('auto');
    expect(resolveAdminProxyTarget()).toBe('backend');
    expect(canFallbackToLegacyAdminAuthorization()).toBe(true);
  });

  it('keeps backend mode strict when explicitly requested', () => {
    process.env.ADMIN_AUTHZ_SOURCE = 'backend';
    process.env.BACKEND_API_URL = 'https://backend.example.com';

    expect(resolveAdminAuthorizationSource()).toBe('backend');
    expect(resolveAdminProxyTarget()).toBe('backend');
    expect(canFallbackToLegacyAdminAuthorization()).toBe(false);
  });
});
