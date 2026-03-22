import {
  buildLocalizedAdminAccessPath,
  buildLocalizedAdminContentPath,
  buildLocalizedAdminPath,
  buildLocalizedAdminUsersPath,
} from '@/shared/admin/adminRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

export const ADMIN_PANEL_SECTION_KEYS = ['overview', 'users', 'access', 'content'] as const;

export type AdminPanelSectionKey = (typeof ADMIN_PANEL_SECTION_KEYS)[number];

export type AdminPanelNavigationItem = {
  key: AdminPanelSectionKey;
  href: string;
};

export function buildAdminPanelNavigation(locale: AppLocale): AdminPanelNavigationItem[] {
  return [
    {
      key: 'overview',
      href: buildLocalizedAdminPath(locale),
    },
    {
      key: 'users',
      href: buildLocalizedAdminUsersPath(locale),
    },
    {
      key: 'access',
      href: buildLocalizedAdminAccessPath(locale),
    },
    {
      key: 'content',
      href: buildLocalizedAdminContentPath(locale),
    },
  ];
}
