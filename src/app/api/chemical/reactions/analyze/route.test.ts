import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalBackendApiUrl = process.env.BACKEND_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe('POST /api/chemical/reactions/analyze', () => {
  beforeEach(() => {
    process.env.AUTH_API_URL = 'https://auth.example.com';
    process.env.BACKEND_API_URL = 'https://backend.example.com';
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.AUTH_API_URL = originalAuthApiUrl;
    process.env.BACKEND_API_URL = originalBackendApiUrl;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it('falls back to anonymous proxying for optional auth requests', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const requestHeaders = new Headers(init?.headers);
      const authorizationHeader = requestHeaders.get('authorization');

      if (url.origin === 'https://auth.example.com' && url.pathname === '/refresh') {
        return new Response(
          JSON.stringify({
            message: 'Not authenticated.',
          }),
          {
            status: 401,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      if (
        url.origin === 'https://backend.example.com' &&
        url.pathname === '/chemical/reactions/analyze' &&
        authorizationHeader === null
      ) {
        return new Response(
          JSON.stringify({
            valid: true,
            classification: 'combustion',
            score: 98,
            notices: [],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      throw new Error(`Unexpected request to ${url.toString()} (${authorizationHeader ?? 'no-auth'})`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { POST } = await import('@/app/api/chemical/reactions/analyze/route');
    const request = new NextRequest('http://localhost:3000/api/chemical/reactions/analyze', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        input: 'H2 + O2 -> H2O',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.classification).toBe('combustion');
  });
});
