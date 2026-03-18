export type AuthEntryMode = 'modal' | 'route';
export type UserProfileRequestStatus = 'idle' | 'loading' | 'success' | 'error';
export type AppHeaderNavLinkKey =
  | 'periodicTable'
  | 'search'
  | 'balanceEquation'
  | 'molecularEditor'
  | 'moleculeGallery';
export type AppHeaderNavBadgeKey = 'new' | 'beta';

export type AppHeaderNavLink = {
  href: string;
  labelKey: AppHeaderNavLinkKey;
  badgeKey?: AppHeaderNavBadgeKey;
};

export const NAV_LINKS: AppHeaderNavLink[] = [
  { href: '/periodic-table', labelKey: 'periodicTable' },
  { href: '/search', labelKey: 'search' },
  { href: '/balance-equation', labelKey: 'balanceEquation', badgeKey: 'new' },
  { href: '/molecular-editor', labelKey: 'molecularEditor', badgeKey: 'beta' },
  { href: '/molecule-gallery', labelKey: 'moleculeGallery', badgeKey: 'beta' },
];
