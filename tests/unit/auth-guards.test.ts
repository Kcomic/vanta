import { describe, it, expect } from 'vitest';
import type { User } from '@/lib/domain';
import { enforceRole, AuthError } from '@/lib/services/auth-service';

const guest: User | null = null;
const member: User = {
  id: 'usr_member',
  email: 'member@vanta.shop',
  name: 'Ploy',
  role: 'member',
  addresses: [],
};
const admin: User = {
  id: 'usr_admin',
  email: 'admin@vanta.shop',
  name: 'Studio',
  role: 'admin',
  addresses: [],
};

describe('enforceRole (guard core)', () => {
  it('requireUser shape: member and admin pass; a guest is unauthorized', () => {
    // requireUser uses the ['member', 'admin'] allowlist (errata #5 dropped 'guest' — an
    // unauthenticated visitor is null, and a 'guest'-role user must not be admitted either).
    expect(enforceRole(member, ['member', 'admin']).id).toBe('usr_member');
    expect(enforceRole(admin, ['member', 'admin']).role).toBe('admin');
    expect(() => enforceRole(guest, ['member', 'admin'])).toThrowError(
      new AuthError('unauthorized'),
    );
  });

  it('requireMember shape: member and admin pass; guest blocked at the service layer', () => {
    expect(enforceRole(member, ['member', 'admin']).role).toBe('member');
    expect(enforceRole(admin, ['member', 'admin']).role).toBe('admin');
    let thrown: unknown;
    try {
      enforceRole(guest, ['member', 'admin']);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AuthError);
    expect((thrown as AuthError).code).toBe('unauthorized');
  });

  it('requireAdmin shape: a member is forbidden (not merely unauthorized)', () => {
    let thrown: unknown;
    try {
      enforceRole(member, ['admin']);
    } catch (e) {
      thrown = e;
    }
    expect((thrown as AuthError).code).toBe('forbidden');
    expect(enforceRole(admin, ['admin']).role).toBe('admin');
  });
});
