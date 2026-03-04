import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import type {
  LoginInput,
  LoginResponse,
  RefreshResponse,
  RegisterInput,
  RegisterResponse,
  ValidateTokenResponse,
} from '@/shared/types/auth';

async function login(input: LoginInput): Promise<LoginResponse> {
  return await requestJson<LoginResponse>(publicEnv.authApiUrl, '/login', {
    method: 'POST',
    body: input,
    credentials: 'include',
  });
}

async function register(input: RegisterInput): Promise<RegisterResponse> {
  return await requestJson<RegisterResponse>(publicEnv.authApiUrl, '/register', {
    method: 'POST',
    body: input,
    credentials: 'include',
  });
}

async function refreshAccessToken(): Promise<RefreshResponse> {
  return await requestJson<RefreshResponse>(publicEnv.authApiUrl, '/refresh', {
    method: 'POST',
    credentials: 'include',
  });
}

async function validateAccessToken(accessToken: string): Promise<ValidateTokenResponse> {
  return await requestJson<ValidateTokenResponse>(publicEnv.authApiUrl, '/validate-token', {
    method: 'GET',
    token: accessToken,
    credentials: 'include',
  });
}

export { login, refreshAccessToken, register, validateAccessToken };
