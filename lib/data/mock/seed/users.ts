import type { User } from '@/lib/domain';

/** Seed-only credential carrier: password NEVER appears on the domain User. */
export type SeedUser = User & { password: string };

const memberAddress = {
  id: 'addr_member_home',
  fullName: 'Ploy Srisai',
  line1: '128/4 Soi Sukhumvit 49',
  line2: 'Khlong Tan Nuea, Watthana',
  city: 'Bangkok',
  postalCode: '10110',
  country: 'TH',
  phone: '+66 81 234 5678',
} as const;

export const seedUsers: SeedUser[] = [
  {
    id: 'usr_member',
    email: 'member@vanta.shop',
    name: 'Ploy Srisai',
    role: 'member',
    addresses: [memberAddress],
    password: 'vanta-demo',
  },
  {
    id: 'usr_admin',
    email: 'admin@vanta.shop',
    name: 'VANTA Studio',
    role: 'admin',
    addresses: [],
    password: 'vanta-admin',
  },
];

/**
 * userId -> demo password (mock only; real adapter delegates to Auth.js).
 * Guest is the absence of a session cookie — not a row here.
 */
export const seedPasswords: Record<string, string> = {
  usr_member: 'vanta-demo',
  usr_admin: 'vanta-admin',
};
