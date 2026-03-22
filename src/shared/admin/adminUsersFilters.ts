import type { AdminUserAccountStatus, AdminUserRole } from '@/shared/types/admin';

type AdminUsersRoleFilter = 'all' | AdminUserRole;
type AdminUsersStatusFilter = 'all' | AdminUserAccountStatus;
type AdminUsersSort = 'created-desc' | 'created-asc' | 'last-seen-desc' | 'last-seen-asc';

type AdminUsersBrowseFilters = {
  role: AdminUsersRoleFilter;
  status: AdminUsersStatusFilter;
  sort: AdminUsersSort;
  query: string | null;
  cursor: string | null;
};

type AdminUsersSearchParamsInput = {
  role?: string | string[] | null | undefined;
  status?: string | string[] | null | undefined;
  sort?: string | string[] | null | undefined;
  q?: string | string[] | null | undefined;
  cursor?: string | string[] | null | undefined;
};

function normalizeAdminUsersQuery(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim().replace(/\s+/g, ' ') ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeAdminUsersCursor(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim() ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function resolveAdminUsersRoleFilter(input: AdminUsersSearchParamsInput): AdminUsersRoleFilter {
  const rawValue = Array.isArray(input.role) ? input.role[0] : input.role;
  const normalizedValue = rawValue?.trim().toUpperCase() ?? '';

  if (normalizedValue === 'USER' || normalizedValue === 'ADMIN') {
    return normalizedValue;
  }

  return 'all';
}

function resolveAdminUsersStatusFilter(input: AdminUsersSearchParamsInput): AdminUsersStatusFilter {
  const rawValue = Array.isArray(input.status) ? input.status[0] : input.status;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'active' ||
    normalizedValue === 'restricted' ||
    normalizedValue === 'suspended'
  ) {
    return normalizedValue;
  }

  return 'all';
}

function resolveAdminUsersSort(input: AdminUsersSearchParamsInput): AdminUsersSort {
  const rawValue = Array.isArray(input.sort) ? input.sort[0] : input.sort;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'created-asc' ||
    normalizedValue === 'last-seen-desc' ||
    normalizedValue === 'last-seen-asc'
  ) {
    return normalizedValue;
  }

  return 'created-desc';
}

function resolveAdminUsersBrowseFilters(input: AdminUsersSearchParamsInput): AdminUsersBrowseFilters {
  return {
    role: resolveAdminUsersRoleFilter(input),
    status: resolveAdminUsersStatusFilter(input),
    sort: resolveAdminUsersSort(input),
    query: normalizeAdminUsersQuery(input.q),
    cursor: normalizeAdminUsersCursor(input.cursor),
  };
}

function buildAdminUsersSearchParams(input: {
  role?: AdminUsersRoleFilter | null;
  status?: AdminUsersStatusFilter | null;
  sort?: AdminUsersSort | null;
  query?: string | null;
  cursor?: string | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveAdminUsersBrowseFilters({
    role: input.role,
    status: input.status,
    sort: input.sort,
    q: input.query,
    cursor: input.cursor,
  });

  if (resolvedFilters.role !== 'all') {
    searchParams.set('role', resolvedFilters.role);
  }

  if (resolvedFilters.status !== 'all') {
    searchParams.set('status', resolvedFilters.status);
  }

  if (resolvedFilters.sort !== 'created-desc') {
    searchParams.set('sort', resolvedFilters.sort);
  }

  if (resolvedFilters.query !== null) {
    searchParams.set('q', resolvedFilters.query);
  }

  if (resolvedFilters.cursor !== null) {
    searchParams.set('cursor', resolvedFilters.cursor);
  }

  return searchParams;
}

export {
  buildAdminUsersSearchParams,
  normalizeAdminUsersCursor,
  normalizeAdminUsersQuery,
  resolveAdminUsersBrowseFilters,
  resolveAdminUsersRoleFilter,
  resolveAdminUsersSort,
  resolveAdminUsersStatusFilter,
};
export type {
  AdminUsersBrowseFilters,
  AdminUsersRoleFilter,
  AdminUsersSearchParamsInput,
  AdminUsersSort,
  AdminUsersStatusFilter,
};
