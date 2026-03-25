import { NextRequest, NextResponse } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
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
import type { AuthUserProfile, ProfileResponse, RefreshResponse } from '@/shared/types/auth';

type UpstreamAuthResponse<ResponseType> = {
  response: Response;
  payload: ResponseType | null;
  setCookies: string[];
};

type UpstreamAuthRequestInput = {
  method?: 'GET' | 'POST';
  token?: string | null;
  cookieHeader?: string | null;
};

type ResolvedServerAuthSession =
  | {
      resolution: 'authenticated';
      accessToken: string;
      userProfile: AuthUserProfile;
      message: string;
      setCookies: string[];
    }
  | {
      resolution: 'anonymous';
      message: string;
      setCookies: string[];
    }
  | {
      resolution: 'error';
      statusCode: number;
      message: string;
      setCookies: string[];
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

function resolveMirroredAccessToken(request: NextRequest): string | null {
  const candidates = [
    request.cookies.get(SERVER_ACCESS_TOKEN_COOKIE_KEY)?.value?.trim() ?? '',
    request.cookies.get(CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY)?.value?.trim() ?? '',
  ];

  for (const candidate of candidates) {
    if (candidate.length > 0) {
      return candidate;
    }
  }

  return null;
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

function applyResolvedAuthSessionCookies(
  response: NextResponse,
  authSession: Extract<ResolvedServerAuthSession, { resolution: 'authenticated' | 'anonymous' }>,
): void {
  if (authSession.resolution === 'authenticated') {
    syncMirroredAccessTokenCookies(response, authSession.accessToken);
  } else {
    clearMirroredAccessTokenCookies(response);
  }

  appendResponseSetCookieHeaders(response, authSession.setCookies);
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
    payload,
    setCookies,
  };
}

async function resolveServerAuthSession(
  request: NextRequest,
): Promise<ResolvedServerAuthSession> {
  if (resolveAuthUpstreamBaseUrl() === null) {
    return {
      resolution: 'error',
      statusCode: 500,
      message: 'Auth API URL is not configured on the frontend runtime.',
      setCookies: [],
    };
  }

  const cookieHeader = stripForwardedAuthCookieHeader(request.headers.get('cookie'));
  const accessToken =
    resolveBearerToken(request.headers.get('authorization')) ?? resolveMirroredAccessToken(request);

  if (accessToken !== null) {
    const profileResponse = await requestAuthUpstream<ProfileResponse>('profile', {
      method: 'GET',
      token: accessToken,
      cookieHeader,
    });

    if (profileResponse === null) {
      return {
        resolution: 'error',
        statusCode: 502,
        message: 'Failed to reach auth service.',
        setCookies: [],
      };
    }

    if (
      profileResponse.response.ok &&
      profileResponse.payload !== null &&
      profileResponse.payload.userProfile !== undefined &&
      typeof profileResponse.payload.accessToken === 'string'
    ) {
      return {
        resolution: 'authenticated',
        accessToken: profileResponse.payload.accessToken,
        userProfile: profileResponse.payload.userProfile,
        message: profileResponse.payload.message,
        setCookies: profileResponse.setCookies,
      };
    }

    if (profileResponse.response.status !== 401 && profileResponse.response.status !== 403) {
      return {
        resolution: 'error',
        statusCode: profileResponse.response.status || 500,
        message:
          profileResponse.payload?.message ??
          'Could not resolve auth session from the current access token.',
        setCookies: profileResponse.setCookies,
      };
    }
  }

  const refreshResponse = await requestAuthUpstream<RefreshResponse>('refresh', {
    method: 'POST',
    cookieHeader,
  });

  if (refreshResponse === null) {
    return {
      resolution: 'error',
      statusCode: 502,
      message: 'Failed to reach auth service.',
      setCookies: [],
    };
  }

  if (refreshResponse.response.status === 401 || refreshResponse.response.status === 403) {
    return {
      resolution: 'anonymous',
      message: refreshResponse.payload?.message ?? 'Not authenticated.',
      setCookies: refreshResponse.setCookies,
    };
  }

  if (
    !refreshResponse.response.ok ||
    refreshResponse.payload === null ||
    typeof refreshResponse.payload.accessToken !== 'string'
  ) {
    return {
      resolution: 'error',
      statusCode: refreshResponse.response.status || 500,
      message:
        refreshResponse.payload?.message ??
        'Could not refresh the current auth session.',
      setCookies: refreshResponse.setCookies,
    };
  }

  const nextAccessToken = refreshResponse.payload.accessToken.trim();

  if (nextAccessToken.length === 0) {
    return {
      resolution: 'error',
      statusCode: 500,
      message: 'Refresh completed without returning a usable access token.',
      setCookies: refreshResponse.setCookies,
    };
  }

  const profileAfterRefresh = await requestAuthUpstream<ProfileResponse>('profile', {
    method: 'GET',
    token: nextAccessToken,
    cookieHeader,
  });

  if (profileAfterRefresh === null) {
    return {
      resolution: 'error',
      statusCode: 502,
      message: 'Failed to reach auth service.',
      setCookies: refreshResponse.setCookies,
    };
  }

  if (
    !profileAfterRefresh.response.ok ||
    profileAfterRefresh.payload === null ||
    profileAfterRefresh.payload.userProfile === undefined
  ) {
    return {
      resolution: 'error',
      statusCode: profileAfterRefresh.response.status || 500,
      message:
        profileAfterRefresh.payload?.message ??
        'Could not resolve the user profile after refreshing the session.',
      setCookies: [...refreshResponse.setCookies, ...profileAfterRefresh.setCookies],
    };
  }

  return {
    resolution: 'authenticated',
    accessToken:
      typeof profileAfterRefresh.payload.accessToken === 'string' &&
      profileAfterRefresh.payload.accessToken.trim().length > 0
        ? profileAfterRefresh.payload.accessToken
        : nextAccessToken,
    userProfile: profileAfterRefresh.payload.userProfile,
    message: profileAfterRefresh.payload.message,
    setCookies: [...refreshResponse.setCookies, ...profileAfterRefresh.setCookies],
  };
}

export {
  applyResolvedAuthSessionCookies,
  clearMirroredAccessTokenCookies,
  resolveBearerToken,
  resolveMirroredAccessToken,
  resolveServerAuthSession,
  syncMirroredAccessTokenCookies,
};
export type { ResolvedServerAuthSession };
