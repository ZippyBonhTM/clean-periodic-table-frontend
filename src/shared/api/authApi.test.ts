import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/httpClient', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api/httpClient')>(
    '@/shared/api/httpClient',
  );

  return {
    ...actual,
    requestJson: vi.fn(),
  };
});

vi.mock('@/shared/utils/jwt', () => ({
  readJwtExpiryMs: vi.fn(),
}));

import { fetchProfile } from '@/shared/api/authApi';
import { ApiError, requestJson } from '@/shared/api/httpClient';
import { readJwtExpiryMs } from '@/shared/utils/jwt';

const mockedRequestJson = vi.mocked(requestJson);
const mockedReadJwtExpiryMs = vi.mocked(readJwtExpiryMs);

describe('authApi', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('refreshes before requesting profile when the access token is near expiry', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedReadJwtExpiryMs.mockReturnValue(Date.now() + 10_000);
    mockedRequestJson.mockImplementation(async (_baseUrl, path, input) => {
      if (path === '/api/auth/refresh') {
        return {
          accessToken: 'fresh-token',
        };
      }

      if (path === '/api/auth/profile') {
        expect(input?.token).toBe('fresh-token');

        return {
          accessToken: 'fresh-token',
          userProfile: {
            id: 'user-1',
            name: 'Ada',
            email: 'ada@example.com',
            role: 'USER',
          },
        };
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const response = await fetchProfile('stale-token');

    expect(response.userProfile).toEqual({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'USER',
    });
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000',
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000',
      '/api/auth/profile',
      expect.objectContaining({
        method: 'GET',
        token: 'fresh-token',
        credentials: 'include',
      }),
    );
  });

  it('retries the profile request after an unauthorized response by using refresh once', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedReadJwtExpiryMs.mockReturnValue(Date.now() + 60_000);
    let profileAttempt = 0;

    mockedRequestJson.mockImplementation(async (_baseUrl, path, input) => {
      if (path === '/api/auth/profile') {
        profileAttempt += 1;

        if (profileAttempt === 1) {
          expect(input?.token).toBe('expired-token');
          throw new ApiError('Unauthorized', 401);
        }

        expect(input?.token).toBe('fresh-token');

        return {
          accessToken: 'fresh-token',
          userProfile: {
            id: 'user-2',
            name: 'Grace',
            email: 'grace@example.com',
            role: 'USER',
          },
        };
      }

      if (path === '/api/auth/refresh') {
        return {
          accessToken: 'fresh-token',
        };
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const response = await fetchProfile('expired-token');

    expect(response.userProfile).toEqual({
      id: 'user-2',
      name: 'Grace',
      email: 'grace@example.com',
      role: 'USER',
    });
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000',
      '/api/auth/profile',
      expect.objectContaining({
        method: 'GET',
        token: 'expired-token',
      }),
    );
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000',
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000',
      '/api/auth/profile',
      expect.objectContaining({
        method: 'GET',
        token: 'fresh-token',
      }),
    );
  });

  it('deduplicates concurrent refresh calls while multiple profile requests recover together', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedReadJwtExpiryMs.mockReturnValue(Date.now() + 5_000);

    let refreshResolver: ((value: { accessToken: string }) => void) | null = null;
    const refreshPromise = new Promise<{ accessToken: string }>((resolve) => {
      refreshResolver = resolve;
    });

    mockedRequestJson.mockImplementation(async (_baseUrl, path, input) => {
      if (path === '/api/auth/refresh') {
        return await refreshPromise;
      }

      if (path === '/api/auth/profile') {
        return {
          accessToken: 'shared-fresh-token',
          userProfile: {
            id: input?.token === 'shared-fresh-token' ? 'user-3' : 'unexpected',
            name: 'Linus',
            email: 'linus@example.com',
            role: 'USER',
          },
        };
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const pendingProfileRequests = Promise.all([
      fetchProfile('stale-token'),
      fetchProfile('stale-token'),
    ]);

    refreshResolver?.({
      accessToken: 'shared-fresh-token',
    });

    const responses = await pendingProfileRequests;

    expect(responses).toHaveLength(2);
    expect(mockedRequestJson).toHaveBeenCalledTimes(3);
    expect(mockedRequestJson).toHaveBeenCalledWith(
      'http://localhost:3000',
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});
