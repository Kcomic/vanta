import 'server-only';
import { cookies } from 'next/headers';
import type { User, Role } from '@/lib/domain';
import { users } from '@/lib/data';
import { SESSION_COOKIE, signSession, verifySession } from './session';

export interface AuthService {
  login(email: string, password: string): Promise<User>; // throws on bad creds
  register(email: string, password: string, name: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>; // reads signed session cookie
}

/** Typed error so call sites/guards can branch without string-matching. */
export class AuthError extends Error {
  constructor(
    public readonly code: 'invalid_credentials' | 'email_taken' | 'unauthorized' | 'forbidden',
  ) {
    super(code);
    this.name = 'AuthError';
  }
}

const ONE_WEEK = 60 * 60 * 24 * 7;

async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK,
  });
}

class CookieAuthService implements AuthService {
  async login(email: string, password: string): Promise<User> {
    const user = await users.verifyCredentials(email, password);
    if (!user) throw new AuthError('invalid_credentials');
    await setSession(user.id);
    return user;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    const existing = await users.getByEmail(email);
    if (existing) throw new AuthError('email_taken');
    // Create a DISTINCT user via the repository (not the seed member's identity), so each
    // registrant has their own id and OrderRepository.listByUser never mixes them.
    const user = await users.create({ email, name, password, role: 'member' });
    await setSession(user.id);
    return user;
  }

  async logout(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }

  async getCurrentUser(): Promise<User | null> {
    const store = await cookies();
    const userId = verifySession(store.get(SESSION_COOKIE)?.value);
    if (!userId) return null;
    return users.getById(userId);
  }
}

export const authService: AuthService = new CookieAuthService();

/**
 * PURE authorization decision (testable without a request scope).
 * Guest (null) => 'unauthorized'; wrong role => 'forbidden'.
 */
export function enforceRole(user: User | null, allowed: readonly Role[]): User {
  if (!user) throw new AuthError('unauthorized');
  if (!allowed.includes(user.role)) throw new AuthError('forbidden');
  return user;
}

/**
 * Requires an authenticated user — role member OR admin (admin is a superset of member access).
 * Per errata #5: 'guest' is not a valid authenticated role — getCurrentUser() returning null
 * is the only guest path. This is the single "must be signed in" guard; there is deliberately
 * no separate requireUser, since the role model makes it identical.
 */
export async function requireMember(): Promise<User> {
  return enforceRole(await authService.getCurrentUser(), ['member', 'admin']);
}

/** Requires admin role. */
export async function requireAdmin(): Promise<User> {
  return enforceRole(await authService.getCurrentUser(), ['admin']);
}
