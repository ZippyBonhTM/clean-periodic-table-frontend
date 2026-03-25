import { NextRequest, NextResponse } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  resolveTokenMaxAgeSeconds,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';
import { buildAuthUpstreamUrl, resolveAuthUpstreamBaseUrl, stripForwardedAuthCookieHeader } from '@/shared/auth/authUpstream';
import {
  appendResponseSetCookieHeaders,
  readResponseSetCookieHeaders,
} from '@/shared/auth/responseSetCookie';
import type {
  AuthSessionResponse,
  ProfileResponse,
  RefreshResponse,
} from '@/shared/types/auth';

type UpstreamAuthResponse<ResponseType> = {
  response: Response;
  bodyText: string;
  payload: ResponseType | null;
  setCookies: string[];
};

type UpstreamAuthRequestInput = {
  method?: 'GET' | 'POST';
  token?: string | null;
  cookieHeader?: string | null;
};

function resolveBearerToken(authorizationHeader: string | null): string | null {
  if (authorizationHeader === null) {
    return null;
  }

  const normalizedHeader = authorizationHeader.trim();

  if (!normalizedHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = normalizedHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

function syncMirroredAccessTokenCookies(response: NextResponse, accessToken: string): void {
  response.cookies.set({
    name: SERVER_ACCESS_TOKEN_COOKIE_KEY,
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: resolveTokenMaxAgeSeconds(accessToken),
  });
  response.cookies.set({
    name: CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
    value: accessToken,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: resolveTokenMaxAgeSeconds(accessToken),
  });
}

function clearMirroredAccessTokenCookies(response: NextResponse): void {
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

function createUnauthenticatedSessionResponse(
  upstreamSetCookies: string[] = [],
  message: string = 'Not authenticated.',
): NextResponse {
  const response = NextResponse.json(
    {
      authenticated: false,
      accessToken: null,
      userProfile: null,
      message,
    },
    { status: 401 },
  );

  clearMirroredAccessTokenCookies(response);
  appendResponseSetCookieHeaders(response, upstreamSetCookies);
  return response;
}

function createAuthenticatedSessionResponse(
  payload: AuthSessionResponse,
  upstreamSetCookies: string[] = [],
): NextResponse {
  const response = NextResponse.json(payload);
  syncMirroredAccessTokenCookies(response, payload.accessToken);
  appendResponseSetCookieHeaders(response, upstreamSetCookies);
  return response;
}

async function requestAuthUpstream<ResponseType>(
  path: string,
  input: UpstreamAuthRequestInput = {},
): Promise<UpstreamAuthResponse<ResponseType> | null> {
  const upstreamUrl = buildAuthUpstreamUrl(path);

  if (upstreamUrl === null) {
    return null;
  }

  const headers = new Headers({
    Accept: 'application/json',
  });

  const normalizedToken = input.token?.trim() ?? '';
  const normalizedCookieHeader = input.cookieHeader?.trim() ?? '';

  if (normalizedToken.length > 0) {
    headers.set('authorization', `Bearer ${normalizedToken}`);
  }

  if (normalizedCookieHeader.length > 0) {
    headers.set('cookie', normalizedCookieHeader);
  }

  let response: Response;

  try {
    response = await fetch(upstreamUrl, {
      method: input.method ?? 'GET',
      headers,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return null;
  }

  const bodyText = await response.text();
  const setCookies = readResponseSetCookieHeaders(response);
  let payload: ResponseType | null = null;

  if (bodyText.trim().length > 0) {
    try {
      payload = JSON.parse(bodyText) as ResponseType | null;
    } catch {
      payload = null;
    }
  }

  return {
    response,
    bodyText,
    payload,
    setCookies,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (resolveAuthUpstreamBaseUrl() === null) {
    return NextResponse.json(
      { message: 'Auth API URL is not configured on the frontend runtime.' },
      { status: 500 },
    );
  }

  const cookieHeader = stripForwardedAuthCookieHeader(request.headers.get('cookie'));
  const accessToken = resolveBearerToken(request.headers.get('authorization'));

  if (accessToken !== null) {
    const profileResponse = await requestAuthUpstream<ProfileResponse>('profile', {
      method: 'GET',
      token: accessToken,
      cookieHeader,
    });

    if (profileResponse === null) {
      return NextResponse.json({ message: 'Failed to reach auth service.' }, { status: 502 });
    }

    if (
      profileResponse.response.ok &&
      profileResponse.payload !== null &&
      profileResponse.payload.userProfile !== undefined &&
      typeof profileResponse.payload.accessToken === 'string'
    ) {
      return createAuthenticatedSessionResponse({
        authenticated: true,
        accessToken: profileResponse.payload.accessToken,
        userProfile: profileResponse.payload.userProfile,
        message: profileResponse.payload.message,
      }, profileResponse.setCookies);
    }

    if (profileResponse.response.status !== 401 && profileResponse.response.status !== 403) {
      return NextResponse.json(
        {
          message:
            profileResponse.payload?.message ??
            'Could not resolve auth session from the current access token.',
        },
        { status: profileResponse.response.status || 500 },
      );
    }
  }

  const refreshResponse = await requestAuthUpstream<RefreshResponse>('refresh', {
    method: 'POST',
    cookieHeader,
  });

  if (refreshResponse === null) {
    return NextResponse.json({ message: 'Failed to reach auth service.' }, { status: 502 });
  }

  if (refreshResponse.response.status === 401 || refreshResponse.response.status === 403) {
    return createUnauthenticatedSessionResponse(
      refreshResponse.setCookies,
      refreshResponse.payload?.message ?? 'Not authenticated.',
    );
  }

  if (
    !refreshResponse.response.ok ||
    refreshResponse.payload === null ||
    typeof refreshResponse.payload.accessToken !== 'string'
  ) {
    return NextResponse.json(
      {
        message:
          refreshResponse.payload?.message ??
          'Could not refresh the current auth session.',
      },
      { status: refreshResponse.response.status || 500 },
    );
  }

  const nextAccessToken = refreshResponse.payload.accessToken.trim();

  if (nextAccessToken.length === 0) {
    return NextResponse.json(
      { message: 'Refresh completed without returning a usable access token.' },
      { status: 500 },
    );
  }

  const profileAfterRefresh = await requestAuthUpstream<ProfileResponse>('profile', {
    method: 'GET',
    token: nextAccessToken,
    cookieHeader,
  });

  if (profileAfterRefresh === null) {
    return NextResponse.json({ message: 'Failed to reach auth service.' }, { status: 502 });
  }

  if (
    !profileAfterRefresh.response.ok ||
    profileAfterRefresh.payload === null ||
    profileAfterRefresh.payload.userProfile === undefined
  ) {
    return NextResponse.json(
      {
        message:
          profileAfterRefresh.payload?.message ??
          'Could not resolve the user profile after refreshing the session.',
      },
      { status: profileAfterRefresh.response.status || 500 },
    );
  }

  return createAuthenticatedSessionResponse(
    {
      authenticated: true,
      accessToken:
        typeof profileAfterRefresh.payload.accessToken === 'string' &&
        profileAfterRefresh.payload.accessToken.trim().length > 0
          ? profileAfterRefresh.payload.accessToken
          : nextAccessToken,
      userProfile: profileAfterRefresh.payload.userProfile,
      message: profileAfterRefresh.payload.message,
    },
    [...refreshResponse.setCookies, ...profileAfterRefresh.setCookies],
  );
}
