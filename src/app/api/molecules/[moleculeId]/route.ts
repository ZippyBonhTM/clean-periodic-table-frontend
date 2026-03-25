import { NextRequest, NextResponse } from 'next/server';

import { proxyAuthenticatedBackendRequest } from '@/shared/backend/proxyAuthenticatedBackendRequest';

type RouteContext = {
  params:
    | Promise<{
        moleculeId: string;
      }>
    | {
        moleculeId: string;
      };
};

async function proxyMoleculeItemRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const params = await context.params;
  const moleculeId = params.moleculeId?.trim() ?? '';

  if (moleculeId.length === 0) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return await proxyAuthenticatedBackendRequest({
    request,
    upstreamPath: `/molecules/${encodeURIComponent(moleculeId)}`,
    unresolvedUrlMessage: 'Could not resolve backend molecule URL for this request.',
    networkFailureMessage: 'Failed to reach backend molecule service.',
  });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return await proxyMoleculeItemRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return await proxyMoleculeItemRequest(request, context);
}
