import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { AuthUserProfile } from '@/shared/types/auth';

type HeaderReader = Pick<Headers, 'get'>;

function isLocalHost(host: string): boolean {
  const normalizedHost = host.split(':')[0]?.trim().toLowerCase() ?? '';

  if (/^\d+\.\d+\.\d+\.\d+$/.test(normalizedHost)) {
    const [firstOctet = 0, secondOctet = 0] = normalizedHost
      .split('.')
      .map((segment) => Number.parseInt(segment, 10));

    return (
      normalizedHost === '0.0.0.0' ||
      (firstOctet === 127 && secondOctet === 0) ||
      firstOctet === 10 ||
      (firstOctet === 192 && secondOctet === 168) ||
      (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31)
    );
  }

  return (
    normalizedHost === 'localhost' ||
    normalizedHost.endsWith('.local')
  );
}

export function resolveRequestOrigin(headers: HeaderReader): string {
  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const hostHeader = headers.get('host')?.trim();
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = hostHeader?.length ? hostHeader : forwardedHost?.length ? forwardedHost : undefined;

  if (host === undefined || host.length === 0) {
    throw new Error('Could not resolve request host for admin access.');
  }

  const protocol = forwardedProto?.length ? forwardedProto : isLocalHost(host) ? 'http' : 'https';

  return `${protocol}://${host}`;
}

export function isAdminUserProfile(
  userProfile: Pick<AuthUserProfile, 'role'> | null | undefined,
): boolean {
  return userProfile?.role === 'ADMIN';
}

export function shouldRequireAdminForArticleStage(stage: ArticleFeatureStage): boolean {
  return stage === 'internal';
}
