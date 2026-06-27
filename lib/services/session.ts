import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'vanta_session';

/**
 * DEV-ONLY FALLBACK — checked-in so the portfolio demo runs zero-config locally.
 * In production, set SESSION_SECRET to a long random string (e.g. `openssl rand -hex 32`).
 * The real Auth.js / Iron Session adapter should supersede this module entirely.
 */
const DEV_FALLBACK = 'vanta-dev-session-secret-do-not-use-in-prod';

const SECRET = process.env.SESSION_SECRET ?? DEV_FALLBACK;

// Warn once at module initialisation when running in production without the env var.
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn(
    '[vanta] SESSION_SECRET is unset in production — using the insecure dev fallback. ' +
      'Set SESSION_SECRET to a long random string before deploying.',
  );
}

function sign(payloadB64: string): string {
  return createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
}

/** `base64url(userId).base64url(hmac)` */
export function signSession(userId: string): string {
  const payload = Buffer.from(userId, 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const userId = Buffer.from(payload, 'base64url').toString('utf8');
  return userId.length > 0 ? userId : null;
}
