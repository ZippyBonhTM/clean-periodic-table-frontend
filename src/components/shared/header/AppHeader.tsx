'use client';

import { usePathname } from 'next/navigation';
import { memo, useCallback } from 'react';

import Button from '@/components/atoms/Button';
import TokenStatus from '@/components/molecules/TokenStatus';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import UserAvatarPlaceholder from '@/components/molecules/UserAvatarPlaceholder';
import useAuthToken from '@/shared/hooks/useAuthToken';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import useAppLocale from '@/shared/i18n/useAppLocale';
import type { AppTheme } from '@/shared/hooks/useTheme';

import AppHeaderAuthActions from './AppHeaderAuthActions';
import AppHeaderDesktopNav from './AppHeaderDesktopNav';
import AppHeaderLocaleSwitcher from './AppHeaderLocaleSwitcher';
import AppHeaderRouteMenu from './AppHeaderRouteMenu';
import AppHeaderUserMenu from './AppHeaderUserMenu';
import type { AuthEntryMode } from './appHeader.types';
import useAppHeaderText from './useAppHeaderText';
import useAppHeaderMobileMenus from './useAppHeaderMobileMenus';
import useAppHeaderUserMenu from './useAppHeaderUserMenu';

type AppHeaderProps = {
  hasToken: boolean;
  authStatus: TokenStatusType;
  theme: AppTheme;
  onToggleTheme: () => void;
  onLogout?: () => void;
  authEntryMode?: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
};

function resolveAuthIndicatorTone(status: TokenStatusType): string {
  if (status === 'authenticated') {
    return 'bg-emerald-400';
  }

  if (status === 'checking') {
    return 'bg-sky-400';
  }

  if (status === 'unverified') {
    return 'bg-amber-400';
  }

  return 'bg-rose-400';
}

function ThemeGlyph({ theme }: { theme: AppTheme }) {
  if (theme === 'dark') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function AppHeader({
  hasToken,
  authStatus,
  theme,
  onToggleTheme,
  onLogout,
  authEntryMode = 'route',
  onRequestLogin,
  onRequestRegister,
}: AppHeaderProps) {
  const pathname = usePathname();
  const { locale } = useAppLocale();
  const text = useAppHeaderText();
  const { token, persistToken } = useAuthToken();
  const loginHref = buildLocalizedAppPath(locale, '/login');
  const registerHref = buildLocalizedAppPath(locale, '/register');

  const themeToggleLabel =
    theme === 'dark' ? text.theme.switchToLight : text.theme.switchToDark;
  const authIndicatorTone = resolveAuthIndicatorTone(authStatus);
  const {
    isUserMenuOpen,
    isLogoutConfirmOpen,
    userProfileStatus,
    userProfile,
    userProfileError,
    userDisplayName,
    userMenuPanelStyle,
    openUserMenu,
    closeUserMenu,
    requestLogoutConfirm,
    cancelLogoutConfirm,
    confirmLogout,
    resetUserMenuDrag,
    onUserMenuHandlePointerDown,
    onUserMenuHandlePointerMove,
    finishUserMenuDrag,
  } = useAppHeaderUserMenu({
    hasToken,
    token,
    onPersistToken: persistToken,
    guestDisplayName: text.userMenu.guest,
    userDisplayNameFallback: text.userMenu.userFallback,
    profileLoadErrorFallback: text.userMenu.profileLoadErrorFallback,
    onLogout,
  });
  const { isRouteMenuOpen, closeRouteMenu, closeAllMenus, openRouteMenu } =
    useAppHeaderMobileMenus({
      isUserMenuOpen,
      closeUserMenu,
    });

  const onOpenUserMenu = useCallback(() => {
    if (isUserMenuOpen) {
      return;
    }

    closeRouteMenu();
    openUserMenu();
  }, [closeRouteMenu, isUserMenuOpen, openUserMenu]);

  const onRequestLoginFromButton = () => {
    closeAllMenus();
    onRequestLogin?.();
  };

  const onRequestRegisterFromButton = () => {
    closeAllMenus();
    onRequestRegister?.();
  };

  return (
    <>
      <header className="hidden rounded-3xl border border-(--border-subtle) p-4 shadow-sm md:block md:p-5 surface-panel">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto] md:items-stretch">
          <div className="min-w-0 md:col-start-1 md:row-start-1">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-[0.22em] text-(--text-muted) sm:text-[10px]">
              {text.brand.eyebrow}
            </p>
            <h1 className="mt-1 whitespace-nowrap text-lg font-extrabold leading-none text-foreground sm:text-xl">
              {text.brand.title}
            </h1>
          </div>

          <div className="flex flex-col gap-2 md:col-start-2 md:row-span-2 md:h-full md:items-end md:justify-between">
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <TokenStatus
                status={authStatus}
              />
              <AppHeaderLocaleSwitcher />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleTheme}
                className="size-8 rounded-full bg-black/20 p-0"
                aria-label={themeToggleLabel}
                title={themeToggleLabel}
              >
                <ThemeGlyph theme={theme} />
              </Button>
              <button
                type="button"
                onClick={onOpenUserMenu}
                className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                aria-label={text.userMenu.open}
                title={text.userMenu.open}
              >
                <span
                  className={`pointer-events-none absolute -right-0.5 -top-0.5 z-10 size-2.5 rounded-full border border-[#020617] ${authIndicatorTone}`}
                  aria-hidden="true"
                />
                <UserAvatarPlaceholder hasToken={hasToken} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
              <AppHeaderAuthActions
                hasToken={hasToken}
                authEntryMode={authEntryMode}
                loginHref={loginHref}
                registerHref={registerHref}
                text={text.auth}
                onRequestLogin={onRequestLogin}
                onRequestRegister={onRequestRegister}
              />
            </div>
          </div>

          <AppHeaderDesktopNav
            locale={locale}
            pathname={pathname}
            text={text.navigation}
          />
        </div>
      </header>

      <div className="md:hidden">
        <p className="mb-2 text-center text-[9px] uppercase tracking-[0.24em] text-(--text-muted)">
          {text.brand.eyebrow}
        </p>
        <header className="surface-panel rounded-3xl border border-(--border-subtle) p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openRouteMenu}
              className="size-9 rounded-xl px-0"
              aria-label={text.navigation.openMenu}
              title={text.navigation.openMenu}
            >
              <span className="inline-flex flex-col items-center justify-center gap-0.5" aria-hidden="true">
                <span className="h-0.5 w-4 rounded-full bg-foreground" />
                <span className="h-0.5 w-4 rounded-full bg-foreground" />
                <span className="h-0.5 w-4 rounded-full bg-foreground" />
              </span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleTheme}
                className="size-8 rounded-full bg-black/20 p-0"
                aria-label={themeToggleLabel}
                title={themeToggleLabel}
              >
                <ThemeGlyph theme={theme} />
              </Button>

              <button
                type="button"
                onClick={onOpenUserMenu}
                className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                aria-label={text.userMenu.open}
                title={text.userMenu.open}
              >
                <span
                  className={`pointer-events-none absolute -right-0.5 -top-0.5 z-10 size-2.5 rounded-full border border-[#020617] ${authIndicatorTone}`}
                  aria-hidden="true"
                />
                <UserAvatarPlaceholder hasToken={hasToken} />
              </button>

              <AppHeaderAuthActions
                hasToken={hasToken}
                authEntryMode={authEntryMode}
                loginHref={loginHref}
                registerHref={registerHref}
                text={text.auth}
                onRequestLogin={onRequestLoginFromButton}
                onRequestRegister={onRequestRegisterFromButton}
              />
            </div>
          </div>

          <div className="mt-3">
            <AppHeaderLocaleSwitcher mobile />
          </div>
        </header>
      </div>

      <AppHeaderRouteMenu
        isOpen={isRouteMenuOpen}
        locale={locale}
        pathname={pathname}
        text={text.navigation}
        onClose={closeRouteMenu}
      />

      <AppHeaderUserMenu
        isOpen={isUserMenuOpen}
        hasToken={hasToken}
        userDisplayName={userDisplayName}
        userProfileStatus={userProfileStatus}
        userProfile={userProfile}
        userProfileError={userProfileError}
        isLogoutConfirmOpen={isLogoutConfirmOpen}
        userMenuPanelStyle={userMenuPanelStyle}
        text={text.userMenu}
        profileText={text.profile}
        onClose={closeUserMenu}
        onRequestLogoutConfirm={requestLogoutConfirm}
        onCancelLogoutConfirm={cancelLogoutConfirm}
        onConfirmLogout={confirmLogout}
        onHandlePointerDown={onUserMenuHandlePointerDown}
        onHandlePointerMove={onUserMenuHandlePointerMove}
        onHandlePointerUp={(event) => finishUserMenuDrag(event)}
        onHandlePointerCancel={(event) => finishUserMenuDrag(event)}
        onHandleLostPointerCapture={resetUserMenuDrag}
      />
    </>
  );
}

export default memo(AppHeader);
export type { AuthEntryMode };
