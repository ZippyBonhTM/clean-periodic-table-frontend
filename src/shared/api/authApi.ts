import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import type { LoginInput, LoginResponse } from '@/shared/types/auth';

async function login(input: LoginInput): Promise<LoginResponse> {
  return await requestJson<LoginResponse>(publicEnv.authApiUrl, '/login', {
    method: 'POST',
    body: input,
  });
}

export { login };
