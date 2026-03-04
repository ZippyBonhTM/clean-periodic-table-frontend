'use client';

import Link from 'next/link';
import { memo } from 'react';

import Button from '@/components/atoms/Button';
import TokenStatus from '@/components/molecules/TokenStatus';

type AppHeaderProps = {
  hasToken: boolean;
  onLogout?: () => void;
};

function AppHeader({ hasToken, onLogout }: AppHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Clean Periodic Table</p>
          <h1 className="text-xl font-bold text-slate-900">Chemical Explorer</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TokenStatus hasToken={hasToken} />
          <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            Elements
          </Link>
          <Link href="/login" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            Login
          </Link>
          {hasToken && onLogout !== undefined ? (
            <Button variant="ghost" onClick={onLogout}>
              Logout
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default memo(AppHeader);
