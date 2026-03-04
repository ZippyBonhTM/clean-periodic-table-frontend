import { memo } from 'react';

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

function Panel({ children, className = '' }: PanelProps) {
  return (
    <section
      className={`surface-panel rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export default memo(Panel);
