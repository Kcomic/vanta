import { describe, it, expect } from 'vitest';
import { MockUserRepository } from '@/lib/data/mock/user-repository.mock';
import { seedUsers } from '@/lib/data/mock/seed/users';

function repo() {
  return new MockUserRepository(seedUsers);
}

describe('MockUserRepository', () => {
  it('seeds exactly a member and an admin with stable ids', () => {
    const member = seedUsers.find((u) => u.role === 'member');
    const admin = seedUsers.find((u) => u.role === 'admin');
    expect(member?.id).toBe('usr_member');
    expect(member?.email).toBe('member@vanta.shop');
    expect(admin?.id).toBe('usr_admin');
    expect(admin?.role).toBe('admin');
  });

  it('the member ships with one country-first TH address (no US fields)', () => {
    const member = seedUsers.find((u) => u.id === 'usr_member');
    expect(member?.addresses).toHaveLength(1);
    const addr = member!.addresses[0]!;
    expect(addr.country).toBe('TH');
    expect(addr.postalCode).toMatch(/^\d{5}$/);
    // shape proof: no `state`/`zip` keys leaked onto the address
    expect(Object.keys(addr)).not.toContain('state');
    expect(Object.keys(addr)).not.toContain('zip');
  });

  it('getByEmail is case-insensitive and getById round-trips', async () => {
    const r = repo();
    expect((await r.getByEmail('MEMBER@VANTA.SHOP'))?.id).toBe('usr_member');
    expect((await r.getById('usr_member'))?.email).toBe('member@vanta.shop');
    expect(await r.getById('usr_missing')).toBeNull();
  });

  it('verifyCredentials returns the user only on an exact password match', async () => {
    const r = repo();
    expect((await r.verifyCredentials('member@vanta.shop', 'vanta-demo'))?.id).toBe('usr_member');
    expect(await r.verifyCredentials('member@vanta.shop', 'wrong')).toBeNull();
    expect(await r.verifyCredentials('nobody@vanta.shop', 'vanta-demo')).toBeNull();
  });
});
