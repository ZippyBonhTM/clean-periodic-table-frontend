import type { AuthUserProfile } from '@/shared/types/auth';

const AUTH_PROFILE_STORAGE_KEY = 'clean-periodic-table:auth-profile';

type PersistedAuthProfileRecord = {
  token: string;
  userProfile: AuthUserProfile;
};

let inMemoryAuthProfileRecord: PersistedAuthProfileRecord | null = null;

function isValidAuthUserProfile(value: unknown): value is AuthUserProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthUserProfile>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'USER' || candidate.role === 'ADMIN')
  );
}

function readPersistedAuthProfileRecord(): PersistedAuthProfileRecord | null {
  if (inMemoryAuthProfileRecord !== null) {
    return inMemoryAuthProfileRecord;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const rawRecord = window.sessionStorage.getItem(AUTH_PROFILE_STORAGE_KEY);

  if (rawRecord === null) {
    return null;
  }

  try {
    const parsedRecord = JSON.parse(rawRecord) as {
      token?: unknown;
      userProfile?: unknown;
    };

    if (typeof parsedRecord.token !== 'string' || !isValidAuthUserProfile(parsedRecord.userProfile)) {
      window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
      return null;
    }

    const normalizedToken = parsedRecord.token.trim();

    if (normalizedToken.length === 0) {
      window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
      return null;
    }

    inMemoryAuthProfileRecord = {
      token: normalizedToken,
      userProfile: parsedRecord.userProfile,
    };

    return inMemoryAuthProfileRecord;
  } catch {
    window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
    return null;
  }
}

function readCachedAuthProfile(token: string): AuthUserProfile | null {
  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return null;
  }

  const record = readPersistedAuthProfileRecord();

  if (record === null || record.token !== normalizedToken) {
    return null;
  }

  return record.userProfile;
}

function persistCachedAuthProfile(token: string, userProfile: AuthUserProfile): void {
  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return;
  }

  const record: PersistedAuthProfileRecord = {
    token: normalizedToken,
    userProfile,
  };

  inMemoryAuthProfileRecord = record;

  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(record));
}

function clearCachedAuthProfile(): void {
  inMemoryAuthProfileRecord = null;

  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
}

export {
  clearCachedAuthProfile,
  readCachedAuthProfile,
  persistCachedAuthProfile,
};
