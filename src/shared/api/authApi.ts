import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import type {
  AuthSessionResponse,
  LoginInput,
  LoginResponse,
  ProfileResponse,
  RefreshResponse,
  RegisterInput,
  RegisterResponse,
  ValidateTokenResponse,
} from '@/shared/types/auth';

let pendingRefreshRequest: Promise<RefreshResponse> | null = null;
const pendingValidationRequests = new Map<string, Promise<ValidateTokenResponse>>();
const pendingSessionRequests = new Map<string, Promise<AuthSessionResponse>>();

function resolveAuthRequestBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return publicEnv.authApiUrl;
}

async function login(input: LoginInput): Promise<LoginResponse> {
  return await requestJson<LoginResponse>(resolveAuthRequestBaseUrl(), '/api/auth/login', {
    method: 'POST',
    body: input,
    credentials: 'include',
  });
}

async function register(input: RegisterInput): Promise<RegisterResponse> {
  return await requestJson<RegisterResponse>(resolveAuthRequestBaseUrl(), '/api/auth/register', {
    method: 'POST',
    body: input,
    credentials: 'include',
  });
}

async function requestRefreshAccessToken(): Promise<RefreshResponse> {
  return await requestJson<RefreshResponse>(resolveAuthRequestBaseUrl(), '/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
}

async function refreshAccessToken(): Promise<RefreshResponse> {
  if (pendingRefreshRequest !== null) {
    return pendingRefreshRequest;
  }

  pendingRefreshRequest = requestRefreshAccessToken().finally(() => {
    pendingRefreshRequest = null;
  });

  return pendingRefreshRequest;
}

function buildPendingSessionRequestKey(accessToken?: string | null): string {
  const normalizedToken = accessToken?.trim() ?? '';
  return normalizedToken.length > 0 ? normalizedToken : '__anonymous__';
}

async function requestResolveAuthSession(accessToken?: string | null): Promise<AuthSessionResponse> {
  const normalizedToken = accessToken?.trim() ?? '';

  return await requestJson<AuthSessionResponse>(resolveAuthRequestBaseUrl(), '/api/auth/session', {
    method: 'GET',
    token: normalizedToken.length > 0 ? normalizedToken : undefined,
    credentials: 'include',
  });
}

async function resolveAuthSession(accessToken?: string | null): Promise<AuthSessionResponse> {
  const requestKey = buildPendingSessionRequestKey(accessToken);
  const pendingRequest = pendingSessionRequests.get(requestKey);

  if (pendingRequest !== undefined) {
    return pendingRequest;
  }

  const nextRequest = requestResolveAuthSession(accessToken).finally(() => {
    pendingSessionRequests.delete(requestKey);
  });

  pendingSessionRequests.set(requestKey, nextRequest);
  return nextRequest;
}

async function logoutSession(): Promise<void> {
  await requestJson<{ message: string }>(resolveAuthRequestBaseUrl(), '/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });
}

async function requestValidateAccessToken(accessToken: string): Promise<ValidateTokenResponse> {
  return await requestJson<ValidateTokenResponse>(resolveAuthRequestBaseUrl(), '/api/auth/validate-token', {
    method: 'GET',
    token: accessToken,
    credentials: 'include',
  });
}

async function validateAccessToken(accessToken: string): Promise<ValidateTokenResponse> {
  const pendingRequest = pendingValidationRequests.get(accessToken);

  if (pendingRequest !== undefined) {
    return pendingRequest;
  }

  const nextRequest = requestValidateAccessToken(accessToken).finally(() => {
    pendingValidationRequests.delete(accessToken);
  });

  pendingValidationRequests.set(accessToken, nextRequest);
  return nextRequest;
}

async function fetchProfile(accessToken: string): Promise<ProfileResponse> {
  const sessionResponse = await resolveAuthSession(accessToken);

  return {
    accessToken: sessionResponse.accessToken,
    userProfile: sessionResponse.userProfile,
    message: sessionResponse.message,
  };
}

export {
  fetchProfile,
  login,
  logoutSession,
  refreshAccessToken,
  resolveAuthSession,
  register,
  validateAccessToken,
};
