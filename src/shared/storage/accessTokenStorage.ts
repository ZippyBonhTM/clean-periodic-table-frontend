import {
  clearClientServerAccessTokenCookie,
  persistClientServerAccessTokenCookie,
} from '@/shared/auth/clientAccessTokenCookie';
import { clearCachedAuthProfile } from '@/shared/storage/authProfileStorage';

const ACCESS_TOKEN_KEY = 'clean_periodic_table_access_token';
const SILENT_REFRESH_BLOCKED_KEY = 'clean_periodic_table_silent_refresh_blocked';

function readAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);

  return token?.trim().length ? token : null;
}

function saveAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  persistClientServerAccessTokenCookie(token);
}

function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  clearClientServerAccessTokenCookie();
  clearCachedAuthProfile();
}

function readSilentRefreshBlocked(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(SILENT_REFRESH_BLOCKED_KEY) === '1';
}

function setSilentRefreshBlocked(blocked: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (blocked) {
    window.localStorage.setItem(SILENT_REFRESH_BLOCKED_KEY, '1');
    return;
  }

  window.localStorage.removeItem(SILENT_REFRESH_BLOCKED_KEY);
}

export {
  clearAccessToken,
  readAccessToken,
  readSilentRefreshBlocked,
  saveAccessToken,
  setSilentRefreshBlocked,
};
