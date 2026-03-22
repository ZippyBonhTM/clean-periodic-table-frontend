'use client';

import { useMemo, useState } from 'react';

import Input from '@/components/atoms/Input';
import Panel from '@/components/atoms/Panel';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { AuthUserProfile } from '@/shared/types/auth';

type AdminUsersWorkspaceProps = {
  locale: AppLocale;
  adminProfile: AuthUserProfile;
};

type AdminCapabilityStatus = 'available' | 'guarded' | 'planned';

type AdminCapability = {
  title: string;
  description: string;
  dependency: string;
  securityNote: string;
  status: AdminCapabilityStatus;
};

function resolveStatusClass(status: AdminCapabilityStatus): string {
  if (status === 'available') {
    return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-50';
  }

  if (status === 'guarded') {
    return 'border-sky-400/35 bg-sky-400/10 text-sky-50';
  }

  return 'border-amber-400/35 bg-amber-400/10 text-amber-50';
}

export default function AdminUsersWorkspace({
  locale,
  adminProfile,
}: AdminUsersWorkspaceProps) {
  const text = getAdminWorkspaceText(locale);
  const [query, setQuery] = useState('');
  const capabilities = useMemo<AdminCapability[]>(
    () => [
      {
        ...text.users.capabilityItems.resolveSession,
        status: 'available',
      },
      {
        ...text.users.capabilityItems.openProtectedAreas,
        status: 'guarded',
      },
      {
        ...text.users.capabilityItems.listUsers,
        status: 'planned',
      },
      {
        ...text.users.capabilityItems.changeRole,
        status: 'planned',
      },
      {
        ...text.users.capabilityItems.suspendAccount,
        status: 'planned',
      },
    ],
    [text],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCapabilities = useMemo(
    () =>
      capabilities.filter((capability) => {
        if (normalizedQuery.length === 0) {
          return true;
        }

        return [
          capability.title,
          capability.description,
          capability.dependency,
          capability.securityNote,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      }),
    [capabilities, normalizedQuery],
  );

  return (
    <div className="grid gap-4 xl:gap-5">
      <Panel className="rounded-[2rem]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-(--text-strong)">{text.sections.users.title}</h2>
            <p className="text-sm leading-7 text-(--text-muted)">{text.sections.users.description}</p>
          </div>

          <div className="rounded-[1.45rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
            <label htmlFor="admin-capability-search" className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
              {text.users.searchLabel}
            </label>
            <div className="mt-3">
              <Input
                id="admin-capability-search"
                name="adminCapabilitySearch"
                value={query}
                onChange={setQuery}
                placeholder={text.users.searchPlaceholder}
              />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:gap-5">
        <Panel className="rounded-[2rem]">
          <div className="space-y-3">
            <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.currentAdminTitle}</h3>
            <p className="text-sm leading-7 text-(--text-muted)">{text.users.currentAdminDescription}</p>
            <dl className="grid gap-3 pt-2">
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
          </div>
        </Panel>

        <Panel className="rounded-[2rem]">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-[-0.03em] text-(--text-strong)">{text.users.capabilitiesTitle}</h3>
              <p className="text-sm leading-7 text-(--text-muted)">{text.users.capabilitiesDescription}</p>
            </div>

            {filteredCapabilities.length > 0 ? (
              <div className="grid gap-3">
                {filteredCapabilities.map((capability) => (
                  <article key={capability.title} className="rounded-[1.35rem] border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <h4 className="text-base font-black tracking-[-0.02em] text-(--text-strong)">{capability.title}</h4>
                        <p className="text-sm leading-7 text-(--text-muted)">{capability.description}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${resolveStatusClass(capability.status)}`}>
                        {text.users.statuses[capability.status]}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">{text.common.dependency}</dt>
                        <dd className="mt-1 text-sm text-(--text-strong)">{capability.dependency}</dd>
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
                {text.users.empty}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
