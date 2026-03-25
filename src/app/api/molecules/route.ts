import { NextRequest, NextResponse } from 'next/server';

import { proxyAuthenticatedBackendRequest } from '@/shared/backend/proxyAuthenticatedBackendRequest';

async function proxyMoleculesCollectionRequest(request: NextRequest): Promise<NextResponse> {
  return await proxyAuthenticatedBackendRequest({
    request,
    upstreamPath: '/molecules',
    unresolvedUrlMessage: 'Could not resolve backend molecule collection URL for this request.',
    networkFailureMessage: 'Failed to reach backend molecule service.',
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return await proxyMoleculesCollectionRequest(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return await proxyMoleculesCollectionRequest(request);
}
