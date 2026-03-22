import type { AuthUserProfile } from '@/shared/types/auth';

type AdminUserRole = AuthUserProfile['role'];

type AdminUserAccountStatus = 'active' | 'restricted' | 'suspended';

type AdminCursorPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
  prevCursor: string | null;
};

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  accountStatus: AdminUserAccountStatus;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
};

type AdminUserCapabilities = {
  canChangeRole: boolean;
  canModerate: boolean;
  canRevokeSessions: boolean;
  isSelf: boolean;
  isLastAdminProtected: boolean;
};

type AdminUserRestriction = {
  reason: string | null;
  expiresAt: string | null;
};

type AdminUserDetail = AdminUserSummary & {
  activeSessionCount: number | null;
  lastAuditAt: string | null;
  restriction: AdminUserRestriction | null;
  capabilities: AdminUserCapabilities | null;
};

type AdminAuditActor = {
  id: string | null;
  name: string | null;
  email: string | null;
};

type AdminAuditTarget = {
  id: string | null;
  name: string | null;
  email: string | null;
};

type AdminAuditEntry = {
  id: string;
  action: string;
  summary: string;
  occurredAt: string;
  actor: AdminAuditActor;
  target: AdminAuditTarget | null;
  ipAddress: string | null;
};

type AdminUserRoleMutationResult = {
  user: AdminUserDetail;
  auditEntryId: string | null;
  message: string;
};

type AdminUserModerationMutationResult = {
  user: AdminUserDetail;
  auditEntryId: string | null;
  message: string;
};

type AdminUserSessionRevokeResult = {
  revokedSessionCount: number;
  auditEntryId: string | null;
  message: string;
};

export type {
  AdminAuditActor,
  AdminAuditEntry,
  AdminAuditTarget,
  AdminCursorPage,
  AdminUserAccountStatus,
  AdminUserCapabilities,
  AdminUserDetail,
  AdminUserModerationMutationResult,
  AdminUserRestriction,
  AdminUserRole,
  AdminUserRoleMutationResult,
  AdminUserSessionRevokeResult,
  AdminUserSummary,
};
