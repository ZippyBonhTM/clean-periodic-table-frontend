import type { AuthUserProfile } from '@/shared/types/auth';
import type { AppHeaderTextCatalog } from '@/components/shared/header/appHeaderText';

import type { UserProfileRequestStatus } from './appHeader.types';

type AppHeaderUserProfilePanelProps = {
  hasToken: boolean;
  userProfileStatus: UserProfileRequestStatus;
  userProfile: AuthUserProfile | null;
  userProfileError: string | null;
  text: AppHeaderTextCatalog['profile'];
};

export default function AppHeaderUserProfilePanel({
  hasToken,
  userProfileStatus,
  userProfile,
  userProfileError,
  text,
}: AppHeaderUserProfilePanelProps) {
  return (
    <section className="mt-4 rounded-xl border border-(--border-subtle) bg-(--surface-2)/55 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
        {text.title}
      </p>

      {!hasToken ? (
        <p className="mt-2 text-xs text-(--text-muted)">{text.notAuthenticated}</p>
      ) : userProfileStatus === 'loading' ? (
        <p className="mt-2 text-xs text-(--text-muted)">{text.loading}</p>
      ) : userProfileStatus === 'error' ? (
        <p className="mt-2 text-xs text-rose-200">{userProfileError ?? text.unavailable}</p>
      ) : userProfile !== null ? (
        <dl className="mt-2 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">{text.name}</dt>
            <dd className="max-w-42.5 truncate text-xs font-semibold text-foreground" title={userProfile.name}>
              {userProfile.name}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">{text.email}</dt>
            <dd className="max-w-42.5 truncate text-xs text-foreground" title={userProfile.email}>
              {userProfile.email}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">{text.role}</dt>
            <dd className="text-xs font-semibold text-foreground">{userProfile.role}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[10px] uppercase tracking-widest text-(--text-muted)">{text.id}</dt>
            <dd className="max-w-42.5 break-all text-[11px] font-medium text-foreground">
              {userProfile.id}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-(--text-muted)">{text.unavailable}</p>
      )}
    </section>
  );
}
