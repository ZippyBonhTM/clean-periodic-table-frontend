import 'server-only';

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import {
  isAdminUserProfile,
  shouldRequireAdminForArticleStage,
} from '@/shared/admin/adminAccess';
import {
  shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution,
  type BackendAdminSessionResolution,
} from '@/shared/admin/adminAuthorizationResolution';
import {
  buildAdminUpstreamApiUrl,
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
import type { AuthUserProfile, ProfileResponse } from '@/shared/types/auth';

type ServerAuthRequestInput = {
  method?: 'GET' | 'POST';
  token?: string;
};

type AdminSessionResponse = {
  user?: AuthUserProfile;
  userProfile?: AuthUserProfile;
};

type BackendAdminSessionResult =
  | {
      resolution: 'granted';
      userProfile: AuthUserProfile;
    }
  | {
      resolution: Exclude<BackendAdminSessionResolution, 'granted'>;
      userProfile: null;
    };

type ServerAdminAccessGate =
  | {
      resolution: 'granted';
      userProfile: AuthUserProfile;
    }
  | {
      resolution: 'recoverable';
      userProfile: null;
    };

type ServerArticleStageAccessGate =
  | {
      resolution: 'granted';
      userProfile: AuthUserProfile | null;
    }
  | {
      resolution: 'recoverable';
      userProfile: null;
    };

function hasRefreshTokenCookie(cookieHeader: string | null): boolean {
  if (cookieHeader === null || cookieHeader.trim().length === 0) {
    return false;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith('refreshToken=') && cookie.length > 'refreshToken='.length);
}

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

async function requestServerAdminSession(token: string): Promise<BackendAdminSessionResult> {
  const normalizedToken = token.trim();
  const upstreamUrl = buildAdminUpstreamApiUrl('/api/v1/admin/session');

  if (upstreamUrl === null || normalizedToken.length === 0) {
    return {
      resolution: 'unavailable',
      userProfile: null,
    };
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
    return {
      resolution: 'unavailable',
      userProfile: null,
    };
  }

  if (response.status === 403) {
    return {
      resolution: 'forbidden',
      userProfile: null,
    };
  }

  if (!response.ok) {
    return {
      resolution: 'unavailable',
      userProfile: null,
    };
  }

  const payload = (await response.json().catch(() => null)) as AdminSessionResponse | null;
  const userProfile = payload?.user ?? payload?.userProfile ?? null;

  if (userProfile !== null) {
    return {
      resolution: 'granted',
      userProfile,
    };
  }

  return {
    resolution: 'unavailable',
    userProfile: null,
  };
}

async function hasRecoverableRefreshSession(): Promise<boolean> {
  const requestHeaders = await headers();
  const cookieHeader = stripForwardedAuthCookieHeader(requestHeaders.get('cookie'));

  return hasRefreshTokenCookie(cookieHeader);
}

async function resolveAuthTokensForServerRequests(): Promise<string[]> {
  const requestCookies = await cookies();
  const mirroredAccessToken = requestCookies.get(SERVER_ACCESS_TOKEN_COOKIE_KEY)?.value?.trim() ?? '';
  const clientMirroredAccessToken =
    requestCookies.get(CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY)?.value?.trim() ?? '';
  const candidateTokens: string[] = [];

  for (const candidateToken of [mirroredAccessToken, clientMirroredAccessToken]) {
    if (candidateToken.length > 0 && !candidateTokens.includes(candidateToken)) {
      candidateTokens.push(candidateToken);
    }
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

async function resolveServerUserProfileFromBackend(): Promise<BackendAdminSessionResult> {
  const candidateTokens = await resolveAuthTokensForServerRequests();

  for (const candidateToken of candidateTokens) {
    const adminProfile = await requestServerAdminSession(candidateToken);

    if (adminProfile.resolution === 'granted' || adminProfile.resolution === 'forbidden') {
      return adminProfile;
    }
  }

  return {
    resolution: 'unavailable',
    userProfile: null,
  };
}

async function resolveServerUserProfile(): Promise<AuthUserProfile | null> {
  const authorizationSource = resolveAdminAuthorizationSource();

  if (authorizationSource === 'legacy-auth') {
    return await resolveServerUserProfileFromLegacyAuth();
  }

  if (authorizationSource === 'backend') {
    const backendProfile = await resolveServerUserProfileFromBackend();
    return backendProfile.resolution === 'granted' ? backendProfile.userProfile : null;
  }

  const backendProfile = await resolveServerUserProfileFromBackend();

  if (backendProfile.resolution === 'granted') {
    return backendProfile.userProfile;
  }

  if (
    shouldFallbackToLegacyAdminAuthorizationAfterBackendResolution(
      authorizationSource,
      backendProfile.resolution,
    )
  ) {
    return await resolveServerUserProfileFromLegacyAuth();
  }

  return null;
}

async function resolveServerAdminAccessGate(): Promise<ServerAdminAccessGate | null> {
  const authorizationSource = resolveAdminAuthorizationSource();
  const hasRecoverableSession = await hasRecoverableRefreshSession();

  if (authorizationSource === 'legacy-auth') {
    const legacyProfile = await resolveServerUserProfileFromLegacyAuth();

    if (legacyProfile !== null) {
      return isAdminUserProfile(legacyProfile)
        ? {
            resolution: 'granted',
            userProfile: legacyProfile,
          }
        : null;
    }

    return hasRecoverableSession
      ? {
          resolution: 'recoverable',
          userProfile: null,
        }
      : null;
  }

  const backendProfile = await resolveServerUserProfileFromBackend();

  if (backendProfile.resolution === 'granted') {
    return {
      resolution: 'granted',
      userProfile: backendProfile.userProfile,
    };
  }

  if (backendProfile.resolution === 'forbidden') {
    return null;
  }

  if (authorizationSource === 'backend') {
    return hasRecoverableSession
      ? {
          resolution: 'recoverable',
          userProfile: null,
        }
      : null;
  }

  const legacyProfile = await resolveServerUserProfileFromLegacyAuth();

  if (legacyProfile !== null) {
    return isAdminUserProfile(legacyProfile)
      ? {
          resolution: 'granted',
          userProfile: legacyProfile,
        }
      : null;
  }

  return hasRecoverableSession
    ? {
        resolution: 'recoverable',
        userProfile: null,
      }
    : null;
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

export async function resolveServerArticleStageAccessGate(
  featureStage: ArticleFeatureStage,
): Promise<ServerArticleStageAccessGate | null> {
  if (!shouldRequireAdminForArticleStage(featureStage)) {
    return {
      resolution: 'granted',
      userProfile: null,
    };
  }

  return await resolveServerAdminAccessGate();
}

export { resolveServerAdminAccessGate };
