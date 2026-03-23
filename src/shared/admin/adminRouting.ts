import { APP_LOCALE_SEGMENT_BY_LOCALE } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import { buildAdminAuditSearchParams } from '@/shared/admin/adminAuditFilters';
import { buildAdminUsersSearchParams } from '@/shared/admin/adminUsersFilters';

const ADMIN_PANEL_PATHNAME = '/admin';
const ADMIN_USERS_PATHNAME = '/admin/users';
const ADMIN_AUDIT_PATHNAME = '/admin/audit';
const ADMIN_ACCESS_PATHNAME = '/admin/access';
const ADMIN_CONTENT_PATHNAME = '/admin/content';

export function buildLocalizedAdminPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_PANEL_PATHNAME}`;
}

export function buildLocalizedAdminUsersPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_USERS_PATHNAME}`;
}

export function buildLocalizedAdminUserDetailPath(locale: AppLocale, userId: string): string {
  return `${buildLocalizedAdminUsersPath(locale)}/${encodeURIComponent(userId)}`;
}

export function buildLocalizedAdminUsersBrowsePath(
  locale: AppLocale,
  input: {
    role?: 'all' | 'USER' | 'ADMIN' | null;
    version?: 'all' | 'legacy' | 'product-v1' | null;
    status?: 'all' | 'active' | 'restricted' | 'suspended' | null;
    sort?: 'created-desc' | 'created-asc' | 'last-seen-desc' | 'last-seen-asc' | null;
    query?: string | null;
    cursor?: string | null;
  } = {},
): string {
  const basePath = buildLocalizedAdminUsersPath(locale);
  const searchParams = buildAdminUsersSearchParams(input);
  const search = searchParams.toString();

  return search.length > 0 ? `${basePath}?${search}` : basePath;
}

export function buildLocalizedAdminAccessPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_ACCESS_PATHNAME}`;
}

export function buildLocalizedAdminAuditPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_AUDIT_PATHNAME}`;
}

export function buildLocalizedAdminAuditBrowsePath(
  locale: AppLocale,
  input: {
    action?: 'all' | 'role_change' | 'moderation' | 'session_revoke' | 'directory_sync' | 'access_check' | null;
    query?: string | null;
    cursor?: string | null;
  } = {},
): string {
  const basePath = buildLocalizedAdminAuditPath(locale);
  const searchParams = buildAdminAuditSearchParams(input);
  const search = searchParams.toString();

  return search.length > 0 ? `${basePath}?${search}` : basePath;
}

export function buildLocalizedAdminContentPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_CONTENT_PATHNAME}`;
}

export {
  ADMIN_ACCESS_PATHNAME,
  ADMIN_AUDIT_PATHNAME,
  ADMIN_CONTENT_PATHNAME,
  ADMIN_PANEL_PATHNAME,
  ADMIN_USERS_PATHNAME,
};
