import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import type {
  LoginInput,
  LoginResponse,
  ProfileResponse,
  RefreshResponse,
  RegisterInput,
  RegisterResponse,
  ValidateTokenResponse,
} from '@/shared/types/auth';

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

async function refreshAccessToken(): Promise<RefreshResponse> {
  return await requestJson<RefreshResponse>(resolveAuthRequestBaseUrl(), '/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
}

async function logoutSession(): Promise<void> {
  await requestJson<{ message: string }>(resolveAuthRequestBaseUrl(), '/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });
}

async function validateAccessToken(accessToken: string): Promise<ValidateTokenResponse> {
  return await requestJson<ValidateTokenResponse>(resolveAuthRequestBaseUrl(), '/api/auth/validate-token', {
    method: 'GET',
    token: accessToken,
    credentials: 'include',
  });
}

async function fetchProfile(accessToken: string): Promise<ProfileResponse> {
  return await requestJson<ProfileResponse>(resolveAuthRequestBaseUrl(), '/api/auth/profile', {
    method: 'GET',
    token: accessToken,
    credentials: 'include',
  });
}

export { fetchProfile, login, logoutSession, refreshAccessToken, register, validateAccessToken };
