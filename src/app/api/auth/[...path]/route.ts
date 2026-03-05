import { NextRequest, NextResponse } from 'next/server';

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

function resolveAuthUpstreamBaseUrl(): string | null {
  const rawBaseUrl = process.env.AUTH_API_URL ?? process.env.NEXT_PUBLIC_AUTH_API_URL ?? '';
  const trimmed = rawBaseUrl.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedPath =
      parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

function copySetCookieHeaders(upstreamResponse: Response, response: NextResponse): void {
  const headersWithGetSetCookie = upstreamResponse.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const cookies = headersWithGetSetCookie.getSetCookie?.() ?? [];

  if (cookies.length > 0) {
    for (const cookie of cookies) {
      response.headers.append('set-cookie', cookie);
    }

    return;
  }

  const fallbackCookie = upstreamResponse.headers.get('set-cookie');

  if (fallbackCookie) {
    response.headers.append('set-cookie', fallbackCookie);
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

  const upstreamUrl = new URL(pathSegments[0], `${baseUrl}/`);
  const headers = new Headers();

  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');

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

  copySetCookieHeaders(upstreamResponse, response);

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
