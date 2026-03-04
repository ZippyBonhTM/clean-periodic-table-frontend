import { memo } from 'react';

import Panel from '@/components/atoms/Panel';

type ElementsStateProps = {
  message: string;
  tone: 'info' | 'error';
};

function ElementsState({ message, tone }: ElementsStateProps) {
  return (
    <Panel>
      <p className={`text-sm ${tone === 'error' ? 'text-rose-700' : 'text-slate-700'}`}>{message}</p>
    </Panel>
  );
}

export default memo(ElementsState);
