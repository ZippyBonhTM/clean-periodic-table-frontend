import LinkButton from '@/components/atoms/LinkButton';

import AppHeaderNavLinkLabel from './AppHeaderNavLinkLabel';
import { NAV_LINKS } from './appHeader.types';

type AppHeaderDesktopNavProps = {
  pathname: string | null;
  balanceEquationHref: string;
  isBalanceEquationActive: boolean;
};

export default function AppHeaderDesktopNav({
  pathname,
  balanceEquationHref,
  isBalanceEquationActive,
}: AppHeaderDesktopNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2">
      {NAV_LINKS.map((item) => {
        const href = item.href === '/balance-equation' ? balanceEquationHref : item.href;
        const isActive =
          item.href === '/balance-equation'
            ? isBalanceEquationActive
            : pathname === item.href || (pathname === '/' && item.href === '/search');

        return (
          <LinkButton
            key={item.href}
            href={href}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-lg px-2.5 text-[11px]"
          >
            <AppHeaderNavLinkLabel label={item.label} badge={item.badge} />
          </LinkButton>
        );
      })}
    </nav>
  );
}
