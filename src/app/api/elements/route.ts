import { NextRequest, NextResponse } from 'next/server';

import { proxyAuthenticatedBackendRequest } from '@/shared/backend/proxyAuthenticatedBackendRequest';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return await proxyAuthenticatedBackendRequest({
    request,
    upstreamPath: '/elements',
    unresolvedUrlMessage: 'Could not resolve backend elements URL for this request.',
    networkFailureMessage: 'Failed to reach backend elements service.',
  });
}
