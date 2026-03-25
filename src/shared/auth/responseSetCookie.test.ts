import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';

import { appendResponseSetCookieHeaders } from '@/shared/auth/responseSetCookie';
import { SERVER_ACCESS_TOKEN_COOKIE_KEY } from '@/shared/auth/serverAccessTokenCookie';

describe('responseSetCookie', () => {
  it('preserves upstream refresh cookies when mirrored access cookies are set first', () => {
    const response = new NextResponse('ok');

    response.cookies.set({
      name: SERVER_ACCESS_TOKEN_COOKIE_KEY,
      value: 'access-token',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    appendResponseSetCookieHeaders(response, [
      'refreshToken=refresh-token; Path=/; HttpOnly; Secure; SameSite=None',
    ]);

    const headersWithGetSetCookie = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const cookies = headersWithGetSetCookie.getSetCookie?.() ?? [];

    expect(cookies).toContain(
      `${SERVER_ACCESS_TOKEN_COOKIE_KEY}=access-token; Path=/; Secure; HttpOnly; SameSite=lax`,
    );
    expect(cookies).toContain(
      'refreshToken=refresh-token; Path=/; HttpOnly; Secure; SameSite=None',
    );
  });
});
