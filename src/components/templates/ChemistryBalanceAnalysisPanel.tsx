'use client';

import Panel from '@/components/atoms/Panel';
import {
  formatChemistryBalanceReactionType,
  getChemistryBalanceMetadataMessage,
} from '@/components/templates/chemistryBalanceText';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';

type ChemistryBalanceAnalysisPanelProps = {
  analysis: BalancedReactionAnalysis | null;
  metadataStatus: 'inactive' | 'loading' | 'ready' | 'unavailable';
};

function resolveScoreTone(score: number): string {
  if (score >= 80) {
    return 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)]';
  }

  if (score >= 60) {
    return 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)]';
  }

  return 'border-[rgba(244,63,94,0.45)] bg-[rgba(244,63,94,0.14)]';
}
function ChemistryBalanceAnalysisPanel({
  analysis,
  metadataStatus,
}: ChemistryBalanceAnalysisPanelProps) {
  const { text } = useChemistryBalanceText();

  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {text.analysis.eyebrow}
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          {text.analysis.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          {getChemistryBalanceMetadataMessage(text, metadataStatus)}
        </p>
      </div>

      {analysis === null ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          {text.analysis.noResult}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.analysis.typeLabel}
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {formatChemistryBalanceReactionType(text, analysis.reactionType)}
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 ${resolveScoreTone(analysis.score)}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.analysis.scoreLabel}
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">{analysis.score}/100</p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.analysis.plausibilityLabel}
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {analysis.likelyPlausible
                  ? text.analysis.plausible
                  : text.analysis.needsReview}
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
                    {text.common.warnings[notice.level]}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-strong)]">{notice.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
              {text.analysis.noNotices}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export default ChemistryBalanceAnalysisPanel;
