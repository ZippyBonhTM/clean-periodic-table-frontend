function normalizeBaseUrl(rawValue: string | undefined, fallback: string): string {
  const candidate = rawValue?.trim().length ? rawValue : fallback;

  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
}

const publicEnv = {
  authApiUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_AUTH_API_URL, 'http://localhost:3002'),
  backendApiUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API_URL, 'http://localhost:3001'),
};

export default publicEnv;
