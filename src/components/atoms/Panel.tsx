import { memo } from 'react';

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

function Panel({ children, className = '' }: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export default memo(Panel);
