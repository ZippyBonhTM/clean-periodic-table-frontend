type AdminAuditActionFilter =
  | 'all'
  | 'role_change'
  | 'moderation'
  | 'session_revoke'
  | 'access_check';

type AdminAuditBrowseFilters = {
  action: AdminAuditActionFilter;
  query: string | null;
  cursor: string | null;
};

type AdminAuditSearchParamsInput = {
  action?: string | string[] | null | undefined;
  q?: string | string[] | null | undefined;
  cursor?: string | string[] | null | undefined;
};

function normalizeAdminAuditQuery(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim().replace(/\s+/g, ' ') ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeAdminAuditCursor(value: string | string[] | null | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim() ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function resolveAdminAuditActionFilter(input: AdminAuditSearchParamsInput): AdminAuditActionFilter {
  const rawValue = Array.isArray(input.action) ? input.action[0] : input.action;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'role_change' ||
    normalizedValue === 'moderation' ||
    normalizedValue === 'session_revoke' ||
    normalizedValue === 'access_check'
  ) {
    return normalizedValue;
  }

  return 'all';
}

function resolveAdminAuditBrowseFilters(input: AdminAuditSearchParamsInput): AdminAuditBrowseFilters {
  return {
    action: resolveAdminAuditActionFilter(input),
    query: normalizeAdminAuditQuery(input.q),
    cursor: normalizeAdminAuditCursor(input.cursor),
  };
}

function buildAdminAuditSearchParams(input: {
  action?: AdminAuditActionFilter | null;
  query?: string | null;
  cursor?: string | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveAdminAuditBrowseFilters({
    action: input.action,
    q: input.query,
    cursor: input.cursor,
  });

  if (resolvedFilters.action !== 'all') {
    searchParams.set('action', resolvedFilters.action);
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
  buildAdminAuditSearchParams,
  normalizeAdminAuditCursor,
  normalizeAdminAuditQuery,
  resolveAdminAuditActionFilter,
  resolveAdminAuditBrowseFilters,
};
export type {
  AdminAuditActionFilter,
  AdminAuditBrowseFilters,
  AdminAuditSearchParamsInput,
};
