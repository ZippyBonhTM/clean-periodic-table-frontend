import LinkButton from '@/components/atoms/LinkButton';
import type { AppHeaderTextCatalog } from '@/components/shared/header/appHeaderText';
import { buildLocalizedAppPath, isLocalizedAppHrefActive } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import AppHeaderNavLinkLabel from './AppHeaderNavLinkLabel';
import { NAV_LINKS } from './appHeader.types';

type AppHeaderDesktopNavProps = {
  locale: AppLocale;
  pathname: string | null;
  text: AppHeaderTextCatalog['navigation'];
};

export default function AppHeaderDesktopNav({
  locale,
  pathname,
  text,
}: AppHeaderDesktopNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2">
      {NAV_LINKS.map((item) => {
        const href = buildLocalizedAppPath(locale, item.href);
        const isActive = isLocalizedAppHrefActive(pathname, item.href);

        return (
          <LinkButton
            key={item.href}
            href={href}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-lg px-2.5 text-[11px]"
          >
            <AppHeaderNavLinkLabel label={text.links[item.labelKey]} />
          </LinkButton>
        );
      })}
    </nav>
  );
}
