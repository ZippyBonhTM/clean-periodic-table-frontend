import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAdminApi } from '@/shared/api/adminApi';
import type { AdminApi } from '@/shared/api/adminApi.types';

describe('adminApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls the expected admin directory and detail endpoints through the local proxy', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        nextCursor: null,
        prevCursor: null,
      }),
    }));

    vi.stubGlobal('fetch', fetchSpy);

    const api: AdminApi = createAdminApi();

    await api.listUsers({
      token: 'token-1',
      query: 'ada',
      role: 'ADMIN',
      status: 'active',
      sort: 'created-desc',
      cursor: 'cursor-1',
      limit: 20,
    });
    await api.getUserById({
      token: 'token-1',
      userId: 'user-123',
    });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      new URL('http://localhost:3000/api/admin/users?cursor=cursor-1&limit=20&q=ada&role=ADMIN&status=active&sort=created-desc'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      new URL('http://localhost:3000/api/admin/users/user-123'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  it('calls the expected mutation and audit endpoints through the local proxy', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        message: 'ok',
        user: {
          id: 'user-123',
          name: 'Ada',
          email: 'ada@example.com',
          role: 'ADMIN',
          accountStatus: 'active',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          lastSeenAt: null,
          activeSessionCount: 1,
          lastAuditAt: null,
          restriction: null,
          capabilities: null,
        },
        auditEntryId: 'audit-1',
        revokedSessionCount: 2,
        items: [],
        nextCursor: null,
        prevCursor: null,
      }),
    }));

    vi.stubGlobal('fetch', fetchSpy);

    const api: AdminApi = createAdminApi();

    await api.changeUserRole({
      token: 'token-1',
      userId: 'user-123',
      role: 'USER',
      reason: 'Least privilege realignment',
    });
    await api.moderateUser({
      token: 'token-1',
      userId: 'user-123',
      status: 'restricted',
      reason: 'Security review pending',
      expiresAt: '2026-03-31T00:00:00.000Z',
    });
    await api.revokeUserSessions({
      token: 'token-1',
      userId: 'user-123',
      reason: 'Credential rotation',
      mode: 'all',
    });
    await api.listAudit({
      token: 'token-1',
      query: 'role',
      action: 'role_change',
      cursor: 'cursor-2',
    });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      new URL('http://localhost:3000/api/admin/users/user-123/role'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      new URL('http://localhost:3000/api/admin/users/user-123/moderation'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      new URL('http://localhost:3000/api/admin/users/user-123/sessions/revoke'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      4,
      new URL('http://localhost:3000/api/admin/audit?cursor=cursor-2&q=role&action=role_change'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
