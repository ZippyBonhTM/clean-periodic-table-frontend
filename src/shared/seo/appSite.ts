import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const DEFAULT_PRODUCTION_SITE_ORIGIN = 'https://clean-periodic-table.vercel.app';
const DEFAULT_LOCAL_SITE_ORIGIN = 'http://localhost:3000';

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).origin;
}

function resolveConfiguredSiteOrigin(): string {
  const configuredOriginCandidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) =>
      value.includes('://') ? value : `https://${value}`,
    );

  if (configuredOriginCandidates.length > 0) {
    return normalizeOrigin(configuredOriginCandidates[0]);
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_LOCAL_SITE_ORIGIN;
  }

  return DEFAULT_PRODUCTION_SITE_ORIGIN;
}

export function getAppSiteUrl(): URL {
  return new URL(resolveConfiguredSiteOrigin());
}

export function buildAbsoluteAppUrl(pathname: string): string {
  return new URL(pathname, getAppSiteUrl()).toString();
}

export function buildLocalizedAbsoluteAppUrl(locale: AppLocale, pathname: string): string {
  return buildAbsoluteAppUrl(buildLocalizedAppPath(locale, pathname));
}
