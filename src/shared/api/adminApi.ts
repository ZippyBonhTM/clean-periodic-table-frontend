import { requestJson } from '@/shared/api/httpClient';
import type {
  AdminApi,
  AdminChangeUserRoleInput,
  AdminGetUserInput,
  AdminListAuditInput,
  AdminListUsersInput,
  AdminModerateUserInput,
  AdminRevokeUserSessionsInput,
} from '@/shared/api/adminApi.types';
import type {
  AdminAuditEntry,
  AdminCursorPage,
  AdminUserDetail,
  AdminUserModerationMutationResult,
  AdminUserRoleMutationResult,
  AdminUserSessionRevokeResult,
  AdminUserSummary,
} from '@/shared/types/admin';

function resolveAdminRequestBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

function applyCursorQuery(url: URL, input: { cursor?: string | null; limit?: number }): void {
  if (input.cursor !== undefined && input.cursor !== null && input.cursor.trim().length > 0) {
    url.searchParams.set('cursor', input.cursor.trim());
  }

  if (input.limit !== undefined) {
    url.searchParams.set('limit', String(input.limit));
  }
}

function buildAdminUsersPath(input: AdminListUsersInput): string {
  const url = new URL('/api/admin/users', resolveAdminRequestBaseUrl());
  applyCursorQuery(url, input);

  const normalizedQuery = input.query?.trim() ?? '';

  if (normalizedQuery.length > 0) {
    url.searchParams.set('q', normalizedQuery);
  }

  if (input.role !== undefined && input.role !== null && input.role !== 'all') {
    url.searchParams.set('role', input.role);
  }

  if (input.status !== undefined && input.status !== null && input.status !== 'all') {
    url.searchParams.set('status', input.status);
  }

  if (input.sort !== undefined && input.sort !== null) {
    url.searchParams.set('sort', input.sort);
  }

  return `${url.pathname}${url.search}`;
}

function buildAdminAuditPath(input: AdminListAuditInput): string {
  const url = new URL('/api/admin/audit', resolveAdminRequestBaseUrl());
  applyCursorQuery(url, input);

  const normalizedQuery = input.query?.trim() ?? '';
  const normalizedAction = input.action?.trim() ?? '';

  if (normalizedQuery.length > 0) {
    url.searchParams.set('q', normalizedQuery);
  }

  if (normalizedAction.length > 0) {
    url.searchParams.set('action', normalizedAction);
  }

  return `${url.pathname}${url.search}`;
}

function createAdminApi(): AdminApi {
  const baseUrl = resolveAdminRequestBaseUrl();

  return {
    async listUsers(input: AdminListUsersInput): Promise<AdminCursorPage<AdminUserSummary>> {
      return await requestJson<AdminCursorPage<AdminUserSummary>>(baseUrl, buildAdminUsersPath(input), {
        method: 'GET',
        token: input.token,
        signal: input.signal,
        credentials: 'include',
      });
    },
    async getUserById(input: AdminGetUserInput): Promise<AdminUserDetail> {
      return await requestJson<AdminUserDetail>(baseUrl, `/api/admin/users/${encodeURIComponent(input.userId)}`, {
        method: 'GET',
        token: input.token,
        signal: input.signal,
        credentials: 'include',
      });
    },
    async changeUserRole(input: AdminChangeUserRoleInput): Promise<AdminUserRoleMutationResult> {
      return await requestJson<AdminUserRoleMutationResult>(baseUrl, `/api/admin/users/${encodeURIComponent(input.userId)}/role`, {
        method: 'POST',
        body: {
          role: input.role,
          reason: input.reason,
        },
        token: input.token,
        signal: input.signal,
        credentials: 'include',
      });
    },
    async moderateUser(input: AdminModerateUserInput): Promise<AdminUserModerationMutationResult> {
      return await requestJson<AdminUserModerationMutationResult>(baseUrl, `/api/admin/users/${encodeURIComponent(input.userId)}/moderation`, {
        method: 'POST',
        body: {
          status: input.status,
          reason: input.reason,
          expiresAt: input.expiresAt ?? null,
        },
        token: input.token,
        signal: input.signal,
        credentials: 'include',
      });
    },
    async revokeUserSessions(input: AdminRevokeUserSessionsInput): Promise<AdminUserSessionRevokeResult> {
      return await requestJson<AdminUserSessionRevokeResult>(baseUrl, `/api/admin/users/${encodeURIComponent(input.userId)}/sessions/revoke`, {
        method: 'POST',
        body: {
          reason: input.reason,
          mode: input.mode ?? 'except-current',
        },
        token: input.token,
        signal: input.signal,
        credentials: 'include',
      });
    },
    async listAudit(input: AdminListAuditInput): Promise<AdminCursorPage<AdminAuditEntry>> {
      return await requestJson<AdminCursorPage<AdminAuditEntry>>(baseUrl, buildAdminAuditPath(input), {
        method: 'GET',
        token: input.token,
        signal: input.signal,
        credentials: 'include',
      });
    },
  };
}

export { createAdminApi };
