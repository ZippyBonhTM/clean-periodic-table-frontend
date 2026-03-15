'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type UseAppHeaderMobileMenusParams = {
  isUserMenuOpen: boolean;
  closeUserMenu: () => void;
};

export default function useAppHeaderMobileMenus({
  isUserMenuOpen,
  closeUserMenu,
}: UseAppHeaderMobileMenusParams) {
  const [isRouteMenuOpen, setIsRouteMenuOpen] = useState(false);

  const closeRouteMenu = useCallback(() => {
    setIsRouteMenuOpen(false);
  }, []);

  const closeAllMenus = useCallback(() => {
    closeRouteMenu();
    closeUserMenu();
  }, [closeRouteMenu, closeUserMenu]);

  const hasAnyMobileMenuOpen = useMemo(() => {
    return isRouteMenuOpen || isUserMenuOpen;
  }, [isRouteMenuOpen, isUserMenuOpen]);

  useEffect(() => {
    if (!hasAnyMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasAnyMobileMenuOpen]);

  useEffect(() => {
    if (!hasAnyMobileMenuOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAllMenus();
      }
    };

    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [closeAllMenus, hasAnyMobileMenuOpen]);

  const openRouteMenu = useCallback(() => {
    closeUserMenu();
    setIsRouteMenuOpen(true);
  }, [closeUserMenu]);

  return {
    isRouteMenuOpen,
    closeRouteMenu,
    closeAllMenus,
    openRouteMenu,
  };
}
