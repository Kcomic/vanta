import { describe, it, expect } from 'vitest';
import { mapAuthError } from '@/lib/actions/auth-errors';
import { AuthError } from '@/lib/services/auth-service';

describe('mapAuthError', () => {
  it('maps invalid_credentials to a failed login state', () => {
    expect(mapAuthError(new AuthError('invalid_credentials'))).toEqual({
      ok: false,
      error: 'invalid_credentials',
    });
  });

  it('maps email_taken to a failed register state', () => {
    expect(mapAuthError(new AuthError('email_taken'))).toEqual({
      ok: false,
      error: 'email_taken',
    });
  });

  it('maps unknown/guard errors to invalid_credentials (never leaks internals)', () => {
    expect(mapAuthError(new AuthError('unauthorized'))).toEqual({
      ok: false,
      error: 'invalid_credentials',
    });
    expect(mapAuthError(new Error('boom'))).toEqual({ ok: false, error: 'invalid_credentials' });
  });
});
