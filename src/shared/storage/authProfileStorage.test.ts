import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearCachedAuthProfile,
  persistCachedAuthProfile,
  readCachedAuthProfile,
} from '@/shared/storage/authProfileStorage';

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
  (globalThis as typeof globalThis & {
    window?: { sessionStorage: ReturnType<typeof createSessionStorageMock> };
  }).window = {
    sessionStorage: createSessionStorageMock(),
  };
  clearCachedAuthProfile();
});

afterEach(() => {
  clearCachedAuthProfile();
  delete (
    globalThis as typeof globalThis & {
      window?: unknown;
    }
  ).window;
});

describe('authProfileStorage', () => {
  it('persists and restores the cached profile for the same token', () => {
    persistCachedAuthProfile('token-123', {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'ADMIN',
    });

    expect(readCachedAuthProfile('token-123')).toEqual({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'ADMIN',
    });
    expect(readCachedAuthProfile('different-token')).toBeNull();
  });

  it('clears cached profile state from memory and session storage', () => {
    persistCachedAuthProfile('token-123', {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'USER',
    });

    clearCachedAuthProfile();

    expect(readCachedAuthProfile('token-123')).toBeNull();
    expect(globalThis.window?.sessionStorage.getItem('clean-periodic-table:auth-profile')).toBeNull();
  });
});
