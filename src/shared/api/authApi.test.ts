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

import { fetchProfile, resolveAuthSession } from '@/shared/api/authApi';
import { requestJson } from '@/shared/api/httpClient';

const mockedRequestJson = vi.mocked(requestJson);

describe('authApi', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('resolves the current session through the dedicated session endpoint', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedRequestJson.mockImplementation(async (_baseUrl, path, input) => {
      if (path === '/api/auth/session') {
        expect(input?.token).toBe('still-valid-token');

        return {
          authenticated: true,
          accessToken: 'still-valid-token',
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

    const response = await resolveAuthSession('still-valid-token');

    expect(response.userProfile).toEqual({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'USER',
    });
    expect(mockedRequestJson).toHaveBeenCalledTimes(1);
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000',
      '/api/auth/session',
      expect.objectContaining({
        method: 'GET',
        token: 'still-valid-token',
        credentials: 'include',
      }),
    );
  });

  it('fetches the profile by reusing the session endpoint instead of doing local refresh choreography', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedRequestJson.mockImplementation(async (_baseUrl, path, input) => {
      if (path === '/api/auth/session') {
        expect(input?.token).toBe('expired-token');

        return {
          authenticated: true,
          accessToken: 'fresh-token',
          userProfile: {
            id: 'user-2',
            name: 'Grace',
            email: 'grace@example.com',
            role: 'USER',
          },
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
      '/api/auth/session',
      expect.objectContaining({
        method: 'GET',
        token: 'expired-token',
      }),
    );
    expect(mockedRequestJson).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent session resolution calls for the same token', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    let sessionResolver: ((value: {
      authenticated: true;
      accessToken: string;
      userProfile: { id: string; name: string; email: string; role: 'USER' };
    }) => void) | null = null;
    const sessionPromise = new Promise<{
      authenticated: true;
      accessToken: string;
      userProfile: { id: string; name: string; email: string; role: 'USER' };
    }>((resolve) => {
      sessionResolver = resolve;
    });

    mockedRequestJson.mockImplementation(async (_baseUrl, path) => {
      if (path === '/api/auth/session') {
        return await sessionPromise;
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const pendingSessionRequests = Promise.all([
      resolveAuthSession('stale-token'),
      resolveAuthSession('stale-token'),
    ]);

    sessionResolver?.({
      authenticated: true,
      accessToken: 'shared-fresh-token',
      userProfile: {
        id: 'user-3',
        name: 'Linus',
        email: 'linus@example.com',
        role: 'USER',
      },
    });

    const responses = await pendingSessionRequests;

    expect(responses).toHaveLength(2);
    expect(mockedRequestJson).toHaveBeenCalledTimes(1);
  });
});
