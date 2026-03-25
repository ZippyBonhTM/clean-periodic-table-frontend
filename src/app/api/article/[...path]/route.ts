import { NextRequest, NextResponse } from 'next/server';

import {
  buildBackendUpstreamUrl,
  resolveBackendUpstreamBaseUrl,
} from '@/shared/backend/backendUpstream';
import {
  applyResolvedAuthSessionCookies,
  resolveBearerToken,
  resolveServerAuthSession,
} from '@/shared/auth/serverResolvedAuthSession';
import {
  buildArticleUpstreamApiUrl,
  resolveArticleUpstreamBaseUrl,
} from '@/shared/article/articleUpstream';

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

type ArticleProxyAuthMode = 'public' | 'optional' | 'required';
type ArticleProxyUpstream = 'article' | 'backend';

type ResolvedArticleProxyTarget = {
  upstreamPath: string;
  authMode: ArticleProxyAuthMode;
  upstream: ArticleProxyUpstream;
};

function resolveAllowedArticleUpstreamPath(
  pathSegments: string[],
  method: string,
): ResolvedArticleProxyTarget | null {
  const [firstSegment, secondSegment, thirdSegment] = pathSegments;

  if (method === 'GET' && pathSegments.length === 1 && firstSegment === 'feed') {
    return {
      upstreamPath: '/api/v1/feed',
      authMode: 'public',
      upstream: 'backend',
    };
  }

  if (
    method === 'GET' &&
    pathSegments.length === 3 &&
    firstSegment === 'feed' &&
    secondSegment === 'hashtag'
  ) {
    return {
      upstreamPath: `/api/v1/feed/hashtag/${encodeURIComponent(thirdSegment)}`,
      authMode: 'public',
      upstream: 'backend',
    };
  }

  if (method === 'GET' && pathSegments.length === 1 && firstSegment === 'search') {
    return {
      upstreamPath: '/api/v1/search',
      authMode: 'public',
      upstream: 'backend',
    };
  }

  if (method === 'GET' && pathSegments.length === 1 && firstSegment === 'hashtags') {
    return {
      upstreamPath: '/api/v1/hashtags',
      authMode: 'public',
      upstream: 'backend',
    };
  }

  if (
    method === 'GET' &&
    pathSegments.length === 3 &&
    firstSegment === 'articles' &&
    secondSegment === 'by-slug'
  ) {
    return {
      upstreamPath: `/api/v1/articles/by-slug/${encodeURIComponent(thirdSegment)}`,
      authMode: 'optional',
      upstream: 'backend',
    };
  }

  if (method === 'POST' && pathSegments.length === 1 && firstSegment === 'articles') {
    return {
      upstreamPath: '/api/v1/articles',
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (method === 'GET' && pathSegments.length === 2 && firstSegment === 'articles') {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}`,
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (method === 'PUT' && pathSegments.length === 2 && firstSegment === 'articles') {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}`,
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (method === 'DELETE' && pathSegments.length === 2 && firstSegment === 'articles') {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}`,
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (
    method === 'POST' &&
    pathSegments.length === 3 &&
    firstSegment === 'articles' &&
    thirdSegment === 'publish'
  ) {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}/publish`,
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (
    method === 'POST' &&
    pathSegments.length === 3 &&
    firstSegment === 'articles' &&
    thirdSegment === 'unpublish'
  ) {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}/unpublish`,
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (
    method === 'POST' &&
    pathSegments.length === 3 &&
    firstSegment === 'articles' &&
    thirdSegment === 'view'
  ) {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}/view`,
      authMode: 'optional',
      upstream: 'article',
    };
  }

  if (
    method === 'POST' &&
    pathSegments.length === 3 &&
    firstSegment === 'articles' &&
    thirdSegment === 'open'
  ) {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}/open`,
      authMode: 'optional',
      upstream: 'article',
    };
  }

  if (
    method === 'POST' &&
    pathSegments.length === 3 &&
    firstSegment === 'articles' &&
    thirdSegment === 'save'
  ) {
    return {
      upstreamPath: `/api/v1/articles/${encodeURIComponent(secondSegment)}/save`,
      authMode: 'required',
      upstream: 'backend',
    };
  }

  if (
    method === 'GET' &&
    pathSegments.length === 2 &&
    firstSegment === 'me' &&
    secondSegment === 'articles'
  ) {
    return {
      upstreamPath: '/api/v1/me/articles',
      authMode: 'required',
      upstream: 'backend',
    };
  }

  if (
    method === 'GET' &&
    pathSegments.length === 3 &&
    firstSegment === 'me' &&
    secondSegment === 'articles' &&
    thirdSegment === 'saved'
  ) {
    return {
      upstreamPath: '/api/v1/me/articles/saved',
      authMode: 'required',
      upstream: 'backend',
    };
  }

  if (method === 'POST' && pathSegments.length === 1 && firstSegment === 'uploads') {
    return {
      upstreamPath: '/api/v1/uploads',
      authMode: 'required',
      upstream: 'article',
    };
  }

  if (
    method === 'POST' &&
    pathSegments.length === 2 &&
    firstSegment === 'uploads' &&
    secondSegment === 'confirm'
  ) {
    return {
      upstreamPath: '/api/v1/uploads/confirm',
      authMode: 'required',
      upstream: 'article',
    };
  }

  return null;
}

function resolveArticleTargetBaseUrl(target: ResolvedArticleProxyTarget): string | null {
  return target.upstream === 'backend'
    ? resolveBackendUpstreamBaseUrl()
    : resolveArticleUpstreamBaseUrl();
}

function buildArticleTargetUrl(target: ResolvedArticleProxyTarget): URL | null {
  return target.upstream === 'backend'
    ? buildBackendUpstreamUrl(target.upstreamPath)
    : buildArticleUpstreamApiUrl(target.upstreamPath);
}

async function proxyArticleRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const params = await context.params;
  const pathSegments = params.path ?? [];
  const resolvedTarget = resolveAllowedArticleUpstreamPath(pathSegments, request.method);

  if (resolvedTarget === null) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (resolveArticleTargetBaseUrl(resolvedTarget) === null) {
    return NextResponse.json(
      { message: 'Article upstream URL is not configured on the frontend runtime.' },
      { status: 500 },
    );
  }

  const upstreamUrl = buildArticleTargetUrl(resolvedTarget);

  if (upstreamUrl === null) {
    return NextResponse.json(
      { message: 'Could not resolve article URL for this request.' },
      { status: 500 },
    );
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

  if (authorizationToken === null && resolvedTarget.authMode !== 'public') {
    resolvedAuthSession = await resolveServerAuthSession(request);

    if (resolvedAuthSession.resolution === 'authenticated') {
      authorizationToken = resolvedAuthSession.accessToken;
    } else if (resolvedAuthSession.resolution === 'anonymous') {
      if (resolvedTarget.authMode === 'required') {
        const response = NextResponse.json(
          { message: resolvedAuthSession.message },
          { status: 401 },
        );
        applyResolvedAuthSessionCookies(response, resolvedAuthSession);
        return response;
      }
    } else if (resolvedTarget.authMode === 'required') {
      return NextResponse.json(
        { message: resolvedAuthSession.message },
        { status: resolvedAuthSession.statusCode },
      );
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
        : 'Failed to reach article service.';

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

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return await proxyArticleRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return await proxyArticleRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return await proxyArticleRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return await proxyArticleRequest(request, context);
}
