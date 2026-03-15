'use client';

import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import TokenStatus from '@/components/molecules/TokenStatus';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import UserAvatarPlaceholder from '@/components/molecules/UserAvatarPlaceholder';
import { fetchProfile } from '@/shared/api/authApi';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppTheme } from '@/shared/hooks/useTheme';
import { readJwtDisplayName } from '@/shared/utils/jwt';
import type { AuthUserProfile } from '@/shared/types/auth';

import AppHeaderAuthActions from './AppHeaderAuthActions';
import AppHeaderDesktopNav from './AppHeaderDesktopNav';
import AppHeaderRouteMenu from './AppHeaderRouteMenu';
import AppHeaderUserMenu from './AppHeaderUserMenu';
import type { AuthEntryMode, UserProfileRequestStatus } from './appHeader.types';

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

const USER_MENU_DRAG_CLOSE_THRESHOLD = 70;

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
  const { token, persistToken } = useAuthToken();
  const [isRouteMenuOpen, setIsRouteMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [userMenuDragOffset, setUserMenuDragOffset] = useState(0);
  const [userProfileStatus, setUserProfileStatus] = useState<UserProfileRequestStatus>('idle');
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [userProfileError, setUserProfileError] = useState<string | null>(null);
  const userMenuDragPointerIdRef = useRef<number | null>(null);
  const userMenuDragStartXRef = useRef<number | null>(null);
  const userMenuDragOffsetRef = useRef(0);
  const fetchedProfileTokenRef = useRef<string | null>(null);

  const themeToggleLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  const authIndicatorTone = resolveAuthIndicatorTone(authStatus);

  const userDisplayName = useMemo(() => {
    if (!hasToken || token === null) {
      return 'Guest';
    }

    if (userProfile?.name.trim().length) {
      return userProfile.name;
    }

    return readJwtDisplayName(token) ?? 'User';
  }, [hasToken, token, userProfile?.name]);

  const resetUserMenuDrag = useCallback(() => {
    userMenuDragOffsetRef.current = 0;
    userMenuDragStartXRef.current = null;
    userMenuDragPointerIdRef.current = null;
    setUserMenuDragOffset(0);
  }, []);

  const closeRouteMenu = useCallback(() => {
    setIsRouteMenuOpen(false);
  }, []);

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsLogoutConfirmOpen(false);
    resetUserMenuDrag();
  }, [resetUserMenuDrag]);

  const closeAllMenus = useCallback(() => {
    closeRouteMenu();
    closeUserMenu();
  }, [closeRouteMenu, closeUserMenu]);

  const hasAnyMobileMenuOpen = isRouteMenuOpen || isUserMenuOpen;

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

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    if (!hasToken || token === null) {
      return;
    }

    if (fetchedProfileTokenRef.current === token) {
      return;
    }

    fetchedProfileTokenRef.current = token;
    let isCancelled = false;

    void fetchProfile(token)
      .then((profileResponse) => {
        if (isCancelled) {
          return;
        }

        const nextAccessToken = profileResponse.accessToken.trim();

        if (nextAccessToken.length > 0) {
          fetchedProfileTokenRef.current = nextAccessToken;

          if (nextAccessToken !== token) {
            persistToken(nextAccessToken);
          }
        }

        setUserProfile(profileResponse.userProfile);
        setUserProfileStatus('success');
      })
      .catch((caughtError: unknown) => {
        if (isCancelled) {
          return;
        }

        fetchedProfileTokenRef.current = null;
        setUserProfile(null);
        setUserProfileStatus('error');

        if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
          setUserProfileError(caughtError.message);
          return;
        }

        setUserProfileError('Could not load user profile right now.');
      });

    return () => {
      isCancelled = true;
    };
  }, [hasToken, isUserMenuOpen, persistToken, token]);

  const onOpenRouteMenu = () => {
    setIsUserMenuOpen(false);
    setIsRouteMenuOpen(true);
  };

  const onOpenUserMenu = useCallback(() => {
    if (isUserMenuOpen) {
      return;
    }

    setIsRouteMenuOpen(false);
    resetUserMenuDrag();
    setUserProfileStatus('loading');
    setUserProfileError(null);
    setIsLogoutConfirmOpen(false);
    setIsUserMenuOpen(true);
  }, [isUserMenuOpen, resetUserMenuDrag]);

  const onRequestLoginFromButton = () => {
    closeAllMenus();
    onRequestLogin?.();
  };

  const onRequestRegisterFromButton = () => {
    closeAllMenus();
    onRequestRegister?.();
  };

  const onRequestLogoutConfirm = () => {
    setIsLogoutConfirmOpen(true);
  };

  const onCancelLogoutConfirm = () => {
    setIsLogoutConfirmOpen(false);
  };

  const onConfirmLogout = useCallback(() => {
    if (onLogout === undefined) {
      return;
    }

    setIsLogoutConfirmOpen(false);
    closeUserMenu();
    onLogout();
  }, [closeUserMenu, onLogout]);

  const onUserMenuHandlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    userMenuDragPointerIdRef.current = event.pointerId;
    userMenuDragStartXRef.current = event.clientX;
    userMenuDragOffsetRef.current = 0;
    setUserMenuDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onUserMenuHandlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (userMenuDragPointerIdRef.current !== event.pointerId || userMenuDragStartXRef.current === null) {
      return;
    }

    const nextOffset = Math.max(0, event.clientX - userMenuDragStartXRef.current);
    userMenuDragOffsetRef.current = nextOffset;
    setUserMenuDragOffset(nextOffset);
  };

  const finishUserMenuDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    forceClose: boolean = false,
  ) => {
    if (userMenuDragPointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const shouldClose = forceClose || userMenuDragOffsetRef.current >= USER_MENU_DRAG_CLOSE_THRESHOLD;

    if (shouldClose) {
      closeUserMenu();
      return;
    }

    resetUserMenuDrag();
  };

  const userMenuPanelStyle: React.CSSProperties = {
    transform: isUserMenuOpen ? `translateX(${userMenuDragOffset}px)` : 'translateX(100%)',
  };

  return (
    <>
      <header className="hidden rounded-3xl border border-(--border-subtle) p-4 shadow-sm md:block md:p-5 surface-panel">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto] md:items-stretch">
          <div className="min-w-0 md:col-start-1 md:row-start-1">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-[0.22em] text-(--text-muted) sm:text-[10px]">
              Clean Periodic Table
            </p>
            <h1 className="mt-1 whitespace-nowrap text-lg font-extrabold leading-none text-foreground sm:text-xl">
              Chemical Explorer
            </h1>
          </div>

          <div className="flex flex-col gap-2 md:col-start-2 md:row-span-2 md:h-full md:items-end md:justify-between">
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <TokenStatus status={authStatus} />
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
                aria-label="Open user menu"
                title="Open user menu"
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
                onRequestLogin={onRequestLogin}
                onRequestRegister={onRequestRegister}
              />
            </div>
          </div>

          <AppHeaderDesktopNav pathname={pathname} />
        </div>
      </header>

      <div className="md:hidden">
        <p className="mb-2 text-center text-[9px] uppercase tracking-[0.24em] text-(--text-muted)">
          Clean Periodic Table
        </p>
        <header className="surface-panel rounded-3xl border border-(--border-subtle) p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenRouteMenu}
              className="size-9 rounded-xl px-0"
              aria-label="Open routes menu"
              title="Open routes menu"
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
                aria-label="Open user menu"
                title="Open user menu"
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
                onRequestLogin={onRequestLoginFromButton}
                onRequestRegister={onRequestRegisterFromButton}
              />
            </div>
          </div>
        </header>
      </div>

      <AppHeaderRouteMenu isOpen={isRouteMenuOpen} pathname={pathname} onClose={closeRouteMenu} />

      <AppHeaderUserMenu
        isOpen={isUserMenuOpen}
        hasToken={hasToken}
        userDisplayName={userDisplayName}
        userProfileStatus={userProfileStatus}
        userProfile={userProfile}
        userProfileError={userProfileError}
        isLogoutConfirmOpen={isLogoutConfirmOpen}
        userMenuPanelStyle={userMenuPanelStyle}
        onClose={closeUserMenu}
        onRequestLogoutConfirm={onRequestLogoutConfirm}
        onCancelLogoutConfirm={onCancelLogoutConfirm}
        onConfirmLogout={onConfirmLogout}
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
