const SERVER_ACCESS_TOKEN_COOKIE_KEY = 'clean_periodic_table_server_access_token';

type JwtPayload = {
  exp?: unknown;
};

function decodeBase64Url(value: string): string | null {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(normalized);
    }

    return Buffer.from(normalized, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split('.');

  if (payload === undefined || payload.length === 0) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payload);

  if (decodedPayload === null) {
    return null;
  }

  try {
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function resolveTokenMaxAgeSeconds(token: string): number | undefined {
  const parsedPayload = parseJwtPayload(token);

  if (parsedPayload === null || typeof parsedPayload.exp !== 'number' || !Number.isFinite(parsedPayload.exp)) {
    return undefined;
  }

  const maxAgeSeconds = Math.floor(parsedPayload.exp - Date.now() / 1000);
  return maxAgeSeconds > 0 ? maxAgeSeconds : 0;
}

function readServerAccessTokenFromResponseBody(responseBody: string): string | null {
  if (responseBody.trim().length === 0) {
    return null;
  }

  try {
    const parsedResponse = JSON.parse(responseBody) as { accessToken?: unknown };

    if (typeof parsedResponse.accessToken !== 'string') {
      return null;
    }

    const normalizedToken = parsedResponse.accessToken.trim();
    return normalizedToken.length > 0 ? normalizedToken : null;
  } catch {
    return null;
  }
}

function stripServerAccessTokenCookie(cookieHeader: string | null): string | null {
  if (cookieHeader === null || cookieHeader.trim().length === 0) {
    return null;
  }

  const filteredCookies = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith(`${SERVER_ACCESS_TOKEN_COOKIE_KEY}=`));

  if (filteredCookies.length === 0) {
    return null;
  }

  return filteredCookies.join('; ');
}

export {
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
  readServerAccessTokenFromResponseBody,
  resolveTokenMaxAgeSeconds,
  stripServerAccessTokenCookie,
};
