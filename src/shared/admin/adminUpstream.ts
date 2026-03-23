type AdminAuthorizationSource = 'legacy-auth' | 'backend' | 'auto';

function normalizeBaseUrl(rawValue: string | undefined): string | null {
  const trimmed = rawValue?.trim() ?? '';

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedPath =
      parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');

    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

function resolveAdminAuthorizationSource(): AdminAuthorizationSource {
  const configuredSource =
    process.env.ADMIN_AUTHZ_SOURCE?.trim().toLowerCase() ??
    process.env.NEXT_PUBLIC_ADMIN_AUTHZ_SOURCE?.trim().toLowerCase() ??
    '';

  if (
    configuredSource === 'legacy-auth' ||
    configuredSource === 'backend' ||
    configuredSource === 'auto'
  ) {
    return configuredSource;
  }

  return 'legacy-auth';
}

function resolveAdminUpstreamBaseUrl(): string | null {
  return (
    normalizeBaseUrl(process.env.ADMIN_API_URL) ??
    normalizeBaseUrl(process.env.BACKEND_API_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API_URL)
  );
}

function buildAdminUpstreamApiUrl(path: string): URL | null {
  const baseUrl = resolveAdminUpstreamBaseUrl();

  if (baseUrl === null) {
    return null;
  }

  const normalizedPath = path.trim().replace(/^\/+/, '');

  if (normalizedPath.length === 0) {
    return null;
  }

  return new URL(normalizedPath, `${baseUrl}/`);
}

function resolveAdminProxyTarget(): 'legacy-auth' | 'backend' {
  const source = resolveAdminAuthorizationSource();

  if (source === 'legacy-auth') {
    return 'legacy-auth';
  }

  if (source === 'backend') {
    return 'backend';
  }

  return resolveAdminUpstreamBaseUrl() === null ? 'legacy-auth' : 'backend';
}

function canFallbackToLegacyAdminAuthorization(): boolean {
  const source = resolveAdminAuthorizationSource();
  return source === 'legacy-auth' || source === 'auto';
}

export {
  buildAdminUpstreamApiUrl,
  canFallbackToLegacyAdminAuthorization,
  resolveAdminAuthorizationSource,
  resolveAdminProxyTarget,
  resolveAdminUpstreamBaseUrl,
};
export type { AdminAuthorizationSource };
