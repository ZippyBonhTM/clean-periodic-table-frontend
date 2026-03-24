import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import { ApiError } from './httpClient';
import type {
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

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
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
  try {
    return await requestJson<ProfileResponse>(resolveAuthRequestBaseUrl(), '/api/auth/profile', {
      method: 'GET',
      token: accessToken,
      credentials: 'include',
    });
  } catch (caughtError: unknown) {
    if (!isUnauthorizedError(caughtError)) {
      throw caughtError;
    }

    const refreshResponse = await refreshAccessToken();

    return await requestJson<ProfileResponse>(resolveAuthRequestBaseUrl(), '/api/auth/profile', {
      method: 'GET',
      token: refreshResponse.accessToken,
      credentials: 'include',
    });
  }
}

export {
  fetchProfile,
  login,
  logoutSession,
  refreshAccessToken,
  register,
  validateAccessToken,
};
