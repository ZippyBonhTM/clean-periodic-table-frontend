import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import type { AppHeaderTextCatalog } from '@/components/shared/header/appHeaderText';
import { buildLocalizedAppPath, isLocalizedAppHrefActive } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import AppHeaderNavLinkLabel from './AppHeaderNavLinkLabel';
import { NAV_LINKS } from './appHeader.types';

type AppHeaderRouteMenuProps = {
  isOpen: boolean;
  locale: AppLocale;
  pathname: string | null;
  documentNavigation?: boolean;
  text: AppHeaderTextCatalog['navigation'];
  onClose: () => void;
};

export default function AppHeaderRouteMenu({
  isOpen,
  locale,
  pathname,
  documentNavigation = false,
  text,
  onClose,
}: AppHeaderRouteMenuProps) {
  return (
    <div
      className={`fixed inset-0 z-150 transition-opacity duration-300 md:hidden ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
        aria-label={text.closeMenuBackdrop}
      />

      <aside
        className={`absolute left-0 top-0 h-full w-[min(84vw,320px)] border-r border-(--border-subtle) bg-(--surface-1)/92 p-4 shadow-2xl backdrop-blur-sm transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={text.dialogLabel}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
            {text.menuTitle}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={onClose}
            aria-label={text.closeMenu}
          >
            {text.closeMenu}
          </Button>
        </div>

        <nav className="mt-3 flex flex-col gap-2">
          {NAV_LINKS.map((item) => {
            const href = buildLocalizedAppPath(locale, item.href);
            const isActive = isLocalizedAppHrefActive(pathname, item.href);

            return (
              <LinkButton
                key={`mobile-${item.href}`}
                href={href}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                align="left"
                documentNavigation={documentNavigation}
                className="px-3 text-[11px]"
              >
                <AppHeaderNavLinkLabel label={text.links[item.labelKey]} />
              </LinkButton>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
