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
    // Mock path: registration is a non-goal beyond the seam. If the email is a
    // known seed user, treat it as taken; otherwise log the member in as a demo.
    const existing = await users.getByEmail(email);
    if (existing) throw new AuthError('email_taken');
    // No write-back in the mock (no churn sim); hand the registrant the demo member identity.
    const member = await users.getById('usr_member');
    if (!member) throw new AuthError('invalid_credentials');
    await setSession(member.id);
    return { ...member, email, name };
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
 * Requires any authenticated user (role member or admin).
 * Per errata #5: 'guest' is not a valid authenticated role — getCurrentUser() returning null
 * is the only guest path.
 */
export async function requireUser(): Promise<User> {
  return enforceRole(await authService.getCurrentUser(), ['member', 'admin']);
}

/** Requires member or admin role. */
export async function requireMember(): Promise<User> {
  return enforceRole(await authService.getCurrentUser(), ['member', 'admin']);
}

/** Requires admin role. */
export async function requireAdmin(): Promise<User> {
  return enforceRole(await authService.getCurrentUser(), ['admin']);
}
