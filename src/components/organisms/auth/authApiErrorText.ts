'use client';

import type { AuthTextCatalog } from '@/components/organisms/auth/authText';
import { ApiError } from '@/shared/api/httpClient';

type AuthMode = 'login' | 'register';

function normalizeApiMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message.trim().toLowerCase();
  }

  return '';
}

function includesAny(message: string, fragments: string[]): boolean {
  return fragments.some((fragment) => message.includes(fragment));
}

export function resolveAuthApiErrorMessage(
  error: unknown,
  mode: AuthMode,
  text: AuthTextCatalog,
): string {
  const normalizedMessage = normalizeApiMessage(error);

  if (error instanceof ApiError && error.statusCode === 0) {
    return mode === 'login' ? text.login.networkError : text.register.networkError;
  }

  if (mode === 'login') {
    if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
      return text.login.invalidCredentials;
    }

    if (
      includesAny(normalizedMessage, [
        'invalid credentials',
        'invalid password',
        'invalid email',
        'incorrect password',
        'wrong password',
        'unauthorized',
      ])
    ) {
      return text.login.invalidCredentials;
    }

    if (error instanceof ApiError && error.statusCode === 429) {
      return text.login.rateLimited;
    }

    return text.login.fallbackError;
  }

  if (error instanceof ApiError && error.statusCode === 409) {
    return text.register.emailInUse;
  }

  if (
    includesAny(normalizedMessage, [
      'already exists',
      'already registered',
      'email is already',
      'email already',
      'duplicate',
    ])
  ) {
    return text.register.emailInUse;
  }

  if (error instanceof ApiError && error.statusCode === 429) {
    return text.register.rateLimited;
  }

  if (includesAny(normalizedMessage, ['weak password', 'password must', 'password should'])) {
    return text.register.weakPassword;
  }

  if (includesAny(normalizedMessage, ['invalid email', 'email must', 'email is invalid'])) {
    return text.register.invalidEmail;
  }

  if (includesAny(normalizedMessage, ['invalid name', 'name must', 'name is required'])) {
    return text.register.invalidName;
  }

  return text.register.fallbackError;
}
