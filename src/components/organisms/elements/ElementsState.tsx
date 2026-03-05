import { memo } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';

type ElementsStateProps = {
  message: string;
  tone: 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  showProgress?: boolean;
};

function ElementsState({
  message,
  tone,
  actionLabel,
  onAction,
  showProgress = false,
}: ElementsStateProps) {
  return (
    <Panel className="space-y-3">
      <p className={`text-sm ${tone === 'error' ? 'text-rose-200' : 'text-[var(--text-muted)]'}`}>{message}</p>
      {showProgress && tone === 'info' ? (
        <div
          aria-hidden="true"
          className="h-2 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]"
        >
          <div className="elements-loading-bar h-full w-2/5 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong),var(--accent))]" />
        </div>
      ) : null}
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Panel>
  );
}

export default memo(ElementsState);
