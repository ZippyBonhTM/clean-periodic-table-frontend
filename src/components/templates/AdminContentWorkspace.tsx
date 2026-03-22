import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import {
  buildLocalizedArticleEditorCreatePath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListPath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type AdminContentWorkspaceProps = {
  locale: AppLocale;
  articleFeatureStage: ArticleFeatureStage;
};

export default function AdminContentWorkspace({
  locale,
  articleFeatureStage,
}: AdminContentWorkspaceProps) {
  const text = getAdminWorkspaceText(locale);
  const articleLinksAvailable = articleFeatureStage !== 'off';

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.sections.content.title}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.content.description}</p>
          </div>

          <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-strong)">
            {text.content.operationsDescription}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-5">
        <Panel className="rounded-[2rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.content.operationsTitle}</h3>
              <p className="text-sm leading-7 text-(--text-muted)">{text.content.operationsDescription}</p>
            </div>

            {articleLinksAvailable ? (
              <div className="flex flex-wrap gap-3">
                <LinkButton href={buildLocalizedArticleFeedPath(locale)} variant="secondary" size="sm" className="rounded-full px-4">
                  {text.content.openFeed}
                </LinkButton>
                <LinkButton href={buildLocalizedArticlePrivateListPath(locale)} variant="secondary" size="sm" className="rounded-full px-4">
                  {text.content.openWorkspace}
                </LinkButton>
                <LinkButton href={buildLocalizedArticleEditorCreatePath(locale)} variant="ghost" size="sm" className="rounded-full px-4">
                  {text.content.openEditor}
                </LinkButton>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                {text.content.disabled}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="rounded-[2rem]">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.content.policyTitle}</h3>
              <p className="text-sm leading-7 text-(--text-muted)">{text.content.policyDescription}</p>
            </div>

            <div className="grid gap-3">
              {Object.values(text.content.policies).map((policy) => (
                <div key={policy} className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-strong)">
                  {policy}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
