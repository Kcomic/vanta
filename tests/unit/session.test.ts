import { describe, it, expect, vi, afterEach } from 'vitest';
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

describe('session secret fail-fast', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws at init in production runtime when SESSION_SECRET is unset (fails closed)', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', ''); // not the build phase
    vi.stubEnv('SESSION_SECRET', ''); // unset / empty
    await expect(import('@/lib/services/session')).rejects.toThrow(/SESSION_SECRET/);
  });

  it('does NOT throw during `next build` (NEXT_PHASE=phase-production-build)', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.stubEnv('SESSION_SECRET', '');
    await expect(import('@/lib/services/session')).resolves.toBeDefined();
  });

  it('does NOT throw in production when SESSION_SECRET is set', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', '');
    vi.stubEnv('SESSION_SECRET', 'a-real-long-random-secret');
    await expect(import('@/lib/services/session')).resolves.toBeDefined();
  });
});
