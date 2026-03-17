'use client';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import {
  formatChemistryBalanceValidity,
} from '@/components/templates/chemistryBalanceText';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';

type ChemistryBalanceEnginePanelProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  canRetry: boolean;
  onRetry: () => void;
  remoteAnalysis: ChemistryBalanceRemoteAnalysisState;
};

function ChemistryBalanceEnginePanel({
  enabled,
  onToggle,
  canRetry,
  onRetry,
  remoteAnalysis,
}: ChemistryBalanceEnginePanelProps) {
  const { text } = useChemistryBalanceText();

  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {text.engine.eyebrow}
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            {text.engine.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {text.engine.description}
          </p>
        </div>

        <label className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {text.engine.toggleLabel}
        </label>
      </div>

      {enabled ? (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="md"
            disabled={!canRetry || remoteAnalysis.status === 'loading'}
            onClick={onRetry}
          >
            {text.engine.retry}
          </Button>
        </div>
      ) : null}

      {!enabled ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          {text.engine.off}
        </div>
      ) : remoteAnalysis.status === 'idle' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          {text.engine.idle}
        </div>
      ) : remoteAnalysis.status === 'loading' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          {text.engine.loadingPrefix} <code>{remoteAnalysis.input}</code>.
        </div>
      ) : remoteAnalysis.status === 'failed' ? (
        <div className="rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          <p className="font-semibold text-[var(--text-strong)]">
            {text.engine.failedTitle}
          </p>
          <p className="mt-2">
            <span className="font-semibold text-[var(--text-strong)]">{remoteAnalysis.error.code}</span>
            : {remoteAnalysis.error.message}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.engine.classificationLabel}
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {remoteAnalysis.value.classification ?? text.common.notAvailable}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.engine.scoreLabel}
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {remoteAnalysis.value.score ?? text.common.notAvailable}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.engine.validLabel}
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {formatChemistryBalanceValidity(text, remoteAnalysis.value.valid)}
              </p>
            </div>
          </div>

          {remoteAnalysis.value.notices.length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
              {remoteAnalysis.value.notices.map((notice, index) => (
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
              {text.engine.noNotices}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

export default ChemistryBalanceEnginePanel;
