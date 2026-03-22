import { NextRequest, NextResponse } from 'next/server';

import {
  buildAuthUpstreamApiUrl,
  resolveAuthUpstreamBaseUrl,
  stripForwardedAuthCookieHeader,
} from '@/shared/auth/authUpstream';

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

function resolveAllowedAdminUpstreamPath(
  pathSegments: string[],
  method: string,
): string | null {
  const [firstSegment, secondSegment, thirdSegment, fourthSegment] = pathSegments;

  if (method === 'GET' && pathSegments.length === 1 && firstSegment === 'users') {
    return '/api/v1/admin/users';
  }

  if (method === 'GET' && pathSegments.length === 2 && firstSegment === 'users') {
    return `/api/v1/admin/users/${encodeURIComponent(secondSegment)}`;
  }

  if (method === 'POST' && pathSegments.length === 3 && firstSegment === 'users' && thirdSegment === 'role') {
    return `/api/v1/admin/users/${encodeURIComponent(secondSegment)}/role`;
  }

  if (method === 'POST' && pathSegments.length === 3 && firstSegment === 'users' && thirdSegment === 'moderation') {
    return `/api/v1/admin/users/${encodeURIComponent(secondSegment)}/moderation`;
  }

  if (
    method === 'POST' &&
    pathSegments.length === 4 &&
    firstSegment === 'users' &&
    thirdSegment === 'sessions' &&
    fourthSegment === 'revoke'
  ) {
    return `/api/v1/admin/users/${encodeURIComponent(secondSegment)}/sessions/revoke`;
  }

  if (method === 'GET' && pathSegments.length === 1 && firstSegment === 'audit') {
    return '/api/v1/admin/audit';
  }

  return null;
}

async function proxyAdminRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const params = await context.params;
  const pathSegments = params.path ?? [];
  const upstreamPath = resolveAllowedAdminUpstreamPath(pathSegments, request.method);

  if (upstreamPath === null) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const baseUrl = resolveAuthUpstreamBaseUrl();

  if (baseUrl === null) {
    return NextResponse.json(
      { message: 'Auth API URL is not configured on the frontend runtime.' },
      { status: 500 },
    );
  }

  const upstreamUrl = buildAuthUpstreamApiUrl(upstreamPath);

  if (upstreamUrl === null) {
    return NextResponse.json(
      { message: 'Could not resolve admin upstream URL for this request.' },
      { status: 500 },
    );
  }

  upstreamUrl.search = request.nextUrl.search;

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
        : 'Failed to reach admin service.';

    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await upstreamResponse.text();
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

  return response;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAdminRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return await proxyAdminRequest(request, context);
}
