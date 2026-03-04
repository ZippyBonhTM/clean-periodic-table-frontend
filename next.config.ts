import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultAllowedDevOrigins = ['localhost', '127.0.0.1', '192.168.3.5'];
const configuredAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);
const frontendRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: configuredAllowedDevOrigins ?? defaultAllowedDevOrigins,
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
