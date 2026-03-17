'use client';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import type { EquationBalanceHistoryEntry } from '@/components/templates/useEquationBalanceHistory';

type ChemistryBalanceHistoryPanelProps = {
  entries: EquationBalanceHistoryEntry[];
  onSelect: (input: string) => void;
  onClear: () => void;
};

function formatHistoryStatus(status: EquationBalanceHistoryEntry['status']): string {
  if (status === 'balanced') {
    return 'Balanced';
  }

  return status;
}

function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Recent';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ChemistryBalanceHistoryPanel({
  entries,
  onSelect,
  onClear,
}: ChemistryBalanceHistoryPanelProps) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            History
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            Recent Equations
          </h2>
        </div>

        {entries.length > 0 ? (
          <Button variant="ghost" onClick={onClear}>
            Clear history
          </Button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          Recent equations will appear here after you balance them locally.
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={`${entry.input}-${entry.savedAt}`}>
              <button
                type="button"
                onClick={() => onSelect(entry.input)}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-overlay-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="break-words text-sm font-semibold text-[var(--text-strong)]">
                    {entry.input}
                  </p>
                  <span className="shrink-0 rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {formatHistoryStatus(entry.status)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
                  {entry.summary}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {formatSavedAt(entry.savedAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default ChemistryBalanceHistoryPanel;
