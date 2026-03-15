'use client';

import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import TokenStatus from '@/components/molecules/TokenStatus';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import UserAvatarPlaceholder from '@/components/molecules/UserAvatarPlaceholder';
import { fetchProfile } from '@/shared/api/authApi';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppTheme } from '@/shared/hooks/useTheme';
import { readJwtDisplayName } from '@/shared/utils/jwt';
import type { AuthUserProfile } from '@/shared/types/auth';

import AppHeaderDesktopNav from './AppHeaderDesktopNav';
import AppHeaderRouteMenu from './AppHeaderRouteMenu';
import type { AuthEntryMode } from './appHeader.types';

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

type UserProfileRequestStatus = 'idle' | 'loading' | 'success' | 'error';

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
              {!hasToken && authEntryMode === 'route' ? (
                <>
                  <LinkButton
                    href="/login"
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                  >
                    Login
                  </LinkButton>
                  <LinkButton
                    href="/register"
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                  >
                    Register
                  </LinkButton>
                </>
              ) : !hasToken ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                    onClick={onRequestLogin}
                  >
                    Login
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                    onClick={onRequestRegister}
                  >
                    Register
                  </Button>
                </>
              ) : null}
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

              {!hasToken && authEntryMode === 'route' ? (
                <>
                  <LinkButton
                    href="/login"
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                  >
                    Login
                  </LinkButton>
                  <LinkButton
                    href="/register"
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                  >
                    Register
                  </LinkButton>
                </>
              ) : null}

              {!hasToken && authEntryMode === 'modal' ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                    onClick={onRequestLoginFromButton}
                  >
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    uppercase
                    className="px-2.5 text-[10px]"
                    onClick={onRequestRegisterFromButton}
                  >
                    Register
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </header>
      </div>

      <AppHeaderRouteMenu isOpen={isRouteMenuOpen} pathname={pathname} onClose={closeRouteMenu} />

      <div
        className={`fixed inset-0 z-160 transition-opacity duration-300 ${
          isUserMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isUserMenuOpen}
      >
        <button
          type="button"
          onClick={closeUserMenu}
          className="absolute inset-0 bg-black/35"
          aria-label="Close user menu backdrop"
        />

        <aside
          className="absolute right-0 top-0 h-full w-[min(84vw,320px)] border-l border-(--border-subtle) bg-[rgba(9,17,34,0.34)] p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300"
          style={userMenuPanelStyle}
          role="dialog"
          aria-modal="true"
          aria-label="User menu"
        >
          <button
            type="button"
            onClick={closeUserMenu}
            onPointerDown={onUserMenuHandlePointerDown}
            onPointerMove={onUserMenuHandlePointerMove}
            onPointerUp={(event) => finishUserMenuDrag(event)}
            onPointerCancel={(event) => finishUserMenuDrag(event)}
            onLostPointerCapture={resetUserMenuDrag}
            className="absolute left-0 top-0 h-full w-4 -translate-x-full border-r border-(--border-subtle)/55 bg-transparent"
            aria-label="Drag or tap edge to close user menu"
            title="Drag or tap edge to close user menu"
          />

          <div className="flex items-center justify-between gap-2">
            <p
              className="max-w-52.5 truncate text-sm font-semibold text-foreground"
              title={userDisplayName}
            >
              {userDisplayName}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={closeUserMenu}
              aria-label="Close user menu"
            >
              Close
            </Button>
          </div>

          <p className="mt-1 text-xs text-(--text-muted)">User menu</p>

          <section className="mt-4 rounded-xl border border-(--border-subtle) bg-(--surface-2)/55 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
              Profile
            </p>

            {!hasToken ? (
              <p className="mt-2 text-xs text-(--text-muted)">Not authenticated.</p>
            ) : userProfileStatus === 'loading' ? (
              <p className="mt-2 text-xs text-(--text-muted)">Loading profile...</p>
            ) : userProfileStatus === 'error' ? (
              <p className="mt-2 text-xs text-rose-200">{userProfileError ?? 'Profile unavailable.'}</p>
            ) : userProfile !== null ? (
              <dl className="mt-2 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">Name</dt>
                  <dd className="max-w-42.5 truncate text-xs font-semibold text-foreground" title={userProfile.name}>
                    {userProfile.name}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">Email</dt>
                  <dd className="max-w-42.5 truncate text-xs text-foreground" title={userProfile.email}>
                    {userProfile.email}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">Role</dt>
                  <dd className="text-xs font-semibold text-foreground">{userProfile.role}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">ID</dt>
                  <dd className="max-w-42.5 break-all text-[11px] font-medium text-foreground">
                    {userProfile.id}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-xs text-(--text-muted)">Profile unavailable.</p>
            )}
          </section>

          <div className="mt-4">
            {hasToken && onLogout !== undefined ? (
              isLogoutConfirmOpen ? (
                <div className="space-y-2 rounded-lg border border-rose-500/45 bg-rose-500/10 p-2">
                  <p className="text-[11px] text-rose-100">Confirm logout?</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      align="center"
                      className="flex-1 px-2 text-[10px] uppercase tracking-[0.06em]"
                      onClick={onCancelLogoutConfirm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      align="center"
                      className="flex-1 border border-rose-500/65 bg-rose-500/12 px-2 text-[10px] uppercase tracking-[0.06em] text-rose-200 hover:bg-rose-500/22"
                      onClick={onConfirmLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  align="center"
                  className="w-full border border-rose-500/65 bg-rose-500/12 px-3 text-[10px] uppercase tracking-[0.08em] text-rose-200 hover:bg-rose-500/22"
                  onClick={onRequestLogoutConfirm}
                >
                  Logout
                </Button>
              )
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}

export default memo(AppHeader);
export type { AuthEntryMode };
