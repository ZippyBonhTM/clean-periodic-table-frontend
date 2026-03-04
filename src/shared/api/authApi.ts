import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import type { LoginInput, LoginResponse, RegisterInput, RegisterResponse } from '@/shared/types/auth';

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

export { login, register };
