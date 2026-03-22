import type { Metadata } from 'next';

import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import type { AdminPanelSectionKey } from '@/shared/admin/adminPanel';
import {
  buildLocalizedAdminAccessPath,
  buildLocalizedAdminAuditPath,
  buildLocalizedAdminContentPath,
  buildLocalizedAdminPath,
  buildLocalizedAdminUsersPath,
} from '@/shared/admin/adminRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

const ADMIN_PATH_BY_SECTION: Record<AdminPanelSectionKey, (locale: AppLocale) => string> = {
  overview: buildLocalizedAdminPath,
  users: buildLocalizedAdminUsersPath,
  audit: buildLocalizedAdminAuditPath,
  access: buildLocalizedAdminAccessPath,
  content: buildLocalizedAdminContentPath,
};

export function buildAdminPageMetadata(
  locale: AppLocale,
  section: AdminPanelSectionKey,
): Metadata {
  const text = getAdminWorkspaceText(locale);
  const sectionText = text.sections[section];
  const canonicalUrl = buildAbsoluteAppUrl(ADMIN_PATH_BY_SECTION[section](locale));

  return {
    title: `${sectionText.title} | Clean Periodic Table`,
    description: sectionText.description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `${sectionText.title} | Clean Periodic Table`,
      description: sectionText.description,
      siteName: 'Clean Periodic Table',
      locale,
      type: 'website',
      url: canonicalUrl,
    },
  };
}
