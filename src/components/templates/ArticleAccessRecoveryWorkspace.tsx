'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import { getArticleAccessRecoveryText } from '@/components/templates/articleAccessRecoveryText';
import { isAdminUserProfile } from '@/shared/admin/adminAccess';
import { createAdminApi } from '@/shared/api/adminApi';
import { logoutSession } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import AppShell from './AppShell';

type ArticleAccessRecoveryWorkspaceProps = {
  locale: AppLocale;
};

type RecoveryState = 'checking' | 'denied' | 'unavailable';

function resolveRecoveryErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export default function ArticleAccessRecoveryWorkspace({
  locale,
}: ArticleAccessRecoveryWorkspaceProps) {
  const router = useRouter();
  const text = getArticleAccessRecoveryText(locale);
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
  });
  const adminApi = useMemo(() => createAdminApi(), []);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const attemptedTokenRef = useRef<string | null>(null);
  const localizedHomePath = buildLocalizedAppPath(locale, '/');

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (authSession.status === 'checking') {
      return;
    }

    if (authSession.status === 'anonymous') {
      return;
    }

    if (authSession.status === 'unverified') {
      return;
    }

    const attemptKey = token ?? '__cookie-session__';

    if (attemptedTokenRef.current === attemptKey) {
      return;
    }

    let isCancelled = false;

    const confirmAdminAccess = async () => {
      attemptedTokenRef.current = attemptKey;
      setRecoveryState('checking');
      setErrorMessage(null);

      try {
        const adminSession = await adminApi.getSession({
          token: null,
        });

        if (isCancelled) {
          return;
        }

        if (!isAdminUserProfile(adminSession.user)) {
          setRecoveryState('denied');
          return;
        }

        router.refresh();
      } catch (caughtError: unknown) {
        if (isCancelled) {
          return;
        }

        if (
          caughtError instanceof ApiError &&
          (caughtError.statusCode === 401 || caughtError.statusCode === 403)
        ) {
          setRecoveryState('denied');
          return;
        }

        setRecoveryState('unavailable');
        setErrorMessage(resolveRecoveryErrorMessage(caughtError, text.unavailableDescription));
      }
    };

    void confirmAdminAccess();

    return () => {
      isCancelled = true;
    };
  }, [
    adminApi,
    authSession.message,
    authSession.status,
    isHydrated,
    locale,
    retryVersion,
    router,
    text.unavailableDescription,
    token,
  ]);

  const resolvedRecoveryState = useMemo(() => {
    if (!isHydrated || authSession.status === 'checking') {
      return 'checking' as const;
    }

    if (authSession.status === 'anonymous') {
      return 'denied' as const;
    }

    if (authSession.status === 'unverified') {
      return 'unavailable' as const;
    }

    return recoveryState;
  }, [authSession.status, isHydrated, recoveryState]);

  const resolvedErrorMessage = useMemo(() => {
    if (authSession.status === 'unverified') {
      return authSession.message ?? text.unavailableDescription;
    }

    return errorMessage;
  }, [authSession.message, authSession.status, errorMessage, text.unavailableDescription]);

  const onRetry = useCallback(() => {
    attemptedTokenRef.current = null;
    setErrorMessage(null);
    setRecoveryState('checking');
    authSession.revalidate();
    setRetryVersion((currentVersion) => currentVersion + 1);
  }, [authSession]);

  const onLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  return (
    <AppShell
      hasToken={authSession.status === 'authenticated'}
      authStatus={authSession.status}
      onLogout={onLogout}
    >
      <Panel className="mx-auto max-w-3xl rounded-[2rem] border border-(--border-subtle) bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_42%),linear-gradient(180deg,rgba(10,14,24,0.96),rgba(10,14,24,0.9))] p-8 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-50">
              {text.badge}
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white">{text.title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300/85">{text.description}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            {resolvedRecoveryState === 'checking' ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">{text.checkingTitle}</p>
                <p className="text-sm leading-7 text-slate-300/80">{text.checkingDescription}</p>
              </div>
            ) : resolvedRecoveryState === 'denied' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">{text.deniedTitle}</p>
                  <p className="text-sm leading-7 text-slate-300/80">{text.deniedDescription}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <LinkButton href={localizedHomePath} variant="secondary" size="sm" className="rounded-full px-4">
                    {text.backToSite}
                  </LinkButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">{text.unavailableTitle}</p>
                  <p className="text-sm leading-7 text-slate-300/80">
                    {resolvedErrorMessage ?? text.unavailableDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="sm" className="rounded-full px-4" onClick={onRetry}>
                    {text.retry}
                  </Button>
                  <LinkButton href={localizedHomePath} variant="ghost" size="sm" className="rounded-full px-4">
                    {text.backToSite}
                  </LinkButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
