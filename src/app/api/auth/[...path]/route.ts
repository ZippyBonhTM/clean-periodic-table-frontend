import { NextRequest, NextResponse } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  readServerAccessTokenFromResponseBody,
  resolveTokenMaxAgeSeconds,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';
import {
  buildAuthUpstreamUrl,
  resolveAuthUpstreamBaseUrl,
  stripForwardedAuthCookieHeader,
} from '@/shared/auth/authUpstream';
import {
  appendResponseSetCookieHeaders,
  readResponseSetCookieHeaders,
} from '@/shared/auth/responseSetCookie';

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const ALLOWED_AUTH_PATHS = new Set([
  'login',
  'register',
  'refresh',
  'logout',
  'validate-token',
  'profile',
]);

const ACCESS_TOKEN_RESPONSE_PATHS = new Set([
  'login',
  'register',
  'refresh',
  'profile',
]);

const CLEAR_ACCESS_TOKEN_PATHS = new Set(['logout', 'refresh', 'profile', 'validate-token']);

function syncMirroredAccessTokenCookie(
  response: NextResponse,
  path: string,
  upstreamResponse: Response,
  responseBody: string,
): void {
  if (upstreamResponse.ok && ACCESS_TOKEN_RESPONSE_PATHS.has(path)) {
    const accessToken = readServerAccessTokenFromResponseBody(responseBody);

    if (accessToken !== null) {
      response.cookies.set({
        name: SERVER_ACCESS_TOKEN_COOKIE_KEY,
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: resolveTokenMaxAgeSeconds(accessToken),
      });
    }

    return;
  }

  if (
    CLEAR_ACCESS_TOKEN_PATHS.has(path) &&
    (path === 'logout' || upstreamResponse.status === 401 || upstreamResponse.status === 403)
  ) {
    response.cookies.set({
      name: SERVER_ACCESS_TOKEN_COOKIE_KEY,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set({
      name: CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
      value: '',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}

async function proxyAuthRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const params = await context.params;
  const pathSegments = params.path ?? [];

  if (pathSegments.length !== 1 || !ALLOWED_AUTH_PATHS.has(pathSegments[0])) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const baseUrl = resolveAuthUpstreamBaseUrl();

  if (baseUrl === null) {
    return NextResponse.json(
      { message: 'Auth API URL is not configured on the frontend runtime.' },
      { status: 500 },
    );
  }

  const upstreamUrl = buildAuthUpstreamUrl(pathSegments[0]);

  if (upstreamUrl === null) {
    return NextResponse.json(
      { message: 'Could not resolve auth upstream URL for this request.' },
      { status: 500 },
    );
  }

  const headers = new Headers();

  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  const cookie = stripForwardedAuthCookieHeader(request.headers.get('cookie'));

  if (accept !== null) {
    headers.set('accept', accept);
  }

  if (contentType !== null) {
    headers.set('content-type', contentType);
  }

  if (authorization !== null) {
    headers.set('authorization', authorization);
  }

  if (cookie !== null) {
    headers.set('cookie', cookie);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.text();

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (caughtError: unknown) {
    const message =
      caughtError instanceof Error && caughtError.message.trim().length > 0
        ? caughtError.message
        : 'Failed to reach auth service.';

    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await upstreamResponse.text();
  const upstreamSetCookies = readResponseSetCookieHeaders(upstreamResponse);
  const response = new NextResponse(responseBody, { status: upstreamResponse.status });

  const responseContentType = upstreamResponse.headers.get('content-type');
  const responseCacheControl = upstreamResponse.headers.get('cache-control');
  const responseWwwAuthenticate = upstreamResponse.headers.get('www-authenticate');

  if (responseContentType !== null) {
    response.headers.set('content-type', responseContentType);
  }

  if (responseCacheControl !== null) {
    response.headers.set('cache-control', responseCacheControl);
  }

  if (responseWwwAuthenticate !== null) {
    response.headers.set('www-authenticate', responseWwwAuthenticate);
  }

  syncMirroredAccessTokenCookie(response, pathSegments[0], upstreamResponse, responseBody);
  appendResponseSetCookieHeaders(response, upstreamSetCookies);

  return response;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAuthRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAuthRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAuthRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAuthRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAuthRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAuthRequest(request, context);
}
