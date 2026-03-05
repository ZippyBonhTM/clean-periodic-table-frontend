function normalizeBaseUrl(
  rawValue: string | undefined,
  fallback: string,
  envName: string,
): string {
  const trimmed = rawValue?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if ((trimmed === undefined || trimmed.length === 0) && isProduction) {
    throw new Error(`${envName} is required in production.`);
  }

  const candidate = trimmed?.length ? trimmed : fallback;

  try {
    const parsed = new URL(candidate);
    const normalizedPath =
      parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');

    return `${parsed.origin}${normalizedPath}`;
  } catch {
    throw new Error(`Invalid ${envName}: "${candidate}". Expected an absolute URL.`);
  }
}

function normalizeParsedUrl(parsed: URL): string {
  const normalizedPath =
    parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');

  return `${parsed.origin}${normalizedPath}`;
}

function resolveClientRuntimeBaseUrl(baseUrl: string): string {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return baseUrl;
  }

  try {
    const configured = new URL(baseUrl);
    const currentPage = new URL(window.location.href);

    // In local dev, keep API host aligned with current page host (localhost vs LAN IP)
    // to avoid cross-site cookie/session issues between devices.
    if (configured.hostname !== currentPage.hostname) {
      configured.hostname = currentPage.hostname;
      return normalizeParsedUrl(configured);
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
}

const configuredAuthApiUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_AUTH_API_URL,
  'http://localhost:3002',
  'NEXT_PUBLIC_AUTH_API_URL',
);

const configuredBackendApiUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_API_URL,
  'http://localhost:3001',
  'NEXT_PUBLIC_BACKEND_API_URL',
);

const publicEnv = {
  get authApiUrl() {
    return resolveClientRuntimeBaseUrl(configuredAuthApiUrl);
  },
  get backendApiUrl() {
    return resolveClientRuntimeBaseUrl(configuredBackendApiUrl);
  },
};

export default publicEnv;
