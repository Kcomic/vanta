import type { User } from '@/lib/domain';
import { users } from '@/lib/data';

export interface AuthService {
  login(email: string, password: string): Promise<User>; // throws on bad creds
  register(email: string, password: string, name: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>; // reads signed session cookie
}

/** Guards that throw a typed error when the session does not satisfy the role requirement. */
class AuthError extends Error {
  constructor(public readonly code: 'unauthorized' | 'forbidden') {
    super(code);
    this.name = 'AuthError';
  }
}

export const authService: AuthService = {
  async login(email: string, password: string): Promise<User> {
    const user = await users.verifyCredentials(email, password);
    if (!user) throw new AuthError('unauthorized');
    return user;
  },

  async register(_email: string, _password: string, _name: string): Promise<User> {
    // Phase 7: real registration writes a session cookie; mock defers.
    throw new AuthError('unauthorized');
  },

  async logout(): Promise<void> {
    // Phase 7: clear session cookie.
  },

  /**
   * Reads the signed session cookie to resolve the current user.
   * Returns null for unauthenticated (guest) visitors.
   * In Phase 5 the session cookie mechanism is not yet wired; always returns null.
   */
  async getCurrentUser(): Promise<User | null> {
    // Phase 7 wires the real cookie-based session. Until then every visitor is a guest.
    return null;
  },
};

/** Requires any authenticated user (role member or admin). Throws AuthError on failure. */
export async function requireUser(): Promise<User> {
  const user = await authService.getCurrentUser();
  if (!user || user.role === 'guest') throw new AuthError('unauthorized');
  return user;
}

/** Requires member or admin role. */
export async function requireMember(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'member' && user.role !== 'admin') throw new AuthError('forbidden');
  return user;
}

/** Requires admin role. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') throw new AuthError('forbidden');
  return user;
}
