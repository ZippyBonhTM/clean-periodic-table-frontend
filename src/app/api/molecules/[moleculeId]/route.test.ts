import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const originalBackendApiUrl = process.env.BACKEND_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe('DELETE /api/molecules/[moleculeId]', () => {
  beforeEach(() => {
    process.env.BACKEND_API_URL = 'https://backend.example.com';
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.BACKEND_API_URL = originalBackendApiUrl;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it('forwards explicit bearer requests to the backend molecule endpoint', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const requestHeaders = new Headers(init?.headers);
      const authorizationHeader = requestHeaders.get('authorization');

      if (
        url.origin === 'https://backend.example.com' &&
        url.pathname === '/molecules/mol-1' &&
        authorizationHeader === 'Bearer explicit-token'
      ) {
        return new Response(null, {
          status: 204,
        });
      }

      throw new Error(`Unexpected request to ${url.toString()} (${authorizationHeader ?? 'no-auth'})`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { DELETE } = await import('@/app/api/molecules/[moleculeId]/route');
    const request = new NextRequest('http://localhost:3000/api/molecules/mol-1', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer explicit-token',
      },
    });

    const response = await DELETE(request, {
      params: Promise.resolve({
        moleculeId: 'mol-1',
      }),
    });

    expect(response.status).toBe(204);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
