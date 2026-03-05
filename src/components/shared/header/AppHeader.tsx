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

type AuthEntryMode = 'modal' | 'route';

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

const NAV_LINKS = [
  { href: '/periodic-table', label: 'Periodic Table' },
  { href: '/search', label: 'Search' },
];

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
      fetchedProfileTokenRef.current = null;
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

  const onOpenUserMenu = () => {
    setIsRouteMenuOpen(false);
    resetUserMenuDrag();
    setUserProfileStatus('loading');
    setUserProfileError(null);
    setIsUserMenuOpen(true);
  };

  const onRequestLoginFromButton = () => {
    closeAllMenus();
    onRequestLogin?.();
  };

  const onRequestRegisterFromButton = () => {
    closeAllMenus();
    onRequestRegister?.();
  };

  const onConfirmLogout = useCallback(() => {
    if (onLogout === undefined) {
      return;
    }

    const shouldLogout = window.confirm('Do you really want to logout?');

    if (!shouldLogout) {
      return;
    }

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
      <header className="hidden rounded-3xl border border-[var(--border-subtle)] p-4 shadow-sm md:block md:p-5 surface-panel">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto] md:items-stretch">
          <div className="min-w-0 md:col-start-1 md:row-start-1">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)] sm:text-[10px]">
              Clean Periodic Table
            </p>
            <h1 className="mt-1 whitespace-nowrap text-lg font-extrabold leading-none text-[var(--text-strong)] sm:text-xl">
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
                className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
          
          <nav className="flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/search');

              return (
                <LinkButton
                  key={item.href}
                  href={item.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-lg px-2.5 text-[11px]"
                >
                  {item.label}
                </LinkButton>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="md:hidden">
        <p className="mb-2 text-center text-[9px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Clean Periodic Table
        </p>
        <header className="surface-panel rounded-3xl border border-[var(--border-subtle)] p-3 shadow-sm">
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
                <span className="h-[2px] w-4 rounded-full bg-[var(--text-strong)]" />
                <span className="h-[2px] w-4 rounded-full bg-[var(--text-strong)]" />
                <span className="h-[2px] w-4 rounded-full bg-[var(--text-strong)]" />
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
                className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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

      <div
        className={`fixed inset-0 z-[150] transition-opacity duration-300 md:hidden ${
          isRouteMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isRouteMenuOpen}
      >
        <button
          type="button"
          onClick={closeRouteMenu}
          className="absolute inset-0 bg-black/45"
          aria-label="Close routes menu backdrop"
        />

        <aside
          className={`absolute left-0 top-0 h-full w-[min(84vw,320px)] border-r border-[var(--border-subtle)] bg-[var(--surface-1)]/92 p-4 shadow-2xl backdrop-blur-sm transition-transform duration-300 ${
            isRouteMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Routes menu"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Routes</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={closeRouteMenu}
              aria-label="Close routes menu"
            >
              Close
            </Button>
          </div>

          <nav className="mt-3 flex flex-col gap-2">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/search');

              return (
                <LinkButton
                  key={`mobile-${item.href}`}
                  href={item.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  align="left"
                  className="px-3 text-[11px]"
                >
                  {item.label}
                </LinkButton>
              );
            })}
          </nav>

        </aside>
      </div>

      <div
        className={`fixed inset-0 z-[160] transition-opacity duration-300 ${
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
          className="absolute right-0 top-0 h-full w-[min(84vw,320px)] border-l border-[var(--border-subtle)] bg-[rgba(9,17,34,0.34)] p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300"
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
            className="absolute left-0 top-0 h-full w-4 -translate-x-full border-r border-[var(--border-subtle)]/55 bg-transparent"
            aria-label="Drag or tap edge to close user menu"
            title="Drag or tap edge to close user menu"
          />

          <div className="flex items-center justify-between gap-2">
            <p
              className="max-w-[210px] truncate text-sm font-semibold text-[var(--text-strong)]"
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

          <p className="mt-1 text-xs text-[var(--text-muted)]">User menu</p>

          <section className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/55 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Profile</p>

            {!hasToken ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">Not authenticated.</p>
            ) : userProfileStatus === 'loading' ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">Loading profile...</p>
            ) : userProfileStatus === 'error' ? (
              <p className="mt-2 text-xs text-rose-200">{userProfileError ?? 'Profile unavailable.'}</p>
            ) : userProfile !== null ? (
              <dl className="mt-2 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Name</dt>
                  <dd className="max-w-[170px] truncate text-xs font-semibold text-[var(--text-strong)]" title={userProfile.name}>
                    {userProfile.name}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Email</dt>
                  <dd className="max-w-[170px] truncate text-xs text-[var(--text-strong)]" title={userProfile.email}>
                    {userProfile.email}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Role</dt>
                  <dd className="text-xs font-semibold text-[var(--text-strong)]">{userProfile.role}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">ID</dt>
                  <dd className="max-w-[170px] break-all text-[11px] font-medium text-[var(--text-strong)]">
                    {userProfile.id}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-muted)]">Profile unavailable.</p>
            )}
          </section>

          <div className="mt-4">
            {hasToken && onLogout !== undefined ? (
              <Button
                type="button"
                size="sm"
                align="center"
                className="w-full border border-rose-500/65 bg-rose-500/12 px-3 text-[10px] uppercase tracking-[0.08em] text-rose-200 hover:bg-rose-500/22"
                onClick={onConfirmLogout}
              >
                Logout
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}

export default memo(AppHeader);
export type { AuthEntryMode };
