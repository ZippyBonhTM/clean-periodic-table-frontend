import 'server-only';

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import {
  isAdminUserProfile,
  shouldRequireAdminForArticleStage,
} from '@/shared/admin/adminAccess';
import {
  buildAdminUpstreamApiUrl,
  canFallbackToLegacyAdminAuthorization,
  resolveAdminAuthorizationSource,
} from '@/shared/admin/adminUpstream';
import {
  buildAuthUpstreamUrl,
  stripForwardedAuthCookieHeader,
} from '@/shared/auth/authUpstream';
import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { AuthUserProfile, ProfileResponse, RefreshResponse } from '@/shared/types/auth';

type ServerAuthRequestInput = {
  method?: 'GET' | 'POST';
  token?: string;
};

type AdminSessionResponse = {
  user?: AuthUserProfile;
  userProfile?: AuthUserProfile;
};

async function requestServerAuthJson<ResponseType>(
  path: string,
  input: ServerAuthRequestInput = {},
): Promise<ResponseType | null> {
  const requestHeaders = await headers();
  const cookieHeader = stripForwardedAuthCookieHeader(requestHeaders.get('cookie'));
  const normalizedToken = input.token?.trim() ?? '';
  const upstreamUrl = buildAuthUpstreamUrl(path);

  if (
    upstreamUrl === null ||
    ((cookieHeader === null || cookieHeader.trim().length === 0) && normalizedToken.length === 0)
  ) {
    return null;
  }

  const outgoingHeaders = new Headers({
    Accept: 'application/json',
  });

  if (cookieHeader !== null && cookieHeader.trim().length > 0) {
    outgoingHeaders.set('cookie', cookieHeader);
  }

  if (normalizedToken.length > 0) {
    outgoingHeaders.set('authorization', `Bearer ${normalizedToken}`);
  }

  let response: Response;

  try {
    response = await fetch(upstreamUrl, {
      method: input.method ?? 'GET',
      headers: outgoingHeaders,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as ResponseType | null;
}

async function requestServerAdminSession(token: string): Promise<AuthUserProfile | null> {
  const normalizedToken = token.trim();
  const upstreamUrl = buildAdminUpstreamApiUrl('/api/v1/admin/session');

  if (upstreamUrl === null || normalizedToken.length === 0) {
    return null;
  }

  let response: Response;

  try {
    response = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${normalizedToken}`,
      },
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as AdminSessionResponse | null;

  if (payload?.user !== undefined) {
    return payload.user;
  }

  return payload?.userProfile ?? null;
}

async function resolveAuthTokensForServerRequests(): Promise<string[]> {
  const requestCookies = await cookies();
  const mirroredAccessToken = requestCookies.get(SERVER_ACCESS_TOKEN_COOKIE_KEY)?.value?.trim() ?? '';
  const clientMirroredAccessToken =
    requestCookies.get(CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY)?.value?.trim() ?? '';
  const candidateTokens: string[] = [];

  for (const candidateToken of [mirroredAccessToken, clientMirroredAccessToken]) {
    if (candidateToken.length > 0) {
      candidateTokens.push(candidateToken);
    }
  }

  const refreshResponse = await requestServerAuthJson<RefreshResponse>('/api/auth/refresh', {
    method: 'POST',
  });
  const accessToken = refreshResponse?.accessToken?.trim() ?? '';

  if (accessToken.length > 0) {
    candidateTokens.push(accessToken);
  }

  return candidateTokens;
}

async function resolveServerUserProfileFromLegacyAuth(): Promise<AuthUserProfile | null> {
  const candidateTokens = await resolveAuthTokensForServerRequests();

  for (const candidateToken of candidateTokens) {
    const profileFromToken = await requestServerAuthJson<ProfileResponse>('/api/auth/profile', {
      method: 'GET',
      token: candidateToken,
    });

    if (profileFromToken?.userProfile !== undefined) {
      return profileFromToken.userProfile;
    }
  }

  return null;
}

async function resolveServerUserProfileFromBackend(): Promise<AuthUserProfile | null> {
  const candidateTokens = await resolveAuthTokensForServerRequests();

  for (const candidateToken of candidateTokens) {
    const adminProfile = await requestServerAdminSession(candidateToken);

    if (adminProfile !== null) {
      return adminProfile;
    }
  }

  return null;
}

async function resolveServerUserProfile(): Promise<AuthUserProfile | null> {
  const authorizationSource = resolveAdminAuthorizationSource();

  if (authorizationSource === 'legacy-auth') {
    return await resolveServerUserProfileFromLegacyAuth();
  }

  if (authorizationSource === 'backend') {
    return await resolveServerUserProfileFromBackend();
  }

  const backendProfile = await resolveServerUserProfileFromBackend();

  if (backendProfile !== null) {
    return backendProfile;
  }

  if (canFallbackToLegacyAdminAuthorization()) {
    return await resolveServerUserProfileFromLegacyAuth();
  }

  return null;
}

export async function requireServerAdminAccess(): Promise<AuthUserProfile> {
  const userProfile = await resolveServerUserProfile();

  if (userProfile === null || !isAdminUserProfile(userProfile)) {
    notFound();
  }

  return userProfile;
}

export async function requireAdminForInternalArticleStage(
  featureStage: ArticleFeatureStage,
): Promise<void> {
  if (!shouldRequireAdminForArticleStage(featureStage)) {
    return;
  }

  await requireServerAdminAccess();
}
