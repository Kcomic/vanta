import { describe, it, expect } from 'vitest';
import { signSession, verifySession, SESSION_COOKIE } from '@/lib/services/session';

describe('session token', () => {
  it('exposes the canonical cookie name', () => {
    expect(SESSION_COOKIE).toBe('vanta_session');
  });

  it('round-trips a signed user id', () => {
    const token = signSession('usr_member');
    expect(token).toContain('.');
    expect(verifySession(token)).toBe('usr_member');
  });

  it('rejects undefined, empty, malformed and tampered tokens', () => {
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession('')).toBeNull();
    expect(verifySession('not-a-token')).toBeNull();

    const token = signSession('usr_member');
    const [payload] = token.split('.');
    // keep the valid payload, swap in a bogus signature
    expect(verifySession(`${payload}.deadbeef`)).toBeNull();
    // tamper the payload, keep the old signature
    const forged = `${Buffer.from('usr_admin').toString('base64url')}.${token.split('.')[1]}`;
    expect(verifySession(forged)).toBeNull();
  });
});
