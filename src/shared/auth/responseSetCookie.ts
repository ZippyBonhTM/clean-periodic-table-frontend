import { NextResponse } from 'next/server';

function readResponseSetCookieHeaders(upstreamResponse: Response): string[] {
  const headersWithGetSetCookie = upstreamResponse.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const cookies = headersWithGetSetCookie.getSetCookie?.() ?? [];

  if (cookies.length > 0) {
    return cookies;
  }

  const fallbackCookie = upstreamResponse.headers.get('set-cookie');

  return fallbackCookie === null ? [] : [fallbackCookie];
}

function appendResponseSetCookieHeaders(response: NextResponse, cookies: string[]): void {
  for (const cookie of cookies) {
    response.headers.append('set-cookie', cookie);
  }
}

export { appendResponseSetCookieHeaders, readResponseSetCookieHeaders };
