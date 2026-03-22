'use client';

import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import AppShell from '@/components/templates/AppShell';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import { logoutSession } from '@/shared/api/authApi';
import { buildLocalizedAdminUsersPath } from '@/shared/admin/adminRouting';
import {
  buildLocalizedArticleEditorCreatePath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListPath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AuthUserProfile } from '@/shared/types/auth';

type AdminWorkspaceProps = {
  locale: AppLocale;
  adminProfile: AuthUserProfile;
  articleFeatureStage: ArticleFeatureStage;
};

function resolveArticleFeatureStageLabel(
  featureStage: ArticleFeatureStage,
  text: ReturnType<typeof getAdminWorkspaceText>,
): string {
  if (featureStage === 'internal') {
    return text.preview.states.internal;
  }

  if (featureStage === 'public') {
    return text.preview.states.public;
  }

  return text.preview.states.off;
}

export default function AdminWorkspace({
  locale,
  adminProfile,
  articleFeatureStage,
}: AdminWorkspaceProps) {
  const text = getAdminWorkspaceText(locale);
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: () => removeToken({ blockSilentRefresh: true }),
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
    skipTokenValidation: true,
  });

  const onLogout = () => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  };

  const articleLinksAvailable = articleFeatureStage !== 'off';
  const articleFeedHref = buildLocalizedArticleFeedPath(locale);
  const articleWorkspaceHref = buildLocalizedArticlePrivateListPath(locale);
  const articleEditorHref = buildLocalizedArticleEditorCreatePath(locale);
  const adminUsersHref = buildLocalizedAdminUsersPath(locale);

  return (
    <AppShell
      hasToken={token !== null}
      authStatus={authSession.status}
      onLogout={onLogout}
    >
      <div className="grid gap-4 md:gap-5">
        <Panel className="overflow-hidden rounded-[2rem] border border-(--border-subtle) bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_40%),linear-gradient(180deg,rgba(8,15,31,0.94),rgba(8,15,31,0.88))]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-100">
                {text.badge}
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                  {text.title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-200/82 md:text-base">
                  {text.description}
                </p>
              </div>
            </div>

            <div className="min-w-52 rounded-[1.5rem] border border-white/10 bg-black/24 px-4 py-4 text-sm text-slate-100">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300/80">
                {text.preview.featureStateLabel}
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                {resolveArticleFeatureStageLabel(articleFeatureStage, text)}
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Panel className="rounded-[2rem]">
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">
                  {text.session.title}
                </h2>
                <p className="text-sm leading-7 text-(--text-muted)">{text.session.description}</p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.session.name}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-(--text-strong)">
                    {adminProfile.name}
                  </dd>
                </div>
                <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.session.email}
                  </dt>
                  <dd className="mt-2 break-all text-sm font-semibold text-(--text-strong)">
                    {adminProfile.email}
                  </dd>
                </div>
                <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.session.role}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-(--text-strong)">
                    {adminProfile.role}
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>

          <Panel className="rounded-[2rem]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">
                  {text.security.title}
                </h2>
                <p className="text-sm leading-7 text-(--text-muted)">{text.security.description}</p>
              </div>
              <div className="rounded-[1.4rem] border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-amber-50">
                <p>{text.management.placeholder}</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="rounded-[2rem]">
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">
                  {text.preview.title}
                </h2>
                <p className="text-sm leading-7 text-(--text-muted)">{text.preview.description}</p>
              </div>

              {articleLinksAvailable ? (
                <div className="flex flex-wrap gap-3">
                  <LinkButton href={articleFeedHref} variant="secondary" size="sm" className="rounded-full px-4">
                    {text.preview.openFeed}
                  </LinkButton>
                  <LinkButton href={articleWorkspaceHref} variant="secondary" size="sm" className="rounded-full px-4">
                    {text.preview.openWorkspace}
                  </LinkButton>
                  <LinkButton href={articleEditorHref} variant="ghost" size="sm" className="rounded-full px-4">
                    {text.preview.createDraft}
                  </LinkButton>
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                  {text.preview.unavailable}
                </div>
              )}
            </div>
          </Panel>

          <Panel className="rounded-[2rem]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">
                  {text.management.title}
                </h2>
                <p className="text-sm leading-7 text-(--text-muted)">{text.management.description}</p>
              </div>

              <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                <p className="text-sm leading-7 text-(--text-muted)">{text.management.placeholder}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                  {adminUsersHref}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
