export type AuthEntryMode = 'modal' | 'route';
export type UserProfileRequestStatus = 'idle' | 'loading' | 'success' | 'error';
export type AppHeaderNavLinkKey =
  | 'periodicTable'
  | 'search'
  | 'balanceEquation'
  | 'molecularEditor'
  | 'moleculeGallery';

export type AppHeaderNavLink = {
  href: string;
  labelKey: AppHeaderNavLinkKey;
};

export const NAV_LINKS: AppHeaderNavLink[] = [
  { href: '/periodic-table', labelKey: 'periodicTable' },
  { href: '/search', labelKey: 'search' },
  { href: '/balance-equation', labelKey: 'balanceEquation' },
  { href: '/molecular-editor', labelKey: 'molecularEditor' },
  { href: '/molecule-gallery', labelKey: 'moleculeGallery' },
];
