import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import {
  buildLocalizedAdminAccessPath,
  buildLocalizedAdminAuditPath,
  buildLocalizedAdminContentPath,
  buildLocalizedAdminUsersPath,
} from '@/shared/admin/adminRouting';
import {
  buildLocalizedArticleEditorCreatePath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListPath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ADMIN_AREA_COUNT = 5;
const PROTECTED_ROUTE_COUNT = 11;

type AdminOverviewWorkspaceProps = {
  locale: AppLocale;
  articleFeatureStage: ArticleFeatureStage;
};

function resolveStageLabel(
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

export default function AdminOverviewWorkspace({
  locale,
  articleFeatureStage,
}: AdminOverviewWorkspaceProps) {
  const text = getAdminWorkspaceText(locale);
  const articleLinksAvailable = articleFeatureStage !== 'off';

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">
              {text.sections.overview.title}
            </h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.overview.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.overview.cards.adminAreas}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{ADMIN_AREA_COUNT}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.overview.cards.protectedRoutes}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{PROTECTED_ROUTE_COUNT}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.overview.cards.articleMode}</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-(--text-strong)">{resolveStageLabel(articleFeatureStage, text)}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.overview.cards.authSource}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-(--text-strong)">{text.overview.authSourceValue}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-5">
        <Panel className="rounded-[2rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.overview.quickActionsTitle}</h3>
              <p className="text-sm leading-7 text-(--text-muted)">{text.overview.quickActionsDescription}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LinkButton href={buildLocalizedAdminUsersPath(locale)} variant="secondary" size="sm" className="rounded-full px-4" documentNavigation>
                {text.overview.openUsers}
              </LinkButton>
              <LinkButton href={buildLocalizedAdminAuditPath(locale)} variant="secondary" size="sm" className="rounded-full px-4" documentNavigation>
                {text.overview.openAudit}
              </LinkButton>
              <LinkButton href={buildLocalizedAdminAccessPath(locale)} variant="secondary" size="sm" className="rounded-full px-4" documentNavigation>
                {text.overview.openAccess}
              </LinkButton>
              <LinkButton href={buildLocalizedAdminContentPath(locale)} variant="ghost" size="sm" className="rounded-full px-4" documentNavigation>
                {text.overview.openContent}
              </LinkButton>
            </div>

            {articleLinksAvailable ? (
              <div className="flex flex-wrap gap-3 border-t border-(--border-subtle) pt-4">
                <LinkButton href={buildLocalizedArticleFeedPath(locale)} variant="secondary" size="sm" className="rounded-full px-4" documentNavigation>
                  {text.overview.openArticleFeed}
                </LinkButton>
                <LinkButton href={buildLocalizedArticlePrivateListPath(locale)} variant="secondary" size="sm" className="rounded-full px-4" documentNavigation>
                  {text.overview.openArticleWorkspace}
                </LinkButton>
                <LinkButton href={buildLocalizedArticleEditorCreatePath(locale)} variant="ghost" size="sm" className="rounded-full px-4" documentNavigation>
                  {text.overview.openArticleEditor}
                </LinkButton>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                {text.overview.articleUnavailable}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="rounded-[2rem]">
          <div className="space-y-3">
            <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.overview.readinessTitle}</h3>
            <p className="text-sm leading-7 text-(--text-muted)">{text.overview.readinessDescription}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
