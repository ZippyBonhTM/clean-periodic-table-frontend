import { memo } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';

type ElementsStateProps = {
  message: string;
  tone: 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
};

function ElementsState({ message, tone, actionLabel, onAction }: ElementsStateProps) {
  return (
    <Panel className="space-y-3">
      <p className={`text-sm ${tone === 'error' ? 'text-rose-200' : 'text-[var(--text-muted)]'}`}>{message}</p>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Panel>
  );
}

export default memo(ElementsState);
