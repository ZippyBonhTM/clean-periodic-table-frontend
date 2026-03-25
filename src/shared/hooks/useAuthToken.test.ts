import { describe, expect, it } from 'vitest';

import { shouldInvalidateCurrentToken } from '@/shared/hooks/useAuthToken';

describe('useAuthToken', () => {
  it('allows unconditional invalidation when no expected token is provided', () => {
    expect(shouldInvalidateCurrentToken('token-current')).toBe(true);
  });

  it('invalidates when the current token matches the expected stale request token', () => {
    expect(shouldInvalidateCurrentToken('token-current', 'token-current')).toBe(true);
  });

  it('preserves a newer token when a stale request tries to invalidate the session', () => {
    expect(shouldInvalidateCurrentToken('token-new', 'token-old')).toBe(false);
  });

  it('treats blank expected tokens as unconditional invalidation', () => {
    expect(shouldInvalidateCurrentToken('token-current', '   ')).toBe(true);
  });
});
