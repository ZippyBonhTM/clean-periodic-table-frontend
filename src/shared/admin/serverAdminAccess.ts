import 'server-only';

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import {
  isAdminUserProfile,
  resolveRequestOrigin,
  shouldRequireAdminForArticleStage,
} from '@/shared/admin/adminAccess';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { AuthUserProfile, ProfileResponse, RefreshResponse } from '@/shared/types/auth';

type ServerAuthRequestInput = {
  method?: 'GET' | 'POST';
  token?: string;
};

async function requestServerAuthJson<ResponseType>(
  path: string,
  input: ServerAuthRequestInput = {},
): Promise<ResponseType | null> {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie');

  if (cookieHeader === null || cookieHeader.trim().length === 0) {
    return null;
  }

  const outgoingHeaders = new Headers({
    Accept: 'application/json',
    cookie: cookieHeader,
  });

  if (input.token !== undefined && input.token.trim().length > 0) {
    outgoingHeaders.set('authorization', `Bearer ${input.token}`);
  }

  let response: Response;

  try {
    response = await fetch(new URL(path, resolveRequestOrigin(requestHeaders)), {
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

async function resolveServerUserProfile(): Promise<AuthUserProfile | null> {
  const refreshResponse = await requestServerAuthJson<RefreshResponse>('/api/auth/refresh', {
    method: 'POST',
  });
  const accessToken = refreshResponse?.accessToken?.trim() ?? '';

  if (accessToken.length === 0) {
    return null;
  }

  const profileResponse = await requestServerAuthJson<ProfileResponse>('/api/auth/profile', {
    method: 'GET',
    token: accessToken,
  });

  return profileResponse?.userProfile ?? null;
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
