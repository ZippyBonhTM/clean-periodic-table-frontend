import type { NextConfig } from 'next';

const defaultAllowedDevOrigins = ['localhost', '127.0.0.1', '192.168.3.5'];
const configuredAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: configuredAllowedDevOrigins ?? defaultAllowedDevOrigins,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
