function readJwtExpiryMs(token: string): number | null {
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
    const parsedPayload = JSON.parse(decodedPayload) as { exp?: unknown };

    if (typeof parsedPayload.exp !== 'number' || !Number.isFinite(parsedPayload.exp)) {
      return null;
    }

    return parsedPayload.exp * 1000;
  } catch {
    return null;
  }
}

export { readJwtExpiryMs };
