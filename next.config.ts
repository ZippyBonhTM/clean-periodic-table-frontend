import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultAllowedDevOrigins = ['localhost', '127.0.0.1', '192.168.3.5'];
const configuredAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);
const frontendRoot = dirname(fileURLToPath(import.meta.url));
const defaultProductionHostname = 'clean-periodic-table.vercel.app';

function resolveHostname(value: string | undefined): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const withProtocol = value.includes('://') ? value : `https://${value}`;
  return new URL(withProtocol).hostname;
}

const canonicalHostname =
  resolveHostname(process.env.NEXT_PUBLIC_SITE_URL) ??
  resolveHostname(process.env.SITE_URL) ??
  resolveHostname(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  (process.env.NODE_ENV === 'production' ? defaultProductionHostname : null);

const productionVercelHostname =
  resolveHostname(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  defaultProductionHostname;

const shouldNoindexVercelHostname =
  canonicalHostname !== null &&
  !canonicalHostname.endsWith('.vercel.app') &&
  canonicalHostname !== productionVercelHostname;

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: configuredAllowedDevOrigins ?? defaultAllowedDevOrigins,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  headers: shouldNoindexVercelHostname
    ? async () => [
        {
          source: '/:path*',
          has: [{ type: 'host', value: productionVercelHostname }],
          headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
        },
      ]
    : undefined,
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
