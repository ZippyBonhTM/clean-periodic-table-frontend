'use client';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import type { ChemicalEngineReactionAnalysis } from '@/shared/chemistry/engine';

type RemoteAnalysisState =
  | {
      status: 'idle';
    }
  | {
      status: 'loading';
      input: string;
    }
  | {
      status: 'available';
      input: string;
      value: ChemicalEngineReactionAnalysis;
    }
  | {
      status: 'failed';
      input: string;
      error: {
        code: string;
        message: string;
      };
    };

type ChemistryBalanceEnginePanelProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  canRetry: boolean;
  onRetry: () => void;
  remoteAnalysis: RemoteAnalysisState;
};

function ChemistryBalanceEnginePanel({
  enabled,
  onToggle,
  canRetry,
  onRetry,
  remoteAnalysis,
}: ChemistryBalanceEnginePanelProps) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Optional Engine
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            Remote Enrichment
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Local balance and heuristics stay primary. This optional step asks the backend Chemical
            Engine for extra validation when enabled.
          </p>
        </div>

        <label className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Remote
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
            Retry remote check
          </Button>
        </div>
      ) : null}

      {!enabled ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          Remote enrichment is currently off. The page is using client-only chemistry.
        </div>
      ) : remoteAnalysis.status === 'idle' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          Remote enrichment will run the next time a balanced equation is submitted.
        </div>
      ) : remoteAnalysis.status === 'loading' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          Asking the optional Chemical Engine to enrich <code>{remoteAnalysis.input}</code>.
        </div>
      ) : remoteAnalysis.status === 'failed' ? (
        <div className="rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          <p className="font-semibold text-[var(--text-strong)]">
            Remote enrichment did not complete.
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
                Classification
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {remoteAnalysis.value.classification ?? 'N/A'}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Score
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {remoteAnalysis.value.score ?? 'N/A'}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Valid
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {remoteAnalysis.value.valid === null
                  ? 'Unknown'
                  : remoteAnalysis.value.valid
                    ? 'Yes'
                    : 'No'}
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
                    {notice.level}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-strong)]">{notice.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
              The optional Chemical Engine returned no additional notices for this equation.
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

export default ChemistryBalanceEnginePanel;
