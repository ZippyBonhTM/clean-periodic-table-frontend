'use client';

import Link from 'next/link';
import { useCallback } from 'react';

import AppShell from '@/components/templates/AppShell';
import ElementsGrid from '@/components/organisms/elements/ElementsGrid';
import ElementsState from '@/components/organisms/elements/ElementsState';
import useAuthToken from '@/shared/hooks/useAuthToken';
import useElements from '@/shared/hooks/useElements';

export default function HomePage() {
  const { token, isHydrated, removeToken } = useAuthToken();
  const { data, isLoading, error } = useElements(token);

  const onLogout = useCallback(() => {
    removeToken();
  }, [removeToken]);

  return (
    <AppShell hasToken={token !== null} onLogout={onLogout}>
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Data Source</p>
          <h2 className="text-2xl font-bold text-slate-900">Periodic Table Elements</h2>
          <p className="mt-1 text-sm text-slate-600">
            Client-side rendering is active. This page requests `GET /elements` from the backend using your bearer token.
          </p>
        </div>

        {!isHydrated ? (
          <ElementsState tone="info" message="Loading local session..." />
        ) : token === null ? (
          <ElementsState
            tone="info"
            message="You are not authenticated. Go to login and sign in to load elements from backend API."
          />
        ) : isLoading ? (
          <ElementsState tone="info" message="Loading elements from backend..." />
        ) : error !== null ? (
          <ElementsState tone="error" message={error} />
        ) : (
          <ElementsGrid elements={data} />
        )}

        <div className="text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900">
            Go to login page
          </Link>
          {' · '}
          <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-900">
            Go to register page
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
