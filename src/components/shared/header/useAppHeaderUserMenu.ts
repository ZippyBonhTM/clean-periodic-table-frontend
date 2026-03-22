'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchProfile } from '@/shared/api/authApi';
import {
  persistCachedAuthProfile,
  readCachedAuthProfile,
} from '@/shared/storage/authProfileStorage';
import { readJwtDisplayName } from '@/shared/utils/jwt';
import type { AuthUserProfile } from '@/shared/types/auth';

import type { UserProfileRequestStatus } from './appHeader.types';

type UseAppHeaderUserMenuParams = {
  hasToken: boolean;
  token: string | null;
  onPersistToken: (token: string) => void;
  guestDisplayName: string;
  userDisplayNameFallback: string;
  profileLoadErrorFallback: string;
  onLogout?: () => void;
};

const USER_MENU_DRAG_CLOSE_THRESHOLD = 70;

export default function useAppHeaderUserMenu({
  hasToken,
  token,
  onPersistToken,
  guestDisplayName,
  userDisplayNameFallback,
  profileLoadErrorFallback,
  onLogout,
}: UseAppHeaderUserMenuParams) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [userMenuDragOffset, setUserMenuDragOffset] = useState(0);
  const [userProfileStatus, setUserProfileStatus] = useState<UserProfileRequestStatus>('idle');
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [userProfileToken, setUserProfileToken] = useState<string | null>(null);
  const [userProfileError, setUserProfileError] = useState<string | null>(null);
  const userMenuDragPointerIdRef = useRef<number | null>(null);
  const userMenuDragStartXRef = useRef<number | null>(null);
  const userMenuDragOffsetRef = useRef(0);
  const fetchedProfileTokenRef = useRef<string | null>(null);

  const userDisplayName = useMemo(() => {
    const cachedUserProfile = token === null ? null : readCachedAuthProfile(token);
    const resolvedUserProfile =
      token !== null && userProfileToken === token && userProfile !== null
        ? userProfile
        : cachedUserProfile;

    if (!hasToken || token === null) {
      return guestDisplayName;
    }

    if (resolvedUserProfile?.name.trim().length) {
      return resolvedUserProfile.name;
    }

    return readJwtDisplayName(token) ?? userDisplayNameFallback;
  }, [guestDisplayName, hasToken, token, userDisplayNameFallback, userProfile, userProfileToken]);

  const resetUserMenuDrag = useCallback(() => {
    userMenuDragOffsetRef.current = 0;
    userMenuDragStartXRef.current = null;
    userMenuDragPointerIdRef.current = null;
    setUserMenuDragOffset(0);
  }, []);

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsLogoutConfirmOpen(false);
    resetUserMenuDrag();
  }, [resetUserMenuDrag]);

  const openUserMenu = useCallback(() => {
    const cachedUserProfile = token === null ? null : readCachedAuthProfile(token);

    if (!hasToken || token === null) {
      fetchedProfileTokenRef.current = null;
      setUserProfileStatus('idle');
      setUserProfile(null);
      setUserProfileToken(null);
      setUserProfileError(null);
    } else if (cachedUserProfile !== null) {
      fetchedProfileTokenRef.current = token;
      setUserProfileStatus('success');
      setUserProfile(cachedUserProfile);
      setUserProfileToken(token);
      setUserProfileError(null);
    } else if (fetchedProfileTokenRef.current === token && userProfile !== null) {
      setUserProfileStatus('success');
      setUserProfileToken(token);
      setUserProfileError(null);
    } else {
      fetchedProfileTokenRef.current = null;
      setUserProfileStatus('loading');
      setUserProfileToken(null);
      setUserProfileError(null);
    }

    setIsLogoutConfirmOpen(false);
    resetUserMenuDrag();
    setIsUserMenuOpen(true);
  }, [hasToken, resetUserMenuDrag, token, userProfile]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    if (!hasToken || token === null) {
      return;
    }

    const cachedUserProfile = readCachedAuthProfile(token);

    if (cachedUserProfile !== null) {
      fetchedProfileTokenRef.current = token;
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
            onPersistToken(nextAccessToken);
          }
        }

        setUserProfile(profileResponse.userProfile);
        setUserProfileToken(token);
        persistCachedAuthProfile(token, profileResponse.userProfile);

        if (nextAccessToken.length > 0) {
          persistCachedAuthProfile(nextAccessToken, profileResponse.userProfile);
        }

        setUserProfileStatus('success');
      })
      .catch((caughtError: unknown) => {
        if (isCancelled) {
          return;
        }

        fetchedProfileTokenRef.current = null;
        setUserProfile(null);
        setUserProfileToken(null);
        setUserProfileStatus('error');

        if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
          setUserProfileError(caughtError.message);
          return;
        }

        setUserProfileError(profileLoadErrorFallback);
      });

    return () => {
      isCancelled = true;
    };
  }, [hasToken, isUserMenuOpen, onPersistToken, profileLoadErrorFallback, token]);

  const requestLogoutConfirm = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const cancelLogoutConfirm = useCallback(() => {
    setIsLogoutConfirmOpen(false);
  }, []);

  const confirmLogout = useCallback(() => {
    if (onLogout === undefined) {
      return;
    }

    setIsLogoutConfirmOpen(false);
    closeUserMenu();
    onLogout();
  }, [closeUserMenu, onLogout]);

  const onUserMenuHandlePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    userMenuDragPointerIdRef.current = event.pointerId;
    userMenuDragStartXRef.current = event.clientX;
    userMenuDragOffsetRef.current = 0;
    setUserMenuDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onUserMenuHandlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (
      userMenuDragPointerIdRef.current !== event.pointerId ||
      userMenuDragStartXRef.current === null
    ) {
      return;
    }

    const nextOffset = Math.max(0, event.clientX - userMenuDragStartXRef.current);
    userMenuDragOffsetRef.current = nextOffset;
    setUserMenuDragOffset(nextOffset);
  }, []);

  const finishUserMenuDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, forceClose: boolean = false) => {
      if (userMenuDragPointerIdRef.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const shouldClose =
        forceClose || userMenuDragOffsetRef.current >= USER_MENU_DRAG_CLOSE_THRESHOLD;

      if (shouldClose) {
        closeUserMenu();
        return;
      }

      resetUserMenuDrag();
    },
    [closeUserMenu, resetUserMenuDrag],
  );

  const userMenuPanelStyle: React.CSSProperties = {
    transform: isUserMenuOpen ? `translateX(${userMenuDragOffset}px)` : 'translateX(100%)',
  };

  return {
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
  };
}
