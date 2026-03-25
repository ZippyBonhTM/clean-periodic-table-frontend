import { NextRequest, NextResponse } from 'next/server';

import {
  applyResolvedAuthSessionCookies,
  resolveBearerToken,
  resolveServerAuthSession,
} from '@/shared/auth/serverResolvedAuthSession';
import {
  buildBackendUpstreamUrl,
  resolveBackendUpstreamBaseUrl,
} from '@/shared/backend/backendUpstream';

type ProxyAuthenticatedBackendRequestInput = {
  request: NextRequest;
  upstreamPath: string;
  authMode?: 'required' | 'optional';
  unavailableMessage?: string;
  unresolvedUrlMessage?: string;
  networkFailureMessage?: string;
};

async function proxyAuthenticatedBackendRequest({
  request,
  upstreamPath,
  authMode = 'required',
  unavailableMessage = 'Backend API URL is not configured on the frontend runtime.',
  unresolvedUrlMessage = 'Could not resolve backend URL for this request.',
  networkFailureMessage = 'Failed to reach backend service.',
}: ProxyAuthenticatedBackendRequestInput): Promise<NextResponse> {
  if (resolveBackendUpstreamBaseUrl() === null) {
    return NextResponse.json({ message: unavailableMessage }, { status: 500 });
  }

  const upstreamUrl = buildBackendUpstreamUrl(upstreamPath);

  if (upstreamUrl === null) {
    return NextResponse.json({ message: unresolvedUrlMessage }, { status: 500 });
  }

  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const providedAuthorization = request.headers.get('authorization');
  let authorizationToken = resolveBearerToken(providedAuthorization);
  let resolvedAuthSession:
    | Awaited<ReturnType<typeof resolveServerAuthSession>>
    | null = null;

  if (accept !== null) {
    headers.set('accept', accept);
  }

  if (contentType !== null) {
    headers.set('content-type', contentType);
  }

  if (authorizationToken === null) {
    resolvedAuthSession = await resolveServerAuthSession(request);

    if (resolvedAuthSession.resolution === 'authenticated') {
      authorizationToken = resolvedAuthSession.accessToken;
    } else if (resolvedAuthSession.resolution === 'anonymous') {
      if (authMode !== 'optional') {
        const response = NextResponse.json(
          { message: resolvedAuthSession.message },
          { status: 401 },
        );
        applyResolvedAuthSessionCookies(response, resolvedAuthSession);
        return response;
      }
    } else if (authMode !== 'optional') {
      const response = NextResponse.json(
        { message: resolvedAuthSession.message },
        { status: resolvedAuthSession.statusCode },
      );
      return response;
    } else {
      resolvedAuthSession = null;
    }
  }

  if (authorizationToken !== null) {
    headers.set('authorization', `Bearer ${authorizationToken}`);
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
        : networkFailureMessage;

    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await upstreamResponse.text();
  const response =
    upstreamResponse.status === 204 ||
    upstreamResponse.status === 205 ||
    upstreamResponse.status === 304
      ? new NextResponse(null, { status: upstreamResponse.status })
      : new NextResponse(responseBody, { status: upstreamResponse.status });
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

  if (resolvedAuthSession !== null) {
    applyResolvedAuthSessionCookies(response, resolvedAuthSession);
  }

  return response;
}

export { proxyAuthenticatedBackendRequest };
