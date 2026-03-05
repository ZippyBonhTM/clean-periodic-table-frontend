type JwtPayload = {
  exp?: unknown;
  name?: unknown;
  username?: unknown;
  given_name?: unknown;
  email?: unknown;
  sub?: unknown;
};

function parseJwtPayload(token: string): JwtPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const [, payload] = token.split('.');

  if (payload === undefined || payload.length === 0) {
    return null;
  }

  const normalized = payload
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(payload.length / 4) * 4, '=');

  try {
    const decodedPayload = window.atob(normalized);
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function readJwtExpiryMs(token: string): number | null {
  const parsedPayload = parseJwtPayload(token);

  if (parsedPayload === null || typeof parsedPayload.exp !== 'number' || !Number.isFinite(parsedPayload.exp)) {
    return null;
  }

  return parsedPayload.exp * 1000;
}

function normalizeJwtNameClaim(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function readJwtDisplayName(token: string): string | null {
  const parsedPayload = parseJwtPayload(token);

  if (parsedPayload === null) {
    return null;
  }

  return (
    normalizeJwtNameClaim(parsedPayload.name) ??
    normalizeJwtNameClaim(parsedPayload.username) ??
    normalizeJwtNameClaim(parsedPayload.given_name) ??
    normalizeJwtNameClaim(parsedPayload.email) ??
    normalizeJwtNameClaim(parsedPayload.sub)
  );
}

export { readJwtDisplayName, readJwtExpiryMs };
