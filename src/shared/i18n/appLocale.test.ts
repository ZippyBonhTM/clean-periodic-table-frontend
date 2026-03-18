import { describe, expect, it } from 'vitest';

import {
  readAppLocaleFromCookieHeader,
  resolveRequestAppLocale,
} from '@/shared/i18n/appLocale';

describe('appLocale', () => {
  it('reads a valid locale from the cookie header', () => {
    expect(readAppLocaleFromCookieHeader('foo=bar; app-locale=pt-BR; theme=dark')).toBe('pt-BR');
  });

  it('ignores an invalid locale in the cookie header', () => {
    expect(readAppLocaleFromCookieHeader('app-locale=es-ES')).toBeNull();
  });

  it('prefers the cookie locale over the accept-language header', () => {
    expect(
      resolveRequestAppLocale({
        cookieHeader: 'app-locale=en-US',
        acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8',
      }),
    ).toBe('en-US');
  });

  it('falls back to portuguese when accept-language prefers pt', () => {
    expect(
      resolveRequestAppLocale({
        acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8',
      }),
    ).toBe('pt-BR');
  });

  it('falls back to english when no preference is available', () => {
    expect(resolveRequestAppLocale()).toBe('en-US');
  });
});
