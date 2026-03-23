import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearCachedAdminSession,
  persistCachedAdminSession,
  readCachedAdminSession,
} from '@/shared/storage/adminSessionStorage';

type StorageState = Map<string, string>;

function createSessionStorageMock() {
  const state: StorageState = new Map();

  return {
    getItem(key: string): string | null {
      return state.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      state.set(key, value);
    },
    removeItem(key: string): void {
      state.delete(key);
    },
    clear(): void {
      state.clear();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-22T20:00:00.000Z'));
  (globalThis as typeof globalThis & {
    window?: { sessionStorage: ReturnType<typeof createSessionStorageMock> };
  }).window = {
    sessionStorage: createSessionStorageMock(),
  };
  clearCachedAdminSession();
});

afterEach(() => {
  clearCachedAdminSession();
  delete (
    globalThis as typeof globalThis & {
      window?: unknown;
    }
  ).window;
  vi.useRealTimers();
});

describe('adminSessionStorage', () => {
  it('persists and restores cached admin access for the same token', () => {
    persistCachedAdminSession({
      token: 'token-123',
      hasAdminAccess: true,
      user: {
        id: 'admin-1',
        name: 'Admin One',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    expect(readCachedAdminSession('token-123')).toEqual({
      token: 'token-123',
      hasAdminAccess: true,
      user: {
        id: 'admin-1',
        name: 'Admin One',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      cachedAt: Date.now(),
    });
    expect(readCachedAdminSession('different-token')).toBeNull();
  });

  it('expires stale cached admin access and clears session storage', () => {
    persistCachedAdminSession({
      token: 'token-123',
      hasAdminAccess: false,
    });

    vi.setSystemTime(new Date('2026-03-22T20:06:00.000Z'));

    expect(readCachedAdminSession('token-123')).toBeNull();
    expect(globalThis.window?.sessionStorage.getItem('clean-periodic-table:admin-session')).toBeNull();
  });
});
