'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import {
  countAdminUsersCapabilitiesByStatus,
  filterAdminUsersCapabilities,
  normalizeAdminUsersQuery,
  type AdminUsersBrowseFilters,
  type AdminUsersCapabilityRecord,
  type AdminUsersCapabilityStatus,
  type AdminUsersStatusFilter,
  type AdminUsersTrackFilter,
} from '@/shared/admin/adminUsersFilters';
import { buildLocalizedAdminUsersBrowsePath } from '@/shared/admin/adminRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AuthUserProfile } from '@/shared/types/auth';

type AdminUsersWorkspaceProps = {
  locale: AppLocale;
  adminProfile: AuthUserProfile;
  initialFilters: AdminUsersBrowseFilters;
};

function resolveStatusClass(status: AdminUsersCapabilityStatus): string {
  if (status === 'available') {
    return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-50';
  }

  if (status === 'guarded') {
    return 'border-sky-400/35 bg-sky-400/10 text-sky-50';
  }

  return 'border-amber-400/35 bg-amber-400/10 text-amber-50';
}

function resolveFilterClass(isActive: boolean): string {
  return isActive
    ? 'border-orange-400/40 bg-orange-400/12 text-(--text-strong)'
    : 'border-(--border-subtle) bg-[var(--surface-2)] text-(--text-muted) hover:border-orange-400/30 hover:text-(--text-strong)';
}

export default function AdminUsersWorkspace({
  locale,
  adminProfile,
  initialFilters,
}: AdminUsersWorkspaceProps) {
  const router = useRouter();
  const text = getAdminWorkspaceText(locale);
  const [activeStatus, setActiveStatus] = useState<AdminUsersStatusFilter>(initialFilters.status);
  const [activeTrack, setActiveTrack] = useState<AdminUsersTrackFilter>(initialFilters.track);
  const [activeQuery, setActiveQuery] = useState(initialFilters.query);
  const [searchInput, setSearchInput] = useState(initialFilters.query ?? '');

  const capabilities = useMemo<AdminUsersCapabilityRecord[]>(
    () => [
      {
        ...text.users.capabilityItems.resolveSession,
        status: 'available',
        track: 'session',
      },
      {
        ...text.users.capabilityItems.openProtectedAreas,
        status: 'guarded',
        track: 'access',
      },
      {
        ...text.users.capabilityItems.listUsers,
        status: 'planned',
        track: 'directory',
      },
      {
        ...text.users.capabilityItems.changeRole,
        status: 'planned',
        track: 'roles',
      },
      {
        ...text.users.capabilityItems.suspendAccount,
        status: 'planned',
        track: 'moderation',
      },
      {
        ...text.users.capabilityItems.auditTrail,
        status: 'planned',
        track: 'audit',
      },
    ],
    [text],
  );

  const statusCounts = useMemo(
    () => countAdminUsersCapabilitiesByStatus(capabilities),
    [capabilities],
  );
  const filteredCapabilities = useMemo(
    () =>
      filterAdminUsersCapabilities(capabilities, {
        status: activeStatus,
        track: activeTrack,
        query: activeQuery,
      }),
    [activeQuery, activeStatus, activeTrack, capabilities],
  );
  const hasActiveFilters = activeStatus !== 'all' || activeTrack !== 'all' || activeQuery !== null;

  const syncBrowseState = useCallback(
    (nextState: {
      status?: AdminUsersStatusFilter;
      track?: AdminUsersTrackFilter;
      query?: string | null;
      searchInputValue?: string;
    }) => {
      const nextStatus = nextState.status ?? activeStatus;
      const nextTrack = nextState.track ?? activeTrack;
      const nextQuery = nextState.query ?? activeQuery;

      setActiveStatus(nextStatus);
      setActiveTrack(nextTrack);
      setActiveQuery(nextQuery);

      if (nextState.searchInputValue !== undefined) {
        setSearchInput(nextState.searchInputValue);
      }

      router.replace(
        buildLocalizedAdminUsersBrowsePath(locale, {
          status: nextStatus,
          track: nextTrack,
          query: nextQuery,
        }),
      );
    },
    [activeQuery, activeStatus, activeTrack, locale, router],
  );

  const onSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      syncBrowseState({
        query: normalizeAdminUsersQuery(searchInput),
        searchInputValue: searchInput,
      });
    },
    [searchInput, syncBrowseState],
  );

  const onClearFilters = useCallback(() => {
    syncBrowseState({
      status: 'all',
      track: 'all',
      query: null,
      searchInputValue: '',
    });
  }, [syncBrowseState]);

  const trackOptions: AdminUsersTrackFilter[] = ['all', 'session', 'access', 'directory', 'roles', 'moderation', 'audit'];
  const statusOptions: AdminUsersStatusFilter[] = ['all', 'available', 'guarded', 'planned'];

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="grid gap-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.sections.users.title}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.users.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.visible}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{filteredCapabilities.length}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.available}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{statusCounts.available}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.guarded}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{statusCounts.guarded}</p>
            </div>
            <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.summaryCards.planned}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-(--text-strong)">{statusCounts.planned}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] xl:gap-5">
        <Panel className="rounded-[2rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.capabilitiesTitle}</h3>
              <p className="text-sm leading-7 text-(--text-muted)">{text.users.capabilitiesDescription}</p>
            </div>

            <form onSubmit={onSearchSubmit} className="grid gap-4 rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                <div>
                  <label htmlFor="admin-capability-search" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.users.searchLabel}
                  </label>
                  <div className="mt-3">
                    <Input
                      id="admin-capability-search"
                      name="adminCapabilitySearch"
                      value={searchInput}
                      onChange={setSearchInput}
                      placeholder={text.users.searchPlaceholder}
                    />
                  </div>
                </div>
                <Button type="submit" variant="secondary" size="lg" className="rounded-xl px-4">
                  {text.users.applyFilters}
                </Button>
                <Button type="button" variant="ghost" size="lg" className="rounded-xl px-4" onClick={onClearFilters}>
                  {text.users.clearFilters}
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.filterStatusLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] transition ${resolveFilterClass(activeStatus === status)}`}
                        onClick={() => syncBrowseState({ status })}
                      >
                        {text.users.statusFilters[status]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.users.filterTrackLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {trackOptions.map((track) => (
                      <button
                        key={track}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] transition ${resolveFilterClass(activeTrack === track)}`}
                        onClick={() => syncBrowseState({ track })}
                      >
                        {text.users.trackFilters[track]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            {filteredCapabilities.length > 0 ? (
              <div className="grid gap-3">
                {filteredCapabilities.map((capability) => (
                  <article key={capability.title} className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full border border-(--border-subtle) bg-white/6 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-(--text-muted)">
                            {text.users.trackFilters[capability.track]}
                          </span>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveStatusClass(capability.status)}`}>
                            {text.users.statuses[capability.status]}
                          </span>
                        </div>
                        <h4 className="text-base font-black tracking-[-0.02em] text-(--text-strong)">{capability.title}</h4>
                        <p className="text-sm leading-7 text-(--text-muted)">{capability.description}</p>
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.dependency}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{capability.dependency}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.contract}</dt>
                        <dd className="mt-1 break-all font-mono text-xs text-(--text-strong)">{capability.contract}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.securityNote}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{capability.securityNote}</dd>
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
          </div>
        </Panel>

        <div className="grid gap-4 xl:gap-5">
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
                  <dd className="mt-1 text-sm font-semibold text-(--text-strong)">{adminProfile.role}</dd>
                </div>
              </dl>

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
