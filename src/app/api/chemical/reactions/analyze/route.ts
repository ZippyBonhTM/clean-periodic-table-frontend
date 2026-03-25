import { NextRequest, NextResponse } from 'next/server';

import { proxyAuthenticatedBackendRequest } from '@/shared/backend/proxyAuthenticatedBackendRequest';

export async function POST(request: NextRequest): Promise<NextResponse> {
  return await proxyAuthenticatedBackendRequest({
    request,
    upstreamPath: '/chemical/reactions/analyze',
    authMode: 'optional',
    unresolvedUrlMessage:
      'Could not resolve backend chemical analysis URL for this request.',
    networkFailureMessage: 'Failed to reach backend chemical analysis service.',
  });
}
