import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type AccessRow = {
  surface: string;
  access: string;
  guard: string;
  visibility: string;
};

type AdminAccessWorkspaceProps = {
  locale: AppLocale;
  articleFeatureStage: ArticleFeatureStage;
};

function buildRouteMatrix(
  featureStage: ArticleFeatureStage,
  text: ReturnType<typeof getAdminWorkspaceText>,
): AccessRow[] {
  const articleAccess =
    featureStage === 'internal'
      ? text.access.accessRules.articleInternal
      : featureStage === 'public'
        ? text.access.accessRules.articlePublic
        : text.access.accessRules.unavailable;
  const articleGuard =
    featureStage === 'off'
      ? text.access.states.disabled
      : featureStage === 'internal'
        ? `${text.access.states.featureStage} + ${text.access.states.serverAdmin}`
        : text.access.states.featureStage;
  const articleVisibility =
    featureStage === 'public' ? text.access.states.publicWhenReleased : text.access.states.noindex;

  return [
    {
      surface: '/[locale]/admin',
      access: text.access.accessRules.adminOnly,
      guard: text.access.states.serverAdmin,
      visibility: text.access.states.noindex,
    },
    {
      surface: '/[locale]/admin/users',
      access: text.access.accessRules.adminOnly,
      guard: text.access.states.serverAdmin,
      visibility: text.access.states.noindex,
    },
    {
      surface: '/[locale]/admin/users/[userId]',
      access: text.access.accessRules.adminOnly,
      guard: text.access.states.serverAdmin,
      visibility: text.access.states.noindex,
    },
    {
      surface: '/[locale]/admin/audit',
      access: text.access.accessRules.adminOnly,
      guard: text.access.states.serverAdmin,
      visibility: text.access.states.noindex,
    },
    {
      surface: '/[locale]/admin/access',
      access: text.access.accessRules.adminOnly,
      guard: text.access.states.serverAdmin,
      visibility: text.access.states.noindex,
    },
    {
      surface: '/[locale]/admin/content',
      access: text.access.accessRules.adminOnly,
      guard: text.access.states.serverAdmin,
      visibility: text.access.states.noindex,
    },
    {
      surface: '/[locale]/articles*',
      access: articleAccess,
      guard: articleGuard,
      visibility: articleVisibility,
    },
    {
      surface: '/[locale]/me/articles*',
      access: articleAccess,
      guard: articleGuard,
      visibility: text.access.states.noindex,
    },
  ];
}

export default function AdminAccessWorkspace({
  locale,
  articleFeatureStage,
}: AdminAccessWorkspaceProps) {
  const text = getAdminWorkspaceText(locale);
  const routeMatrix = buildRouteMatrix(articleFeatureStage, text);

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.sections.access.title}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.access.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.access.summaryTitle}</p>
              <p className="mt-2 text-sm leading-7 text-(--text-strong)">{text.access.summaryDescription}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.guard}</p>
              <p className="mt-2 text-sm font-semibold text-(--text-strong)">{text.access.states.serverAdmin}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.visibility}</p>
              <p className="mt-2 text-sm font-semibold text-(--text-strong)">{text.access.states.noindex}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="rounded-[2rem] overflow-hidden">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.access.matrixTitle}</h3>
            <p className="text-sm leading-7 text-(--text-muted)">{text.access.matrixDescription}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.surface}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.access}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.guard}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.visibility}</th>
                </tr>
              </thead>
              <tbody>
                {routeMatrix.map((row) => (
                  <tr key={row.surface} className="rounded-[1.25rem] bg-[var(--surface-2)] text-sm text-(--text-strong)">
                    <td className="rounded-l-[1.25rem] px-3 py-3 font-semibold">{row.surface}</td>
                    <td className="px-3 py-3">{row.access}</td>
                    <td className="px-3 py-3">{row.guard}</td>
                    <td className="rounded-r-[1.25rem] px-3 py-3">{row.visibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
    </div>
  );
}
