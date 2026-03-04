const ACCESS_TOKEN_KEY = 'clean_periodic_table_access_token';

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
}

function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export { clearAccessToken, readAccessToken, saveAccessToken };
