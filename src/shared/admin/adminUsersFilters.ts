type AdminUsersCapabilityStatus = 'available' | 'guarded' | 'planned';
type AdminUsersCapabilityTrack =
  | 'session'
  | 'access'
  | 'directory'
  | 'roles'
  | 'moderation'
  | 'audit';
type AdminUsersStatusFilter = 'all' | AdminUsersCapabilityStatus;
type AdminUsersTrackFilter = 'all' | AdminUsersCapabilityTrack;

type AdminUsersBrowseFilters = {
  status: AdminUsersStatusFilter;
  track: AdminUsersTrackFilter;
  query: string | null;
};

type AdminUsersSearchParamsInput = {
  status?: string | string[] | null | undefined;
  track?: string | string[] | null | undefined;
  q?: string | string[] | null | undefined;
};

type AdminUsersCapabilityRecord = {
  title: string;
  description: string;
  dependency: string;
  securityNote: string;
  contract: string;
  status: AdminUsersCapabilityStatus;
  track: AdminUsersCapabilityTrack;
};

function normalizeAdminUsersQuery(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim().replace(/\s+/g, ' ') ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeAdminUsersSearchText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function resolveAdminUsersStatusFilter(input: AdminUsersSearchParamsInput): AdminUsersStatusFilter {
  const rawValue = Array.isArray(input.status) ? input.status[0] : input.status;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'available' ||
    normalizedValue === 'guarded' ||
    normalizedValue === 'planned'
  ) {
    return normalizedValue;
  }

  return 'all';
}

function resolveAdminUsersTrackFilter(input: AdminUsersSearchParamsInput): AdminUsersTrackFilter {
  const rawValue = Array.isArray(input.track) ? input.track[0] : input.track;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'session' ||
    normalizedValue === 'access' ||
    normalizedValue === 'directory' ||
    normalizedValue === 'roles' ||
    normalizedValue === 'moderation' ||
    normalizedValue === 'audit'
  ) {
    return normalizedValue;
  }

  return 'all';
}

function resolveAdminUsersBrowseFilters(input: AdminUsersSearchParamsInput): AdminUsersBrowseFilters {
  return {
    status: resolveAdminUsersStatusFilter(input),
    track: resolveAdminUsersTrackFilter(input),
    query: normalizeAdminUsersQuery(input.q),
  };
}

function matchesAdminUsersQuery(
  capability: AdminUsersCapabilityRecord,
  query: string,
): boolean {
  const normalizedQuery = normalizeAdminUsersSearchText(query);
  const searchableText = [
    capability.title,
    capability.description,
    capability.dependency,
    capability.securityNote,
    capability.contract,
    capability.track,
    capability.status,
  ].join(' ');

  return normalizeAdminUsersSearchText(searchableText).includes(normalizedQuery);
}

function filterAdminUsersCapabilities(
  items: AdminUsersCapabilityRecord[],
  filters: AdminUsersBrowseFilters,
): AdminUsersCapabilityRecord[] {
  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    if (filters.track !== 'all' && item.track !== filters.track) {
      return false;
    }

    if (filters.query !== null && !matchesAdminUsersQuery(item, filters.query)) {
      return false;
    }

    return true;
  });
}

function countAdminUsersCapabilitiesByStatus(
  items: AdminUsersCapabilityRecord[],
): Record<AdminUsersStatusFilter, number> {
  const counts: Record<AdminUsersStatusFilter, number> = {
    all: items.length,
    available: 0,
    guarded: 0,
    planned: 0,
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
}

function buildAdminUsersSearchParams(input: {
  status?: AdminUsersStatusFilter | null;
  track?: AdminUsersTrackFilter | null;
  query?: string | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveAdminUsersBrowseFilters({
    status: input.status,
    track: input.track,
    q: input.query,
  });

  if (resolvedFilters.status !== 'all') {
    searchParams.set('status', resolvedFilters.status);
  }

  if (resolvedFilters.track !== 'all') {
    searchParams.set('track', resolvedFilters.track);
  }

  if (resolvedFilters.query !== null) {
    searchParams.set('q', resolvedFilters.query);
  }

  return searchParams;
}

export {
  buildAdminUsersSearchParams,
  countAdminUsersCapabilitiesByStatus,
  filterAdminUsersCapabilities,
  normalizeAdminUsersQuery,
  resolveAdminUsersBrowseFilters,
  resolveAdminUsersStatusFilter,
  resolveAdminUsersTrackFilter,
};
export type {
  AdminUsersBrowseFilters,
  AdminUsersCapabilityRecord,
  AdminUsersCapabilityStatus,
  AdminUsersCapabilityTrack,
  AdminUsersSearchParamsInput,
  AdminUsersStatusFilter,
  AdminUsersTrackFilter,
};
