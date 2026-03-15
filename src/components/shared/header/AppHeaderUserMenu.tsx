import type * as React from 'react';

import Button from '@/components/atoms/Button';
import type { AuthUserProfile } from '@/shared/types/auth';

import type { UserProfileRequestStatus } from './appHeader.types';
import AppHeaderUserProfilePanel from './AppHeaderUserProfilePanel';

type AppHeaderUserMenuProps = {
  isOpen: boolean;
  hasToken: boolean;
  userDisplayName: string;
  userProfileStatus: UserProfileRequestStatus;
  userProfile: AuthUserProfile | null;
  userProfileError: string | null;
  isLogoutConfirmOpen: boolean;
  userMenuPanelStyle: React.CSSProperties;
  onClose: () => void;
  onRequestLogoutConfirm: () => void;
  onCancelLogoutConfirm: () => void;
  onConfirmLogout: () => void;
  onHandlePointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onHandleLostPointerCapture: () => void;
};

export default function AppHeaderUserMenu({
  isOpen,
  hasToken,
  userDisplayName,
  userProfileStatus,
  userProfile,
  userProfileError,
  isLogoutConfirmOpen,
  userMenuPanelStyle,
  onClose,
  onRequestLogoutConfirm,
  onCancelLogoutConfirm,
  onConfirmLogout,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel,
  onHandleLostPointerCapture,
}: AppHeaderUserMenuProps) {
  return (
    <div
      className={`fixed inset-0 z-160 transition-opacity duration-300 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
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
          onClick={onClose}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerCancel}
          onLostPointerCapture={onHandleLostPointerCapture}
          className="absolute left-0 top-0 h-full w-4 -translate-x-full border-r border-(--border-subtle)/55 bg-transparent"
          aria-label="Drag or tap edge to close user menu"
          title="Drag or tap edge to close user menu"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="max-w-52.5 truncate text-sm font-semibold text-foreground" title={userDisplayName}>
            {userDisplayName}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={onClose}
            aria-label="Close user menu"
          >
            Close
          </Button>
        </div>

        <p className="mt-1 text-xs text-(--text-muted)">User menu</p>

        <AppHeaderUserProfilePanel
          hasToken={hasToken}
          userProfileStatus={userProfileStatus}
          userProfile={userProfile}
          userProfileError={userProfileError}
        />

        <div className="mt-4">
          {hasToken ? (
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
  );
}
