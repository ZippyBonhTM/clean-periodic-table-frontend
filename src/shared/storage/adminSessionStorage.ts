import type { AdminSessionUser } from '@/shared/types/admin';

const ADMIN_SESSION_STORAGE_KEY = 'clean-periodic-table:admin-session';
const ADMIN_SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

type PersistedAdminSessionRecord = {
  token: string;
  user: AdminSessionUser | null;
  hasAdminAccess: boolean;
  cachedAt: number;
};

let inMemoryAdminSessionRecord: PersistedAdminSessionRecord | null = null;

function isValidAdminSessionUser(value: unknown): value is AdminSessionUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AdminSessionUser>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'USER' || candidate.role === 'ADMIN')
  );
}

function isValidAdminSessionRecord(value: unknown): value is PersistedAdminSessionRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<PersistedAdminSessionRecord>;

  return (
    typeof candidate.token === 'string' &&
    typeof candidate.hasAdminAccess === 'boolean' &&
    typeof candidate.cachedAt === 'number' &&
    (candidate.user === null || isValidAdminSessionUser(candidate.user))
  );
}

function isExpiredRecord(record: PersistedAdminSessionRecord): boolean {
  return Date.now() - record.cachedAt > ADMIN_SESSION_CACHE_TTL_MS;
}

function readPersistedAdminSessionRecord(): PersistedAdminSessionRecord | null {
  if (inMemoryAdminSessionRecord !== null) {
    if (isExpiredRecord(inMemoryAdminSessionRecord)) {
      clearCachedAdminSession();
      return null;
    }

    return inMemoryAdminSessionRecord;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const rawRecord = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

  if (rawRecord === null) {
    return null;
  }

  try {
    const parsedRecord = JSON.parse(rawRecord) as unknown;

    if (!isValidAdminSessionRecord(parsedRecord)) {
      window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }

    if (parsedRecord.token.trim().length === 0 || isExpiredRecord(parsedRecord)) {
      window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }

    inMemoryAdminSessionRecord = parsedRecord;
    return inMemoryAdminSessionRecord;
  } catch {
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    return null;
  }
}

function readCachedAdminSession(token: string): PersistedAdminSessionRecord | null {
  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return null;
  }

  const record = readPersistedAdminSessionRecord();

  if (record === null || record.token !== normalizedToken) {
    return null;
  }

  return record;
}

type PersistAdminSessionInput = {
  token: string;
  hasAdminAccess: boolean;
  user?: AdminSessionUser | null;
};

function persistCachedAdminSession({
  token,
  hasAdminAccess,
  user = null,
}: PersistAdminSessionInput): void {
  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return;
  }

  const record: PersistedAdminSessionRecord = {
    token: normalizedToken,
    user: hasAdminAccess ? user : null,
    hasAdminAccess,
    cachedAt: Date.now(),
  };

  inMemoryAdminSessionRecord = record;

  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(record));
}

function clearCachedAdminSession(): void {
  inMemoryAdminSessionRecord = null;

  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

export {
  clearCachedAdminSession,
  persistCachedAdminSession,
  readCachedAdminSession,
};
