import { describe, expect, it } from 'vitest';

import {
  buildAdminUsersSearchParams,
  countAdminUsersCapabilitiesByStatus,
  filterAdminUsersCapabilities,
  resolveAdminUsersBrowseFilters,
  type AdminUsersCapabilityRecord,
} from '@/shared/admin/adminUsersFilters';

const SAMPLE_CAPABILITIES = [
  {
    title: 'Resolve current admin session',
    description: 'Validate the acting admin before rendering.',
    dependency: 'Auth upstream',
    securityNote: 'Deny by default.',
    contract: 'GET /admin/session',
    status: 'available',
    track: 'session',
  },
  {
    title: 'Open protected areas safely',
    description: 'Keep hidden areas behind guarded routes.',
    dependency: 'Server guards',
    securityNote: 'Return 404 for non-admins.',
    contract: 'GET /admin/access-matrix',
    status: 'guarded',
    track: 'access',
  },
  {
    title: 'List platform users',
    description: 'Expose paginated admin directory.',
    dependency: 'Admin users endpoint',
    securityNote: 'Bounded filters only.',
    contract: 'GET /api/v1/admin/users',
    status: 'planned',
    track: 'directory',
  },
] satisfies ReadonlyArray<AdminUsersCapabilityRecord>;

describe('adminUsersFilters', () => {
  it('resolves browse filters from query parameters safely', () => {
    expect(
      resolveAdminUsersBrowseFilters({
        status: 'planned',
        track: 'directory',
        q: '  role changes  ',
      }),
    ).toEqual({
      status: 'planned',
      track: 'directory',
      query: 'role changes',
    });

    expect(resolveAdminUsersBrowseFilters({ status: 'oops', track: '???', q: '   ' })).toEqual({
      status: 'all',
      track: 'all',
      query: null,
    });
  });

  it('filters capability records by status, track, and accent-insensitive query', () => {
    expect(
      filterAdminUsersCapabilities(SAMPLE_CAPABILITIES as AdminUsersCapabilityRecord[], {
        status: 'planned',
        track: 'directory',
        query: 'platform USERS',
      }),
    ).toHaveLength(1);

    expect(
      filterAdminUsersCapabilities(SAMPLE_CAPABILITIES as AdminUsersCapabilityRecord[], {
        status: 'all',
        track: 'access',
        query: null,
      }),
    ).toHaveLength(1);
  });

  it('counts statuses and builds compact search params for non-default filters', () => {
    expect(countAdminUsersCapabilitiesByStatus(SAMPLE_CAPABILITIES as AdminUsersCapabilityRecord[])).toEqual({
      all: 3,
      available: 1,
      guarded: 1,
      planned: 1,
    });

    expect(
      buildAdminUsersSearchParams({
        status: 'planned',
        track: 'directory',
        query: 'users',
      }).toString(),
    ).toBe('status=planned&track=directory&q=users');

    expect(buildAdminUsersSearchParams({}).toString()).toBe('');
  });
});
