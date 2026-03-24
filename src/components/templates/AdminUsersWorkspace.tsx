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
  buildLocalizedAdminUserDetailPath,
  buildLocalizedAdminUsersBrowsePath,
} from '@/shared/admin/adminRouting';
import {
  appendAdminUsersPageStack,
  areAdminUsersBrowseFiltersEqual,
  flattenAdminUsersPageStack,
  replaceAdminUsersPageStack,
  resolveAdminUsersPreviousCursor,
  resolveNextAdminUsersBrowseState,
  type AdminUsersDirectoryPageEntry,
  type AdminUsersBrowseStateUpdate,
} from '@/shared/admin/adminUsersBrowseState';
import {
  type AdminUsersBrowseFilters,
  type AdminUsersRoleFilter,
  type AdminUsersSort,
  type AdminUsersStatusFilter,
  type AdminUsersVersionFilter,
} from '@/shared/admin/adminUsersFilters';
import {
  formatAdminDateTime,
  resolveAdminUserStatusClass,
  resolveAdminUserVersionClass,
} from '@/shared/admin/adminPresentation';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AdminCursorPage, AdminDirectorySyncResult, AdminUserSummary } from '@/shared/types/admin';
import type { AuthUserProfile } from '@/shared/types/auth';

type AdminUsersWorkspaceProps = {
  locale: AppLocale;
  adminProfile: AuthUserProfile;
  initialFilters: AdminUsersBrowseFilters;
};

type DirectoryRequestStatus = 'idle' | 'loading' | 'success' | 'error';
type DirectorySyncStatus = 'idle' | 'loading' | 'success' | 'error';
type DirectoryPaginationMode = 'reset' | 'append';

const DIRECTORY_PAGE_SIZE = 12;
const DIRECTORY_SYNC_PAGE_SIZE = 25;
const FORM_CONTROL_CLASS = 'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)]';

function buildEmptyDirectory(): AdminCursorPage<AdminUserSummary> {
  return {
    items: [],
    nextCursor: null,
    prevCursor: null,
  };
}

export default function AdminUsersWorkspace({
  locale,
  adminProfile,
  initialFilters,
}: AdminUsersWorkspaceProps) {
  const router = useRouter();
  const text = getAdminWorkspaceText(locale);
  const adminApi = useMemo(() => createAdminApi(), []);
  const { token, authStatus, isHydrated } = useAdminClientSession();
  const [activeRole, setActiveRole] = useState<AdminUsersRoleFilter>(initialFilters.role);
  const [activeVersion, setActiveVersion] = useState<AdminUsersVersionFilter>(initialFilters.version);
  const [activeStatus, setActiveStatus] = useState<AdminUsersStatusFilter>(initialFilters.status);
  const [activeSort, setActiveSort] = useState<AdminUsersSort>(initialFilters.sort);
  const [draftRole, setDraftRole] = useState<AdminUsersRoleFilter>(initialFilters.role);
  const [draftVersion, setDraftVersion] = useState<AdminUsersVersionFilter>(initialFilters.version);
  const [draftStatus, setDraftStatus] = useState<AdminUsersStatusFilter>(initialFilters.status);
  const [draftSort, setDraftSort] = useState<AdminUsersSort>(initialFilters.sort);
  const [activeQuery, setActiveQuery] = useState(initialFilters.query);
  const [activeCursor, setActiveCursor] = useState(initialFilters.cursor);
  const [searchInput, setSearchInput] = useState(initialFilters.query ?? '');
  const [requestStatus, setRequestStatus] = useState<DirectoryRequestStatus>('idle');
  const [directoryPages, setDirectoryPages] = useState<AdminUsersDirectoryPageEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [syncCursor, setSyncCursor] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<DirectorySyncStatus>('idle');
  const [syncFeedback, setSyncFeedback] = useState<AdminDirectorySyncResult | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const paginationModeRef = useRef<DirectoryPaginationMode>('reset');
  const skipNextFetchRef = useRef(false);

  const syncBrowseState = useCallback(
    (nextState: AdminUsersBrowseStateUpdate & { searchInputValue?: string; paginationMode?: DirectoryPaginationMode }) => {
      const currentBrowseState = {
        role: activeRole,
        version: activeVersion,
        status: activeStatus,
        sort: activeSort,
        query: activeQuery,
        cursor: activeCursor,
      } satisfies AdminUsersBrowseFilters;
      const nextBrowseState = resolveNextAdminUsersBrowseState(
        currentBrowseState,
        nextState,
      );

      if (areAdminUsersBrowseFiltersEqual(currentBrowseState, nextBrowseState)) {
        if (nextState.searchInputValue !== undefined) {
          setSearchInput(nextState.searchInputValue);
        }

        return;
      }

      setActiveRole(nextBrowseState.role);
      setActiveVersion(nextBrowseState.version);
      setActiveStatus(nextBrowseState.status);
      setActiveSort(nextBrowseState.sort);
      setActiveQuery(nextBrowseState.query);
      setActiveCursor(nextBrowseState.cursor);
      setRequestStatus('loading');
      setErrorMessage(null);
      paginationModeRef.current = nextState.paginationMode ?? 'reset';

      if ((nextState.paginationMode ?? 'reset') === 'reset') {
        setDirectoryPages([]);
      }

      if (nextState.searchInputValue !== undefined) {
        setSearchInput(nextState.searchInputValue);
      }

      router.replace(
        buildLocalizedAdminUsersBrowsePath(locale, {
          role: nextBrowseState.role,
          version: nextBrowseState.version,
          status: nextBrowseState.status,
          sort: nextBrowseState.sort,
          query: nextBrowseState.query,
          cursor: nextBrowseState.cursor,
        }),
      );
    },
    [activeCursor, activeQuery, activeRole, activeSort, activeStatus, activeVersion, locale, router],
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
      .listUsers({
        token,
        signal: abortController.signal,
        limit: DIRECTORY_PAGE_SIZE,
        cursor: activeCursor,
        query: activeQuery,
        role: activeRole,
        version: activeVersion,
        status: activeStatus,
        sort: activeSort,
      })
      .then((nextPage) => {
        setDirectoryPages((currentPages) =>
          paginationModeRef.current === 'append'
            ? appendAdminUsersPageStack(currentPages, activeCursor, nextPage)
            : replaceAdminUsersPageStack(activeCursor, nextPage),
        );
        setRequestStatus('success');
        paginationModeRef.current = 'reset';
      })
      .catch((caughtError: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDirectoryPages([]);
        setRequestStatus('error');

        if (
          caughtError instanceof ApiError &&
          (caughtError.statusCode === 404 ||
            caughtError.statusCode === 500 ||
            caughtError.statusCode === 502)
        ) {
          setErrorMessage(text.users.unavailable);
          return;
        }

        if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
          setErrorMessage(caughtError.message);
          return;
        }

        setErrorMessage(text.users.unavailable);
      });

    return () => {
      abortController.abort();
    };
  }, [activeCursor, activeQuery, activeRole, activeSort, activeStatus, activeVersion, adminApi, authStatus, isHydrated, reloadKey, text.users.unavailable, token]);

  const onSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalizedQuery = searchInput.trim().replace(/\s+/g, ' ');
      syncBrowseState({
        role: draftRole,
        version: draftVersion,
        status: draftStatus,
        sort: draftSort,
        query: normalizedQuery.length > 0 ? normalizedQuery : null,
        cursor: null,
        searchInputValue: searchInput,
        paginationMode: 'reset',
      });
    },
    [draftRole, draftSort, draftStatus, draftVersion, searchInput, syncBrowseState],
  );

  const onClearFilters = useCallback(() => {
    setDraftRole('all');
    setDraftVersion('all');
    setDraftStatus('all');
    setDraftSort('created-desc');
    syncBrowseState({
      role: 'all',
      version: 'all',
      status: 'all',
      sort: 'created-desc',
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
    setDirectoryPages((currentPages) => {
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
        buildLocalizedAdminUsersBrowsePath(locale, {
          role: activeRole,
          version: activeVersion,
          status: activeStatus,
          sort: activeSort,
          query: activeQuery,
          cursor: previousCursor,
        }),
      );

      return nextPages;
    });
  }, [activeQuery, activeRole, activeSort, activeStatus, activeVersion, locale, router]);

  const visibleUsers = useMemo(
    () => flattenAdminUsersPageStack(directoryPages),
    [directoryPages],
  );
  const currentDirectoryPage = directoryPages[directoryPages.length - 1]?.page ?? buildEmptyDirectory();
  const previousCursor = useMemo(
    () => resolveAdminUsersPreviousCursor(directoryPages),
    [directoryPages],
  );

  const onSyncDirectory = useCallback(async () => {
    if (token === null) {
      return;
    }

    setSyncStatus('loading');
    setSyncErrorMessage(null);

    try {
      const result = await adminApi.syncUserDirectory({
        token,
        cursor: syncCursor,
        limit: DIRECTORY_SYNC_PAGE_SIZE,
      });

      setSyncFeedback(result);
      setSyncCursor(result.nextCursor);
      setSyncStatus('success');
      paginationModeRef.current = 'reset';
      setDirectoryPages([]);
      setActiveCursor(null);
      router.replace(
        buildLocalizedAdminUsersBrowsePath(locale, {
          role: activeRole,
          version: activeVersion,
          status: activeStatus,
          sort: activeSort,
          query: activeQuery,
          cursor: null,
        }),
      );
      setReloadKey((currentValue) => currentValue + 1);
    } catch (caughtError: unknown) {
      setSyncStatus('error');

      if (
        caughtError instanceof ApiError &&
        (caughtError.statusCode === 404 ||
          caughtError.statusCode === 500 ||
          caughtError.statusCode === 502 ||
          caughtError.statusCode === 503)
      ) {
        setSyncErrorMessage(text.users.syncUnavailable);
        return;
      }

      if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
        setSyncErrorMessage(caughtError.message);
        return;
      }

      setSyncErrorMessage(text.users.syncUnavailable);
    }
  }, [
    activeQuery,
    activeRole,
    activeSort,
    activeStatus,
    activeVersion,
    adminApi,
    locale,
    router,
    syncCursor,
    text.users.syncUnavailable,
    token,
  ]);

  const visibleAdminCount = useMemo(
    () => visibleUsers.filter((user) => user.role === 'ADMIN').length,
    [visibleUsers],
  );
  const visibleLegacyCount = useMemo(
    () => visibleUsers.filter((user) => user.accountVersion === 'legacy').length,
    [visibleUsers],
  );
  const visibleActiveCount = useMemo(
    () => visibleUsers.filter((user) => user.accountStatus === 'active').length,
    [visibleUsers],
  );
  const visibleRestrictedCount = useMemo(
    () => visibleUsers.filter((user) => user.accountStatus === 'restricted').length,
    [visibleUsers],
  );
  const hasActiveFilters =
    activeRole !== 'all' ||
    activeVersion !== 'all' ||
    activeStatus !== 'all' ||
    activeSort !== 'created-desc' ||
    activeQuery !== null;
  const normalizedSearchInput = searchInput.trim().replace(/\s+/g, ' ');
  const hasPendingDraftChanges =
    draftRole !== activeRole ||
    draftVersion !== activeVersion ||
    draftStatus !== activeStatus ||
    draftSort !== activeSort ||
    (normalizedSearchInput.length > 0 ? normalizedSearchInput : null) !== activeQuery;

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="grid gap-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.sections.users.title}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.users.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.visible}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{visibleUsers.length}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.admins}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{visibleAdminCount}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.legacy}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{visibleLegacyCount}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.active}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{visibleActiveCount}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.restricted}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{visibleRestrictedCount}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:gap-5">
        <Panel className="rounded-[2rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.tableTitle}</h3>
              <p className="text-sm leading-7 text-(--text-muted)">{text.users.tableDescription}</p>
            </div>

            <form onSubmit={onSearchSubmit} className="grid gap-4 rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.52fr)_minmax(180px,0.52fr)_minmax(180px,0.52fr)]">
                <div>
                  <label htmlFor="admin-user-search" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.users.searchLabel}
                  </label>
                  <div className="mt-3">
                    <Input
                      id="admin-user-search"
                      name="adminUserSearch"
                      value={searchInput}
                      onChange={setSearchInput}
                      placeholder={text.users.searchPlaceholder}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="admin-user-role" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.users.roleFilterLabel}
                  </label>
                  <select
                    id="admin-user-role"
                    value={draftRole}
                    onChange={(event) => setDraftRole(event.target.value as AdminUsersRoleFilter)}
                    className={`${FORM_CONTROL_CLASS} mt-3`}
                  >
                    <option value="all">{text.users.roleFilters.all}</option>
                    <option value="USER">{text.users.roleFilters.USER}</option>
                    <option value="ADMIN">{text.users.roleFilters.ADMIN}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-user-version" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.users.versionFilterLabel}
                  </label>
                  <select
                    id="admin-user-version"
                    value={draftVersion}
                    onChange={(event) => setDraftVersion(event.target.value as AdminUsersVersionFilter)}
                    className={`${FORM_CONTROL_CLASS} mt-3`}
                  >
                    <option value="all">{text.users.versionFilters.all}</option>
                    <option value="legacy">{text.users.versionFilters.legacy}</option>
                    <option value="product-v1">{text.users.versionFilters['product-v1']}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-user-status" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.users.statusFilterLabel}
                  </label>
                  <select
                    id="admin-user-status"
                    value={draftStatus}
                    onChange={(event) => setDraftStatus(event.target.value as AdminUsersStatusFilter)}
                    className={`${FORM_CONTROL_CLASS} mt-3`}
                  >
                    <option value="all">{text.users.statusFilters.all}</option>
                    <option value="active">{text.users.statusFilters.active}</option>
                    <option value="restricted">{text.users.statusFilters.restricted}</option>
                    <option value="suspended">{text.users.statusFilters.suspended}</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(180px,0.45fr)_auto_auto] lg:items-end">
                <div>
                  <label htmlFor="admin-user-sort" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.users.sortLabel}
                  </label>
                  <select
                    id="admin-user-sort"
                    value={draftSort}
                    onChange={(event) => setDraftSort(event.target.value as AdminUsersSort)}
                    className={`${FORM_CONTROL_CLASS} mt-3`}
                  >
                    <option value="created-desc">{text.users.sortOptions['created-desc']}</option>
                    <option value="created-asc">{text.users.sortOptions['created-asc']}</option>
                    <option value="last-seen-desc">{text.users.sortOptions['last-seen-desc']}</option>
                    <option value="last-seen-asc">{text.users.sortOptions['last-seen-asc']}</option>
                  </select>
                </div>
                <Button type="submit" variant="secondary" size="lg" className="rounded-xl px-4">
                  {text.users.applyFilters}
                </Button>
                <Button type="button" variant="ghost" size="lg" className="rounded-xl px-4" onClick={onClearFilters}>
                  {text.users.clearFilters}
                </Button>
              </div>
            </form>

            {!isHydrated || authStatus === 'checking' || token === null || requestStatus === 'loading' ? (
              <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                {text.common.loading}
              </div>
            ) : requestStatus === 'error' ? (
              <div className="rounded-[1.35rem] border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
                {errorMessage ?? text.users.unavailable}
              </div>
            ) : visibleUsers.length > 0 ? (
              <div className="space-y-3">
                {visibleUsers.map((user) => (
                  <article key={user.id} className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveAdminUserStatusClass(user.accountStatus)}`}>
                            {text.users.statusFilters[user.accountStatus]}
                          </span>
                          <span className="inline-flex rounded-full border border-(--border-subtle) bg-white/6 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-(--text-muted)">
                            {text.users.roleFilters[user.role]}
                          </span>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveAdminUserVersionClass(user.accountVersion)}`}>
                            {text.users.versionFilters[user.accountVersion]}
                          </span>
                        </div>
                        <h4 className="text-base font-black tracking-[-0.02em] text-(--text-strong)">{user.name}</h4>
                        <p className="break-all text-sm leading-7 text-(--text-muted)">{user.email}</p>
                      </div>

                      <a
                        href={buildLocalizedAdminUserDetailPath(locale, user.id)}
                        className="inline-flex items-center justify-center rounded-full border border-orange-400/35 bg-orange-400/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-(--text-strong) transition hover:border-orange-400/50 hover:bg-orange-400/18"
                      >
                        {text.users.openUser}
                      </a>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.tableColumns.version}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{text.users.versionFilters[user.accountVersion]}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.tableColumns.role}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{text.users.roleFilters[user.role]}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.tableColumns.status}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{text.users.statusFilters[user.accountStatus]}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.tableColumns.lastSeen}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, user.lastSeenAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.tableColumns.createdAt}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{formatAdminDateTime(locale, user.createdAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4 text-sm leading-7 text-(--text-muted)">
                {hasActiveFilters ? text.users.emptyFiltered : text.users.empty}
              </div>
            )}

            {requestStatus === 'success' && (previousCursor !== null || currentDirectoryPage.nextCursor !== null) ? (
              <div className="flex flex-wrap gap-3 border-t border-(--border-subtle) pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={previousCursor === null || hasPendingDraftChanges}
                  onClick={onPreviousPage}
                >
                  {text.users.pagination.previous}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={currentDirectoryPage.nextCursor === null || hasPendingDraftChanges}
                  onClick={() => {
                    if (currentDirectoryPage.nextCursor !== null) {
                      onNextPage(currentDirectoryPage.nextCursor);
                    }
                  }}
                >
                  {text.users.pagination.next}
                </Button>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-4 xl:gap-5">
          <Panel className="rounded-[2rem]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.syncTitle}</h3>
                <p className="text-sm leading-7 text-(--text-muted)">{text.users.syncDescription}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.syncSummary.synced}</dt>
                  <dd className="mt-1 text-sm font-semibold text-(--text-strong)">{String(syncFeedback?.itemsSynced ?? 0)}</dd>
                </div>
                <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.syncSummary.created}</dt>
                  <dd className="mt-1 text-sm font-semibold text-(--text-strong)">{String(syncFeedback?.createdCount ?? 0)}</dd>
                </div>
                <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.syncSummary.updated}</dt>
                  <dd className="mt-1 text-sm font-semibold text-(--text-strong)">{String(syncFeedback?.updatedCount ?? 0)}</dd>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.syncCursorLabel}</p>
                <p className="mt-2 break-all text-sm leading-7 text-(--text-strong)">
                  {syncCursor ?? text.users.syncStartCursor}
                </p>
                <p className="mt-2 text-sm leading-7 text-(--text-muted)">
                  {syncCursor === null ? text.users.syncReady : text.users.syncProgress}
                </p>
              </div>

              {syncStatus === 'error' ? (
                <div className="rounded-[1.35rem] border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
                  {syncErrorMessage ?? text.users.syncUnavailable}
                </div>
              ) : null}

              {syncStatus === 'success' ? (
                <div className="rounded-[1.35rem] border border-emerald-500/35 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-50">
                  {text.users.syncSuccess}
                </div>
              ) : null}

              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="rounded-xl px-4"
                disabled={!isHydrated || authStatus === 'checking' || token === null || syncStatus === 'loading'}
                onClick={() => {
                  void onSyncDirectory();
                }}
              >
                {syncStatus === 'loading' ? text.common.loading : text.users.syncAction}
              </Button>
            </div>
          </Panel>

          <Panel className="rounded-[2rem]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.currentAdminTitle}</h3>
                <p className="text-sm leading-7 text-(--text-muted)">{text.users.currentAdminDescription}</p>
              </div>
              <dl className="grid gap-3">
                <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.name}</dt>
                  <dd className="mt-1 text-sm font-semibold text-(--text-strong)">{adminProfile.name}</dd>
                </div>
                <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.email}</dt>
                  <dd className="mt-1 break-all text-sm font-semibold text-(--text-strong)">{adminProfile.email}</dd>
                </div>
                <div className="rounded-[1.2rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.role}</dt>
                  <dd className="mt-1 text-sm font-semibold text-(--text-strong)">{text.users.roleFilters[adminProfile.role]}</dd>
                </div>
              </dl>

              <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                <p className="text-sm leading-7 text-(--text-muted)">{text.users.productDirectoryScope}</p>
              </div>

              <div className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-(--text-strong)">{text.users.liveGuardrailsTitle}</h4>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-(--text-muted)">
                  {text.users.liveGuardrails.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="pt-2 text-[10px] text-(--accent)">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel className="rounded-[2rem]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.contractsTitle}</h3>
                <p className="text-sm leading-7 text-(--text-muted)">{text.users.contractsDescription}</p>
              </div>

              <div className="grid gap-3">
                {Object.values(text.users.contractItems).map((item) => (
                  <article key={item.title} className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                    <h4 className="text-base font-black tracking-[-0.02em] text-(--text-strong)">{item.title}</h4>
                    <p className="mt-2 break-all font-mono text-xs text-(--text-strong)">{item.endpoint}</p>
                    <p className="mt-3 text-sm leading-7 text-(--text-muted)">{item.note}</p>
                  </article>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
