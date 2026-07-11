import { describe, it, expect } from 'vitest';
import type { Order, User } from '@/lib/domain';
import { canViewOrder } from '@/lib/services/order-access';

const member: User = {
  id: 'usr_member',
  email: 'member@vanta.shop',
  name: 'Member',
  role: 'member',
  addresses: [],
};
const other: User = { ...member, id: 'usr_other', email: 'other@vanta.shop' };
const admin: User = { ...member, id: 'usr_admin', role: 'admin' };

const memberOrder = { userId: 'usr_member' } as Pick<Order, 'userId'>;
const guestOrder = { userId: null } as Pick<Order, 'userId'>;

describe('canViewOrder', () => {
  it('lets a guest order (userId null) be viewed by anyone — it is gated by its unguessable id', () => {
    expect(canViewOrder(guestOrder, null)).toBe(true);
    expect(canViewOrder(guestOrder, member)).toBe(true);
  });

  it('keeps a member order private to its owner', () => {
    expect(canViewOrder(memberOrder, member)).toBe(true);
  });

  it('blocks a logged-out viewer from a member order', () => {
    expect(canViewOrder(memberOrder, null)).toBe(false);
  });

  it('blocks a different member from another member order (the IDOR case)', () => {
    expect(canViewOrder(memberOrder, other)).toBe(false);
  });

  it('lets an admin view any member order', () => {
    expect(canViewOrder(memberOrder, admin)).toBe(true);
  });
});
