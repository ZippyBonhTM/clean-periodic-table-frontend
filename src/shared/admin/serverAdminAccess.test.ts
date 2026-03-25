import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';

const notFoundError = new Error('NEXT_NOT_FOUND');
const mockedCookies = vi.fn();
const mockedHeaders = vi.fn();
const mockedNotFound = vi.fn(() => {
  throw notFoundError;
});

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: mockedCookies,
  headers: mockedHeaders,
}));

vi.mock('next/navigation', () => ({
  notFound: mockedNotFound,
}));

const originalAdminAuthzSource = process.env.ADMIN_AUTHZ_SOURCE;
const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalBackendApiUrl = process.env.BACKEND_API_URL;

function createCookieStore(entries: Record<string, string>) {
  return {
    get(name: string) {
      const value = entries[name];

      if (value === undefined) {
        return undefined;
      }

      return {
        value,
      };
    },
  };
}

function createHeaderStore(cookieHeader: string | null = null) {
  return {
    get(name: string) {
      if (name.toLowerCase() === 'cookie') {
        return cookieHeader;
      }

      return null;
    },
  };
}

describe('serverAdminAccess', () => {
  beforeEach(() => {
    process.env.ADMIN_AUTHZ_SOURCE = 'backend';
    process.env.AUTH_API_URL = 'https://auth.example.com';
    process.env.BACKEND_API_URL = 'https://backend.example.com';
    mockedCookies.mockResolvedValue(
      createCookieStore({
        [SERVER_ACCESS_TOKEN_COOKIE_KEY]: 'expired-token',
        [CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY]: 'expired-token',
      }),
    );
    mockedHeaders.mockResolvedValue(createHeaderStore('refreshToken=refresh-cookie'));
    mockedNotFound.mockClear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.ADMIN_AUTHZ_SOURCE = originalAdminAuthzSource;
    process.env.AUTH_API_URL = originalAuthApiUrl;
    process.env.BACKEND_API_URL = originalBackendApiUrl;
    vi.unstubAllGlobals();
  });

  it('does not rotate refresh cookies during backend admin SSR resolution', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input : new URL(String(input));

      if (url.origin === 'https://backend.example.com') {
        return {
          ok: false,
          status: 401,
          json: async () => null,
        } satisfies Partial<Response>;
      }

      return {
        ok: false,
        status: 500,
        json: async () => null,
      } satisfies Partial<Response>;
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { requireServerAdminAccess } = await import('@/shared/admin/serverAdminAccess');

    await expect(requireServerAdminAccess()).rejects.toBe(notFoundError);
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const calledUrl = fetchSpy.mock.calls[0]?.[0];
    expect(calledUrl instanceof URL ? calledUrl.toString() : String(calledUrl)).toContain(
      'https://backend.example.com/api/v1/admin/session',
    );
  });

  it('marks backend admin SSR resolution as recoverable when a refresh cookie is still present', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input : new URL(String(input));

      if (url.origin === 'https://backend.example.com') {
        return {
          ok: false,
          status: 401,
          json: async () => null,
        } satisfies Partial<Response>;
      }

      return {
        ok: false,
        status: 500,
        json: async () => null,
      } satisfies Partial<Response>;
    });

    vi.stubGlobal('fetch', fetchSpy);
    vi.resetModules();

    const { resolveServerAdminAccessGate } = await import('@/shared/admin/serverAdminAccess');

    await expect(resolveServerAdminAccessGate()).resolves.toEqual({
      resolution: 'recoverable',
      userProfile: null,
    });
  });

  it('does not rotate refresh cookies during legacy profile SSR resolution', async () => {
    process.env.ADMIN_AUTHZ_SOURCE = 'legacy-auth';

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input : new URL(String(input));

      if (url.origin === 'https://auth.example.com') {
        return {
          ok: false,
          status: 401,
          json: async () => null,
        } satisfies Partial<Response>;
      }

      return {
        ok: false,
        status: 500,
        json: async () => null,
      } satisfies Partial<Response>;
    });

    vi.stubGlobal('fetch', fetchSpy);
    vi.resetModules();

    const { requireServerAdminAccess } = await import('@/shared/admin/serverAdminAccess');

    await expect(requireServerAdminAccess()).rejects.toBe(notFoundError);
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const calledUrl = fetchSpy.mock.calls[0]?.[0];
    expect(calledUrl instanceof URL ? calledUrl.toString() : String(calledUrl)).toContain(
      'https://auth.example.com/profile',
    );
  });

  it('still denies access immediately when no refresh cookie exists to recover the session', async () => {
    const fetchSpy = vi.fn(async () => {
      return {
        ok: false,
        status: 401,
        json: async () => null,
      } satisfies Partial<Response>;
    });

    mockedHeaders.mockResolvedValue(createHeaderStore(null));
    vi.stubGlobal('fetch', fetchSpy);
    vi.resetModules();

    const { resolveServerAdminAccessGate } = await import('@/shared/admin/serverAdminAccess');

    await expect(resolveServerAdminAccessGate()).resolves.toBeNull();
  });
});
