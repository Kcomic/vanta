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

  describe('create (registration)', () => {
    it('persists a new user with a generated id, retrievable by id and email, no password leak', async () => {
      const r = new MockUserRepository([]);
      const u = await r.create({ email: 'new@vanta.shop', name: 'New', password: 'pw' });
      expect(u.id).toMatch(/^usr_/);
      expect(u.role).toBe('member');
      expect(Object.keys(u)).not.toContain('password');
      expect(await r.getById(u.id)).toMatchObject({ email: 'new@vanta.shop', name: 'New' });
      expect((await r.getByEmail('NEW@VANTA.SHOP'))?.id).toBe(u.id);
    });

    it('gives each registrant a DISTINCT id (never the shared seed member) so order history cannot mix', async () => {
      const r = new MockUserRepository([]);
      const a = await r.create({ email: 'a@vanta.shop', name: 'A', password: 'x' });
      const b = await r.create({ email: 'b@vanta.shop', name: 'B', password: 'y' });
      expect(a.id).not.toBe(b.id);
      expect(a.id).not.toBe('usr_member');
      expect(b.id).not.toBe('usr_member');
    });

    it('a freshly created user can authenticate with its own password', async () => {
      const r = new MockUserRepository([]);
      const u = await r.create({ email: 'c@vanta.shop', name: 'C', password: 'secret' });
      expect((await r.verifyCredentials('c@vanta.shop', 'secret'))?.id).toBe(u.id);
      expect(await r.verifyCredentials('c@vanta.shop', 'wrong')).toBeNull();
    });
  });
});
