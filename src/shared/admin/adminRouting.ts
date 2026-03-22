import { APP_LOCALE_SEGMENT_BY_LOCALE } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ADMIN_PANEL_PATHNAME = '/admin';
const ADMIN_USERS_PATHNAME = '/admin/users';

export function buildLocalizedAdminPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_PANEL_PATHNAME}`;
}

export function buildLocalizedAdminUsersPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ADMIN_USERS_PATHNAME}`;
}

export { ADMIN_PANEL_PATHNAME, ADMIN_USERS_PATHNAME };
