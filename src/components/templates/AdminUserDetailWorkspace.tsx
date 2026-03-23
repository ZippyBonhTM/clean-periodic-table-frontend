'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import { createAdminApi } from '@/shared/api/adminApi';
import { ApiError } from '@/shared/api/httpClient';
import { useAdminClientSession } from '@/shared/admin/adminClientSession';
import {
  buildLocalizedAdminUsersPath,
} from '@/shared/admin/adminRouting';
import {
  formatAdminDateTime,
  resolveAdminUserStatusClass,
  resolveAdminUserVersionClass,
} from '@/shared/admin/adminPresentation';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AdminUserAccountStatus, AdminUserDetail } from '@/shared/types/admin';
import type { AuthUserProfile } from '@/shared/types/auth';

type AdminUserDetailWorkspaceProps = {
  locale: AppLocale;
  adminProfile: AuthUserProfile;
  userId: string;
};

type DetailRequestStatus = 'idle' | 'loading' | 'success' | 'error';
type ActionKind = 'role' | 'moderation' | 'sessions' | null;

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
} | null;

const FORM_CONTROL_CLASS = 'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)]';
const TEXTAREA_CLASS = `${FORM_CONTROL_CLASS} min-h-28 resize-y`;

function normalizeReason(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export default function AdminUserDetailWorkspace({
  locale,
  adminProfile,
  userId,
}: AdminUserDetailWorkspaceProps) {
  const text = getAdminWorkspaceText(locale);
  const adminApi = useMemo(() => createAdminApi(), []);
  const { token, authStatus, isHydrated } = useAdminClientSession();
  const [requestStatus, setRequestStatus] = useState<DetailRequestStatus>('idle');
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN'>('USER');
  const [roleReason, setRoleReason] = useState('');
  const [selectedModerationStatus, setSelectedModerationStatus] = useState<AdminUserAccountStatus>('active');
  const [moderationReason, setModerationReason] = useState('');
  const [moderationExpiresAt, setModerationExpiresAt] = useState('');
  const [sessionMode, setSessionMode] = useState<'all' | 'except-current'>('except-current');
  const [sessionReason, setSessionReason] = useState('');
  const [activeAction, setActiveAction] = useState<ActionKind>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const applyUserDrafts = useCallback((nextUser: AdminUserDetail) => {
    setSelectedRole(nextUser.role);
    setSelectedModerationStatus(nextUser.accountStatus);
    setModerationExpiresAt(nextUser.restriction?.expiresAt ?? '');
  }, []);

  const loadUserDetail = useCallback(async () => {
    if (!isHydrated || authStatus === 'checking' || token === null) {
      return;
    }

    setRequestStatus('loading');
    setErrorMessage(null);

    try {
      const nextUser = await adminApi.getUserById({
        token,
        userId,
      });

      setUserDetail(nextUser);
      applyUserDrafts(nextUser);
      setRequestStatus('success');
    } catch (caughtError: unknown) {
      setUserDetail(null);
      setRequestStatus('error');

      if (caughtError instanceof ApiError && caughtError.statusCode === 404) {
        setErrorMessage(text.userDetail.notFound);
        return;
      }

      if (
        caughtError instanceof ApiError &&
        (caughtError.statusCode === 500 || caughtError.statusCode === 502)
      ) {
        setErrorMessage(text.userDetail.unavailable);
        return;
      }

      if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
        setErrorMessage(caughtError.message);
        return;
      }

      setErrorMessage(text.userDetail.unavailable);
    }
  }, [adminApi, applyUserDrafts, authStatus, isHydrated, text.userDetail.notFound, text.userDetail.unavailable, token, userId]);

  useEffect(() => {
    void loadUserDetail();
  }, [loadUserDetail]);

  const submitRoleChange = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (token === null || userDetail === null) {
      return;
    }

    const normalizedReason = normalizeReason(roleReason);

    if (userDetail.id === adminProfile.id && userDetail.role === 'ADMIN' && selectedRole === 'USER') {
      setFeedback({
        type: 'error',
        message: text.userDetail.selfRoleWarning,
      });
      return;
    }

    if (normalizedReason.length < 8) {
      setFeedback({
        type: 'error',
        message: text.userDetail.roleReasonPlaceholder,
      });
      return;
    }

    setActiveAction('role');
    setFeedback(null);

    try {
      const result = await adminApi.changeUserRole({
        token,
        userId,
        role: selectedRole,
        reason: normalizedReason,
      });

      setUserDetail(result.user);
      applyUserDrafts(result.user);
      setRoleReason('');
      setFeedback({
        type: 'success',
        message: result.message || text.userDetail.actionFeedbackSuccess,
      });
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
        setFeedback({
          type: 'error',
          message: caughtError.message,
        });
      } else {
        setFeedback({
          type: 'error',
          message: text.userDetail.unavailable,
        });
      }
    } finally {
      setActiveAction(null);
    }
  }, [adminApi, adminProfile.id, applyUserDrafts, roleReason, selectedRole, text.userDetail.actionFeedbackSuccess, text.userDetail.roleReasonPlaceholder, text.userDetail.selfRoleWarning, text.userDetail.unavailable, token, userDetail, userId]);

  const submitModeration = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (token === null) {
      return;
    }

    const normalizedReason = normalizeReason(moderationReason);

    if (normalizedReason.length < 8) {
      setFeedback({
        type: 'error',
        message: text.userDetail.moderationReasonPlaceholder,
      });
      return;
    }

    setActiveAction('moderation');
    setFeedback(null);

    try {
      const result = await adminApi.moderateUser({
        token,
        userId,
        status: selectedModerationStatus,
        reason: normalizedReason,
        expiresAt: moderationExpiresAt.length > 0 ? new Date(moderationExpiresAt).toISOString() : null,
      });

      setUserDetail(result.user);
      applyUserDrafts(result.user);
      setModerationReason('');
      setFeedback({
        type: 'success',
        message: result.message || text.userDetail.actionFeedbackSuccess,
      });
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
        setFeedback({
          type: 'error',
          message: caughtError.message,
        });
      } else {
        setFeedback({
          type: 'error',
          message: text.userDetail.unavailable,
        });
      }
    } finally {
      setActiveAction(null);
    }
  }, [adminApi, applyUserDrafts, moderationExpiresAt, moderationReason, selectedModerationStatus, text.userDetail.actionFeedbackSuccess, text.userDetail.moderationReasonPlaceholder, text.userDetail.unavailable, token, userId]);

  const submitSessionRevoke = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (token === null) {
      return;
    }

    const normalizedReason = normalizeReason(sessionReason);

    if (normalizedReason.length < 8) {
      setFeedback({
        type: 'error',
        message: text.userDetail.sessionsReasonPlaceholder,
      });
      return;
    }

    setActiveAction('sessions');
    setFeedback(null);

    try {
      const result = await adminApi.revokeUserSessions({
        token,
        userId,
        reason: normalizedReason,
        mode: sessionMode,
      });

      await loadUserDetail();
      setSessionReason('');
      setFeedback({
        type: 'success',
        message: result.message || text.userDetail.actionFeedbackSuccess,
      });
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
        setFeedback({
          type: 'error',
          message: caughtError.message,
        });
      } else {
        setFeedback({
          type: 'error',
          message: text.userDetail.unavailable,
        });
      }
    } finally {
      setActiveAction(null);
    }
  }, [adminApi, loadUserDetail, sessionMode, sessionReason, text.userDetail.actionFeedbackSuccess, text.userDetail.sessionsReasonPlaceholder, text.userDetail.unavailable, token, userId]);

  const canUseRoleAction = userDetail?.capabilities?.canChangeRole ?? true;
  const canUseModerationAction = userDetail?.capabilities?.canModerate ?? true;
  const canUseSessionAction = userDetail?.capabilities?.canRevokeSessions ?? true;

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.userDetail.summaryTitle}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.userDetail.summaryDescription}</p>
          </div>

          <LinkButton href={buildLocalizedAdminUsersPath(locale)} variant="ghost" size="sm" className="rounded-full px-4">
            {text.userDetail.backToUsers}
          </LinkButton>
        </div>
      </Panel>

      {!isHydrated || authStatus === 'checking' || token === null || requestStatus === 'loading' ? (
        <Panel className="rounded-[2rem] text-sm leading-7 text-(--text-muted)">
          {text.userDetail.loading}
        </Panel>
      ) : requestStatus === 'error' || userDetail === null ? (
        <Panel className="rounded-[2rem] text-sm leading-7 text-rose-100 border-rose-500/40 bg-rose-500/10">
          {errorMessage ?? text.userDetail.unavailable}
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:gap-5">
            <Panel className="rounded-[2rem]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveAdminUserStatusClass(userDetail.accountStatus)}`}>
                        {text.users.statusFilters[userDetail.accountStatus]}
                      </span>
                      <span className="inline-flex rounded-full border border-(--border-subtle) bg-white/6 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-(--text-muted)">
                        {text.users.roleFilters[userDetail.role]}
                      </span>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveAdminUserVersionClass(userDetail.accountVersion)}`}>
                        {text.users.versionFilters[userDetail.accountVersion]}
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{userDetail.name}</h3>
                    <p className="break-all text-sm leading-7 text-(--text-muted)">{userDetail.email}</p>
                  </div>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.createdAt}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, userDetail.createdAt)}</dd>
                  </div>
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.updatedAt}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, userDetail.updatedAt)}</dd>
                  </div>
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.lastSeenAt}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, userDetail.lastSeenAt)}</dd>
                  </div>
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.summaryFields.version}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{text.users.versionFilters[userDetail.accountVersion]}</dd>
                  </div>
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.summaryFields.activeSessions}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{userDetail.activeSessionCount ?? '—'}</dd>
                  </div>
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.summaryFields.lastAudit}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, userDetail.lastAuditAt)}</dd>
                  </div>
                  <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.summaryFields.restriction}</dt>
                    <dd className="mt-1 text-sm text-(--text-strong)">{userDetail.restriction?.reason ?? '—'}</dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <Panel className="rounded-[2rem]">
              <div className="space-y-4">
                <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.userDetail.guardedNotesTitle}</h3>
                {userDetail.capabilities === null ? (
                  <div className="rounded-[1.25rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                    {text.userDetail.capabilityFallback}
                  </div>
                ) : null}
                <ul className="grid gap-2 text-sm leading-7 text-(--text-muted)">
                  {text.userDetail.guardedNotes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="pt-2 text-[10px] text-(--accent)">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-[1.25rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                  {userDetail.accountVersion === 'legacy'
                    ? text.userDetail.legacyVersionNote
                    : text.userDetail.productVersionNote}
                </div>
                {feedback !== null ? (
                  <div className={`rounded-[1.25rem] border px-4 py-4 text-sm leading-7 ${feedback.type === 'success' ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-50' : 'border-rose-400/35 bg-rose-400/10 text-rose-100'}`}>
                    {feedback.message}
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
            <Panel className="rounded-[2rem]">
              <form onSubmit={submitRoleChange} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.userDetail.roleActionTitle}</h3>
                  <p className="text-sm leading-7 text-(--text-muted)">{text.userDetail.roleActionDescription}</p>
                </div>
                <div>
                  <label htmlFor="admin-user-role-select" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.roleSelectLabel}</label>
                  <select id="admin-user-role-select" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as 'USER' | 'ADMIN')} className={`${FORM_CONTROL_CLASS} mt-3`}>
                    <option value="USER">{text.users.roleFilters.USER}</option>
                    <option value="ADMIN">{text.users.roleFilters.ADMIN}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-user-role-reason" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.roleReasonLabel}</label>
                  <textarea id="admin-user-role-reason" value={roleReason} onChange={(event) => setRoleReason(event.target.value)} placeholder={text.userDetail.roleReasonPlaceholder} className={`${TEXTAREA_CLASS} mt-3`} />
                </div>
                {userDetail.id === adminProfile.id && userDetail.role === 'ADMIN' && selectedRole === 'USER' ? (
                  <p className="text-sm leading-7 text-amber-200">{text.userDetail.selfRoleWarning}</p>
                ) : null}
                <Button type="submit" variant="secondary" size="lg" className="w-full rounded-xl" disabled={!canUseRoleAction || activeAction !== null}>
                  {text.userDetail.roleSubmit}
                </Button>
              </form>
            </Panel>

            <Panel className="rounded-[2rem]">
              <form onSubmit={submitModeration} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.userDetail.moderationTitle}</h3>
                  <p className="text-sm leading-7 text-(--text-muted)">{text.userDetail.moderationDescription}</p>
                </div>
                <div>
                  <label htmlFor="admin-user-moderation-status" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.moderationStatusLabel}</label>
                  <select id="admin-user-moderation-status" value={selectedModerationStatus} onChange={(event) => setSelectedModerationStatus(event.target.value as AdminUserAccountStatus)} className={`${FORM_CONTROL_CLASS} mt-3`}>
                    <option value="active">{text.users.statusFilters.active}</option>
                    <option value="restricted">{text.users.statusFilters.restricted}</option>
                    <option value="suspended">{text.users.statusFilters.suspended}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-user-moderation-reason" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.moderationReasonLabel}</label>
                  <textarea id="admin-user-moderation-reason" value={moderationReason} onChange={(event) => setModerationReason(event.target.value)} placeholder={text.userDetail.moderationReasonPlaceholder} className={`${TEXTAREA_CLASS} mt-3`} />
                </div>
                <div>
                  <label htmlFor="admin-user-moderation-expiry" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.moderationExpiresAtLabel}</label>
                  <input id="admin-user-moderation-expiry" type="datetime-local" value={moderationExpiresAt} onChange={(event) => setModerationExpiresAt(event.target.value)} className={`${FORM_CONTROL_CLASS} mt-3`} />
                </div>
                <Button type="submit" variant="secondary" size="lg" className="w-full rounded-xl" disabled={!canUseModerationAction || activeAction !== null}>
                  {text.userDetail.moderationSubmit}
                </Button>
              </form>
            </Panel>

            <Panel className="rounded-[2rem]">
              <form onSubmit={submitSessionRevoke} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.userDetail.sessionsTitle}</h3>
                  <p className="text-sm leading-7 text-(--text-muted)">{text.userDetail.sessionsDescription}</p>
                </div>
                <div>
                  <label htmlFor="admin-user-session-mode" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.sessionsModeLabel}</label>
                  <select id="admin-user-session-mode" value={sessionMode} onChange={(event) => setSessionMode(event.target.value as 'all' | 'except-current')} className={`${FORM_CONTROL_CLASS} mt-3`}>
                    <option value="except-current">{text.userDetail.sessionModes['except-current']}</option>
                    <option value="all">{text.userDetail.sessionModes.all}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-user-session-reason" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.userDetail.sessionsReasonLabel}</label>
                  <textarea id="admin-user-session-reason" value={sessionReason} onChange={(event) => setSessionReason(event.target.value)} placeholder={text.userDetail.sessionsReasonPlaceholder} className={`${TEXTAREA_CLASS} mt-3`} />
                </div>
                <Button type="submit" variant="secondary" size="lg" className="w-full rounded-xl" disabled={!canUseSessionAction || activeAction !== null}>
                  {text.userDetail.sessionsSubmit}
                </Button>
              </form>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
