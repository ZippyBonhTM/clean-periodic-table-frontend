import { APP_LOCALE_SEGMENT_BY_LOCALE } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ADMIN_PANEL_PATHNAME = '/admin';
const ADMIN_USERS_PATHNAME = '/admin/users';
const ADMIN_ACCESS_PATHNAME = '/admin/access';
const ADMIN_CONTENT_PATHNAME = '/admin/content';

export function buildLocalizedAdminPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_PANEL_PATHNAME}`;
}

export function buildLocalizedAdminUsersPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_USERS_PATHNAME}`;
}

export function buildLocalizedAdminAccessPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_ACCESS_PATHNAME}`;
}

export function buildLocalizedAdminContentPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_CONTENT_PATHNAME}`;
}

export {
  ADMIN_ACCESS_PATHNAME,
  ADMIN_CONTENT_PATHNAME,
  ADMIN_PANEL_PATHNAME,
  ADMIN_USERS_PATHNAME,
};
