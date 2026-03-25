import { NextRequest, NextResponse } from 'next/server';

import {
  applyResolvedAuthSessionCookies,
  resolveServerAuthSession,
} from '@/shared/auth/serverResolvedAuthSession';
import type { AuthSessionResponse } from '@/shared/types/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authSession = await resolveServerAuthSession(request);

  if (authSession.resolution === 'authenticated') {
    const response = NextResponse.json<AuthSessionResponse>({
      authenticated: true,
      accessToken: authSession.accessToken,
      userProfile: authSession.userProfile,
      message: authSession.message,
    });

    applyResolvedAuthSessionCookies(response, authSession);
    return response;
  }

  if (authSession.resolution === 'anonymous') {
    const response = NextResponse.json(
      {
        authenticated: false,
        accessToken: null,
        userProfile: null,
        message: authSession.message,
      },
      { status: 401 },
    );

    applyResolvedAuthSessionCookies(response, authSession);
    return response;
  }

  return NextResponse.json(
    { message: authSession.message },
    { status: authSession.statusCode },
  );
}
