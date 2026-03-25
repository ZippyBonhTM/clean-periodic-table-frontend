'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import AppShell from '@/components/templates/AppShell';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import { AdminClientSessionProvider } from '@/shared/admin/adminClientSession';
import { isAdminUserProfile } from '@/shared/admin/adminAccess';
import { createAdminApi } from '@/shared/api/adminApi';
import { logoutSession, refreshAccessToken } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import {
  buildAdminPanelNavigation,
  type AdminPanelSectionKey,
} from '@/shared/admin/adminPanel';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AuthUserProfile } from '@/shared/types/auth';

type AdminDashboardShellProps = {
  locale: AppLocale;
  adminProfile: AuthUserProfile | null;
  articleFeatureStage: ArticleFeatureStage;
  children: React.ReactNode;
};

type ClientAdminRecoveryErrorState =
  | {
      token: string;
      state: 'denied' | 'unavailable';
    }
  | null;

function resolveArticleStageLabel(
  featureStage: ArticleFeatureStage,
  text: ReturnType<typeof getAdminWorkspaceText>,
): string {
  if (featureStage === 'internal') {
    return text.shell.featureStageStates.internal;
  }

  if (featureStage === 'public') {
    return text.shell.featureStageStates.public;
  }

  return text.shell.featureStageStates.off;
}

function resolveArticleStageClass(featureStage: ArticleFeatureStage): string {
  if (featureStage === 'internal') {
    return 'border-amber-400/35 bg-amber-400/10 text-amber-50';
  }

  if (featureStage === 'public') {
    return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-50';
  }

  return 'border-slate-400/25 bg-slate-400/10 text-slate-200';
}

function isNavigationItemActive(pathname: string | null, href: string, key: AdminPanelSectionKey): boolean {
  if (pathname === null) {
    return key === 'overview';
  }

  return pathname === href;
}

export default function AdminDashboardShell({
  locale,
  adminProfile,
  articleFeatureStage,
  children,
}: AdminDashboardShellProps) {
  const pathname = usePathname();
  const text = getAdminWorkspaceText(locale);
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const refreshTokenOnce = useCallback(async () => {
    const refreshResponse = await refreshAccessToken();
    persistToken(refreshResponse.accessToken, { clearSilentRefreshBlocked: true });
    return refreshResponse.accessToken;
  }, [persistToken]);
  const adminApi = useMemo(() => createAdminApi({ refreshTokenOnce }), [refreshTokenOnce]);
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
  });
  const [resolvedAdminProfile, setResolvedAdminProfile] = useState<AuthUserProfile | null>(adminProfile);
  const [recoveryErrorState, setRecoveryErrorState] = useState<ClientAdminRecoveryErrorState>(null);
  const attemptedRecoveryTokenRef = useRef<string | null>(null);
  const navigationItems = buildAdminPanelNavigation(locale);
  const localizedHomePath = buildLocalizedAppPath(locale, '/');

  useEffect(() => {
    if (resolvedAdminProfile !== null) {
      return;
    }

    if (!isHydrated || authSession.status !== 'authenticated' || token === null) {
      attemptedRecoveryTokenRef.current = null;
      return;
    }

    if (attemptedRecoveryTokenRef.current === token) {
      return;
    }

    attemptedRecoveryTokenRef.current = token;
    let isCancelled = false;

    void adminApi
      .getSession({
        token,
      })
      .then((adminSession) => {
        if (isCancelled) {
          return;
        }

        if (!isAdminUserProfile(adminSession.user)) {
          setRecoveryErrorState({
            token,
            state: 'denied',
          });
          return;
        }

        setResolvedAdminProfile(adminSession.user);
      })
      .catch((caughtError: unknown) => {
        if (isCancelled) {
          return;
        }

        if (
          caughtError instanceof ApiError &&
          (caughtError.statusCode === 401 || caughtError.statusCode === 403)
        ) {
          setRecoveryErrorState({
            token,
            state: 'denied',
          });
          return;
        }

        setRecoveryErrorState({
          token,
          state: 'unavailable',
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [adminApi, authSession.status, isHydrated, resolvedAdminProfile, token]);

  const recoveryStatus = useMemo(() => {
    if (resolvedAdminProfile !== null) {
      return 'granted' as const;
    }

    if (!isHydrated || authSession.status === 'checking') {
      return 'checking' as const;
    }

    if (token === null || authSession.status !== 'authenticated') {
      return 'denied' as const;
    }

    if (recoveryErrorState?.token === token && recoveryErrorState.state === 'unavailable') {
      return 'unavailable' as const;
    }

    if (recoveryErrorState?.token === token && recoveryErrorState.state === 'denied') {
      return 'denied' as const;
    }

    return 'checking' as const;
  }, [authSession.status, isHydrated, recoveryErrorState, resolvedAdminProfile, token]);

  const onLogout = () => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  };

  return (
    <AdminClientSessionProvider
      value={{
        token,
        authStatus: authSession.status,
        isHydrated,
        isSilentRefreshBlocked,
        persistToken,
        refreshTokenOnce,
        removeToken,
      }}
    >
      <AppShell
        hasToken={authSession.status === 'authenticated'}
        authStatus={authSession.status}
        headerDocumentNavigation
        onLogout={onLogout}
      >
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
          <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
            <Panel className="overflow-hidden rounded-[2rem] border border-(--border-subtle) bg-[radial-gradient(circle_at_top_left,rgba(234,88,12,0.16),transparent_40%),linear-gradient(180deg,rgba(12,16,27,0.96),rgba(12,16,27,0.9))] text-slate-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-50">
                    {text.shell.badge}
                  </span>
                  <h1 className="text-2xl font-black tracking-[-0.04em] text-white">
                    {text.shell.title}
                  </h1>
                  <p className="text-sm leading-7 text-slate-200/82">
                    {text.shell.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/24 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300/80">
                      {text.shell.currentAdminLabel}
                    </p>
                    {resolvedAdminProfile !== null ? (
                      <>
                        <p className="mt-2 text-sm font-semibold text-white">{resolvedAdminProfile.name}</p>
                        <p className="mt-1 break-all text-xs text-slate-300/80">{resolvedAdminProfile.email}</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-sm font-semibold text-white">{text.shell.recoveryPendingTitle}</p>
                        <p className="mt-1 text-xs text-slate-300/80">{text.shell.recoveryPendingDescription}</p>
                      </>
                    )}
                  </div>
                  <div className={`rounded-[1.35rem] border px-4 py-4 ${resolveArticleStageClass(articleFeatureStage)}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em]">
                      {text.shell.featureStageLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {resolveArticleStageLabel(articleFeatureStage, text)}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel className="rounded-[2rem]">
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                  {text.shell.navigationLabel}
                </p>
                <nav className="grid gap-2">
                  {navigationItems.map((item) => {
                    const sectionText = text.sections[item.key];
                    const isActive = isNavigationItemActive(pathname, item.href, item.key);

                    return (
                      <a
                        key={item.key}
                        href={item.href}
                        className={`rounded-[1.2rem] border px-4 py-3 transition ${
                          isActive
                            ? 'border-orange-400/40 bg-orange-400/12 text-(--text-strong)'
                            : 'border-(--border-subtle) bg-[var(--surface-2)] text-(--text-muted) hover:border-orange-400/30 hover:text-(--text-strong)'
                        }`}
                      >
                        <p className="text-sm font-black tracking-[-0.02em]">{sectionText.navLabel}</p>
                        <p className="mt-1 text-xs leading-6 opacity-80">{sectionText.description}</p>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </Panel>

            <Panel className="rounded-[2rem]">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                  {text.shell.serverGuardLabel}
                </p>
                <p className="text-sm font-semibold text-(--text-strong)">{text.shell.serverGuardValue}</p>
              </div>
            </Panel>
          </aside>

          <div className="min-w-0 space-y-4 xl:space-y-5">
            {resolvedAdminProfile !== null ? (
              children
            ) : recoveryStatus === 'denied' ? (
              <Panel className="rounded-[2rem]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">
                      {text.shell.recoveryDeniedTitle}
                    </h2>
                    <p className="text-sm leading-7 text-(--text-muted)">
                      {text.shell.recoveryDeniedDescription}
                    </p>
                  </div>
                  <a
                    href={localizedHomePath}
                    className="inline-flex items-center justify-center rounded-xl border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-(--text-strong) transition hover:border-(--accent) hover:text-(--text-strong)"
                  >
                    {text.shell.recoveryBackToSite}
                  </a>
                </div>
              </Panel>
            ) : recoveryStatus === 'unavailable' ? (
              <Panel className="rounded-[2rem]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">
                      {text.shell.recoveryUnavailableTitle}
                    </h2>
                    <p className="text-sm leading-7 text-(--text-muted)">
                      {text.shell.recoveryUnavailableDescription}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="rounded-xl px-4"
                    onClick={authSession.revalidate}
                  >
                    {text.common.retry}
                  </Button>
                </div>
              </Panel>
            ) : (
              <Panel className="rounded-[2rem]">
                <div className="space-y-3">
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">
                    {text.shell.recoveryTitle}
                  </h2>
                  <p className="text-sm leading-7 text-(--text-muted)">
                    {text.shell.recoveryDescription}
                  </p>
                  <p className="text-sm font-semibold text-(--text-strong)">
                    {text.common.loading}
                  </p>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </AppShell>
    </AdminClientSessionProvider>
  );
}
