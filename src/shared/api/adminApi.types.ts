import type {
  AdminAuditEntry,
  AdminCursorPage,
  AdminSession,
  AdminUserAccountStatus,
  AdminUserDetail,
  AdminUserRole,
  AdminUserRoleMutationResult,
  AdminUserModerationMutationResult,
  AdminUserSessionRevokeResult,
  AdminUserSummary,
} from '@/shared/types/admin';

type AdminCursorInput = {
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
};

type AdminAuthenticatedInput = {
  token: string;
  signal?: AbortSignal;
};

type AdminListUsersInput = AdminCursorInput & {
  token: string;
  query?: string | null;
  role?: AdminUserRole | 'all' | null;
  status?: AdminUserAccountStatus | 'all' | null;
  sort?: 'created-desc' | 'created-asc' | 'last-seen-desc' | 'last-seen-asc' | null;
};

type AdminGetUserInput = AdminAuthenticatedInput & {
  userId: string;
};

type AdminChangeUserRoleInput = AdminAuthenticatedInput & {
  userId: string;
  role: AdminUserRole;
  reason: string;
};

type AdminModerateUserInput = AdminAuthenticatedInput & {
  userId: string;
  status: AdminUserAccountStatus;
  reason: string;
  expiresAt?: string | null;
};

type AdminRevokeUserSessionsInput = AdminAuthenticatedInput & {
  userId: string;
  reason: string;
  mode?: 'all' | 'except-current';
};

type AdminListAuditInput = AdminCursorInput & {
  token: string;
  query?: string | null;
  action?: string | null;
};

interface AdminApi {
  getSession(input: AdminAuthenticatedInput): Promise<AdminSession>;
  listUsers(input: AdminListUsersInput): Promise<AdminCursorPage<AdminUserSummary>>;
  getUserById(input: AdminGetUserInput): Promise<AdminUserDetail>;
  changeUserRole(input: AdminChangeUserRoleInput): Promise<AdminUserRoleMutationResult>;
  moderateUser(input: AdminModerateUserInput): Promise<AdminUserModerationMutationResult>;
  revokeUserSessions(input: AdminRevokeUserSessionsInput): Promise<AdminUserSessionRevokeResult>;
  listAudit(input: AdminListAuditInput): Promise<AdminCursorPage<AdminAuditEntry>>;
}

export type {
  AdminApi,
  AdminAuthenticatedInput,
  AdminChangeUserRoleInput,
  AdminCursorInput,
  AdminGetUserInput,
  AdminListAuditInput,
  AdminListUsersInput,
  AdminModerateUserInput,
  AdminRevokeUserSessionsInput,
};
