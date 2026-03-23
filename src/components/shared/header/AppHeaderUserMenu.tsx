import type * as React from 'react';
import Button from '@/components/atoms/Button';
import type { AppHeaderTextCatalog } from '@/components/shared/header/appHeaderText';
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
  hasAdminAccess: boolean;
  isLogoutConfirmOpen: boolean;
  userMenuPanelStyle: React.CSSProperties;
  adminHref: string;
  text: AppHeaderTextCatalog['userMenu'];
  profileText: AppHeaderTextCatalog['profile'];
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
  hasAdminAccess,
  isLogoutConfirmOpen,
  userMenuPanelStyle,
  adminHref,
  text,
  profileText,
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
        aria-label={text.closeBackdrop}
      />

      <aside
        className="absolute right-0 top-0 h-full w-[min(84vw,320px)] border-l border-(--border-subtle) bg-[rgba(9,17,34,0.34)] p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300"
        style={userMenuPanelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={text.dialogLabel}
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
          aria-label={text.dragHandle}
          title={text.dragHandle}
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
            aria-label={text.close}
          >
            {text.close}
          </Button>
        </div>

        <p className="mt-1 text-xs text-(--text-muted)">{text.subtitle}</p>

        <AppHeaderUserProfilePanel
          hasToken={hasToken}
          userProfileStatus={userProfileStatus}
          userProfile={userProfile}
          userProfileError={userProfileError}
          text={profileText}
        />

        {hasAdminAccess ? (
          <div className="mt-4 rounded-lg border border-sky-400/30 bg-sky-400/10 p-2">
            <a
              href={adminHref}
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/40 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-sky-100 transition hover:bg-sky-300/10"
            >
              {text.adminPanel}
            </a>
          </div>
        ) : null}

        <div className="mt-4">
          {hasToken ? (
            isLogoutConfirmOpen ? (
              <div className="space-y-2 rounded-lg border border-rose-500/45 bg-rose-500/10 p-2">
                <p className="text-[11px] text-rose-100">{text.confirmLogout}</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    align="center"
                    className="flex-1 px-2 text-[10px] uppercase tracking-[0.06em]"
                    onClick={onCancelLogoutConfirm}
                  >
                    {text.cancel}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    align="center"
                    className="flex-1 border border-rose-500/65 bg-rose-500/12 px-2 text-[10px] uppercase tracking-[0.06em] text-rose-200 hover:bg-rose-500/22"
                    onClick={onConfirmLogout}
                  >
                    {text.logout}
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
                {text.logout}
              </Button>
            )
          ) : null}
        </div>
      </aside>
    </div>
  );
}
