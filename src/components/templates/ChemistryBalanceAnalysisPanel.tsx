'use client';

import Panel from '@/components/atoms/Panel';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';

type ChemistryBalanceAnalysisPanelProps = {
  analysis: BalancedReactionAnalysis | null;
  metadataStatus: 'inactive' | 'loading' | 'ready' | 'unavailable';
};

function formatReactionTypeLabel(reactionType: BalancedReactionAnalysis['reactionType']): string {
  return reactionType
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveScoreTone(score: number): string {
  if (score >= 80) {
    return 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)]';
  }

  if (score >= 60) {
    return 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)]';
  }

  return 'border-[rgba(244,63,94,0.45)] bg-[rgba(244,63,94,0.14)]';
}

function resolveMetadataMessage(metadataStatus: ChemistryBalanceAnalysisPanelProps['metadataStatus']): string {
  switch (metadataStatus) {
    case 'loading':
      return 'Loading Element DB metadata to enrich heuristics.';
    case 'ready':
      return 'Heuristics are enriched with Element DB metadata.';
    case 'unavailable':
      return 'Element DB metadata is unavailable right now. Using local heuristics only.';
    case 'inactive':
    default:
      return 'Local heuristics are active. Login enables Element DB enrichment when available.';
  }
}

function ChemistryBalanceAnalysisPanel({
  analysis,
  metadataStatus,
}: ChemistryBalanceAnalysisPanelProps) {
  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Heuristics
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          Reaction Analysis
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          {resolveMetadataMessage(metadataStatus)}
        </p>
      </div>

      {analysis === null ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          Heuristic analysis runs after the equation is parsed and balanced successfully.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Type
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {formatReactionTypeLabel(analysis.reactionType)}
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 ${resolveScoreTone(analysis.score)}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Score
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">{analysis.score}/100</p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Plausibility
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {analysis.likelyPlausible ? 'Likely plausible' : 'Needs review'}
              </p>
            </div>
          </div>

          {analysis.notices.length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
              {analysis.notices.map((notice, index) => (
                <li
                  key={`${notice.code}-${index}`}
                  className={`rounded-2xl border px-4 py-3 ${
                    notice.level === 'warning'
                      ? 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)]'
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {notice.level}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-strong)]">{notice.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
              No heuristic notices were raised for this balanced reaction.
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export default ChemistryBalanceAnalysisPanel;
