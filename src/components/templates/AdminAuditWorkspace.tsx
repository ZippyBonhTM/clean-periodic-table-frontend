'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import { createAdminApi } from '@/shared/api/adminApi';
import { ApiError } from '@/shared/api/httpClient';
import { useAdminClientSession } from '@/shared/admin/adminClientSession';
import {
  buildLocalizedAdminAuditBrowsePath,
} from '@/shared/admin/adminRouting';
import {
  appendAdminAuditPageStack,
  flattenAdminAuditPageStack,
  replaceAdminAuditPageStack,
  resolveAdminAuditPreviousCursor,
  resolveNextAdminAuditBrowseState,
  type AdminAuditBrowseStateUpdate,
  type AdminAuditPageEntry,
} from '@/shared/admin/adminAuditBrowseState';
import {
  type AdminAuditActionFilter,
  type AdminAuditBrowseFilters,
} from '@/shared/admin/adminAuditFilters';
import {
  formatAdminDateTime,
  resolveAdminAuditActionClass,
} from '@/shared/admin/adminPresentation';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AdminAuditEntry, AdminCursorPage } from '@/shared/types/admin';

type AdminAuditWorkspaceProps = {
  locale: AppLocale;
  initialFilters: AdminAuditBrowseFilters;
};

type AuditRequestStatus = 'idle' | 'loading' | 'success' | 'error';
type AuditPaginationMode = 'reset' | 'append';

const AUDIT_PAGE_SIZE = 20;
const FORM_CONTROL_CLASS = 'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)]';

function buildEmptyAuditPage(): AdminCursorPage<AdminAuditEntry> {
  return {
    items: [],
    nextCursor: null,
    prevCursor: null,
  };
}

export default function AdminAuditWorkspace({ locale, initialFilters }: AdminAuditWorkspaceProps) {
  const router = useRouter();
  const text = getAdminWorkspaceText(locale);
  const adminApi = useMemo(() => createAdminApi(), []);
  const { token, authStatus, isHydrated } = useAdminClientSession();
  const [activeAction, setActiveAction] = useState<AdminAuditActionFilter>(initialFilters.action);
  const [draftAction, setDraftAction] = useState<AdminAuditActionFilter>(initialFilters.action);
  const [activeQuery, setActiveQuery] = useState(initialFilters.query);
  const [activeCursor, setActiveCursor] = useState(initialFilters.cursor);
  const [searchInput, setSearchInput] = useState(initialFilters.query ?? '');
  const [requestStatus, setRequestStatus] = useState<AuditRequestStatus>('idle');
  const [auditPages, setAuditPages] = useState<AdminAuditPageEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const paginationModeRef = useRef<AuditPaginationMode>('reset');
  const skipNextFetchRef = useRef(false);

  const syncBrowseState = useCallback(
    (nextState: AdminAuditBrowseStateUpdate & { searchInputValue?: string; paginationMode?: AuditPaginationMode }) => {
      const nextBrowseState = resolveNextAdminAuditBrowseState(
        {
          action: activeAction,
          query: activeQuery,
          cursor: activeCursor,
        },
        nextState,
      );

      setActiveAction(nextBrowseState.action);
      setActiveQuery(nextBrowseState.query);
      setActiveCursor(nextBrowseState.cursor);
      setRequestStatus('loading');
      setErrorMessage(null);
      paginationModeRef.current = nextState.paginationMode ?? 'reset';

      if ((nextState.paginationMode ?? 'reset') === 'reset') {
        setAuditPages([]);
      }

      if (nextState.searchInputValue !== undefined) {
        setSearchInput(nextState.searchInputValue);
      }

      router.replace(
        buildLocalizedAdminAuditBrowsePath(locale, {
          action: nextBrowseState.action,
          query: nextBrowseState.query,
          cursor: nextBrowseState.cursor,
        }),
      );
    },
    [activeAction, activeCursor, activeQuery, locale, router],
  );

  useEffect(() => {
    if (!isHydrated || authStatus === 'checking' || token === null) {
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const abortController = new AbortController();

    void adminApi
      .listAudit({
        token,
        signal: abortController.signal,
        limit: AUDIT_PAGE_SIZE,
        cursor: activeCursor,
        query: activeQuery,
        action: activeAction === 'all' ? null : activeAction,
      })
      .then((nextPage) => {
        setAuditPages((currentPages) =>
          paginationModeRef.current === 'append'
            ? appendAdminAuditPageStack(currentPages, activeCursor, nextPage)
            : replaceAdminAuditPageStack(activeCursor, nextPage),
        );
        setRequestStatus('success');
        paginationModeRef.current = 'reset';
      })
      .catch((caughtError: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAuditPages([]);
        setRequestStatus('error');

        if (
          caughtError instanceof ApiError &&
          (caughtError.statusCode === 404 ||
            caughtError.statusCode === 500 ||
            caughtError.statusCode === 502)
        ) {
          setErrorMessage(text.audit.unavailable);
          return;
        }

        if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
          setErrorMessage(caughtError.message);
          return;
        }

        setErrorMessage(text.audit.unavailable);
      });

    return () => {
      abortController.abort();
    };
  }, [activeAction, activeCursor, activeQuery, adminApi, authStatus, isHydrated, text.audit.unavailable, token]);

  const onSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalizedQuery = searchInput.trim().replace(/\s+/g, ' ');
      syncBrowseState({
        action: draftAction,
        query: normalizedQuery.length > 0 ? normalizedQuery : null,
        cursor: null,
        searchInputValue: searchInput,
        paginationMode: 'reset',
      });
    },
    [draftAction, searchInput, syncBrowseState],
  );

  const onClearFilters = useCallback(() => {
    setDraftAction('all');
    syncBrowseState({
      action: 'all',
      query: null,
      cursor: null,
      searchInputValue: '',
      paginationMode: 'reset',
    });
  }, [syncBrowseState]);

  const onNextPage = useCallback(
    (nextCursor: string) => {
      syncBrowseState({
        cursor: nextCursor,
        paginationMode: 'append',
      });
    },
    [syncBrowseState],
  );

  const onPreviousPage = useCallback(() => {
    setAuditPages((currentPages) => {
      if (currentPages.length < 2) {
        return currentPages;
      }

      const nextPages = currentPages.slice(0, -1);
      const previousCursor = nextPages[nextPages.length - 1]?.requestCursor ?? null;

      skipNextFetchRef.current = true;
      paginationModeRef.current = 'reset';
      setActiveCursor(previousCursor);
      setRequestStatus('success');
      setErrorMessage(null);
      router.replace(
        buildLocalizedAdminAuditBrowsePath(locale, {
          action: activeAction,
          query: activeQuery,
          cursor: previousCursor,
        }),
      );

      return nextPages;
    });
  }, [activeAction, activeQuery, locale, router]);

  const hasActiveFilters = activeAction !== 'all' || activeQuery !== null;
  const normalizedSearchInput = searchInput.trim().replace(/\s+/g, ' ');
  const hasPendingDraftChanges =
    draftAction !== activeAction ||
    (normalizedSearchInput.length > 0 ? normalizedSearchInput : null) !== activeQuery;
  const visibleAuditEntries = useMemo(
    () => flattenAdminAuditPageStack(auditPages),
    [auditPages],
  );
  const currentAuditPage = auditPages[auditPages.length - 1]?.page ?? buildEmptyAuditPage();
  const previousCursor = useMemo(
    () => resolveAdminAuditPreviousCursor(auditPages),
    [auditPages],
  );

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="grid gap-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.sections.audit.title}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.audit.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.audit.summaryCards.visible}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{visibleAuditEntries.length}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.audit.summaryCards.filtered}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-(--text-strong)">{activeAction === 'all' ? text.audit.actionFilters.all : text.audit.actionFilters[activeAction]}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="rounded-[2rem]">
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.audit.listTitle}</h3>
            <p className="text-sm leading-7 text-(--text-muted)">{text.audit.listDescription}</p>
          </div>

          <form onSubmit={onSearchSubmit} className="grid gap-4 rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)_auto_auto] lg:items-end">
            <div>
              <label htmlFor="admin-audit-search" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                {text.audit.searchLabel}
              </label>
              <div className="mt-3">
                <Input
                  id="admin-audit-search"
                  name="adminAuditSearch"
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder={text.audit.searchPlaceholder}
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-audit-action" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                {text.audit.actionFilterLabel}
              </label>
              <select
                id="admin-audit-action"
                value={draftAction}
                onChange={(event) => setDraftAction(event.target.value as AdminAuditActionFilter)}
                className={`${FORM_CONTROL_CLASS} mt-3`}
              >
                <option value="all">{text.audit.actionFilters.all}</option>
                <option value="role_change">{text.audit.actionFilters.role_change}</option>
                <option value="moderation">{text.audit.actionFilters.moderation}</option>
                <option value="session_revoke">{text.audit.actionFilters.session_revoke}</option>
                <option value="directory_sync">{text.audit.actionFilters.directory_sync}</option>
                <option value="access_check">{text.audit.actionFilters.access_check}</option>
              </select>
            </div>
            <Button type="submit" variant="secondary" size="lg" className="rounded-xl px-4">
              {text.audit.applyFilters}
            </Button>
            <Button type="button" variant="ghost" size="lg" className="rounded-xl px-4" onClick={onClearFilters}>
              {text.audit.clearFilters}
            </Button>
          </form>

          {!isHydrated || authStatus === 'checking' || token === null || requestStatus === 'loading' ? (
            <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
              {text.common.loading}
            </div>
          ) : requestStatus === 'error' ? (
            <div className="rounded-[1.35rem] border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
              {errorMessage ?? text.audit.unavailable}
            </div>
          ) : visibleAuditEntries.length > 0 ? (
            <div className="grid gap-3">
              {visibleAuditEntries.map((entry) => (
                <article key={entry.id} className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveAdminAuditActionClass(entry.action)}`}>
                          {text.audit.actionFilters[entry.action as keyof typeof text.audit.actionFilters] ?? entry.action}
                        </span>
                      </div>
                      <h4 className="text-base font-black tracking-[-0.02em] text-(--text-strong)">{entry.summary}</h4>
                    </div>
                    <p className="text-xs text-(--text-muted)">{formatAdminDateTime(locale, entry.occurredAt)}</p>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.audit.actorLabel}</dt>
                      <dd className="mt-1 text-sm text-(--text-strong)">{entry.actor.email ?? entry.actor.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.audit.targetLabel}</dt>
                      <dd className="mt-1 text-sm text-(--text-strong)">{entry.target?.email ?? entry.target?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.audit.ipLabel}</dt>
                      <dd className="mt-1 text-sm text-(--text-strong)">{entry.ipAddress ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.audit.occurredAtLabel}</dt>
                      <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, entry.occurredAt)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
              {hasActiveFilters ? text.audit.emptyFiltered : text.audit.empty}
            </div>
          )}

          {requestStatus === 'success' && (previousCursor !== null || currentAuditPage.nextCursor !== null) ? (
            <div className="flex flex-wrap gap-3 border-t border-(--border-subtle) pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-4"
                disabled={previousCursor === null || hasPendingDraftChanges}
                onClick={onPreviousPage}
              >
                {text.audit.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full px-4"
                disabled={currentAuditPage.nextCursor === null || hasPendingDraftChanges}
                onClick={() => {
                  if (currentAuditPage.nextCursor !== null) {
                    onNextPage(currentAuditPage.nextCursor);
                  }
                }}
              >
                {text.audit.pagination.next}
              </Button>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
