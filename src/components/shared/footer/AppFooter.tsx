import { memo } from 'react';

function AppFooter() {
  return (
    <footer className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-500 shadow-sm">
      Auth API + Elements API connected with client-side token flow.
    </footer>
  );
}

export default memo(AppFooter);
