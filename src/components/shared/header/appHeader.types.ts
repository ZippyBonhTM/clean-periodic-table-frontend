export type AuthEntryMode = 'modal' | 'route';
export type UserProfileRequestStatus = 'idle' | 'loading' | 'success' | 'error';

export type AppHeaderNavLink = {
  href: string;
  label: string;
  badge?: string;
};

export const NAV_LINKS: AppHeaderNavLink[] = [
  { href: '/periodic-table', label: 'Periodic Table' },
  { href: '/search', label: 'Search' },
  { href: '/balance-equation', label: 'Balance Equation', badge: 'NEW' },
  { href: '/molecular-editor', label: 'Molecular Editor', badge: 'BETA' },
  { href: '/molecule-gallery', label: 'Molecule Gallery', badge: 'BETA' },
];
