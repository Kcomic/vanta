import type { User } from '@/lib/domain';

/** Seed-only credential carrier: password NEVER appears on the domain User. */
export type SeedUser = User & { password: string };

const tomAddress = {
  id: 'adr_member_1',
  fullName: 'Somchai Member',
  line1: '88 Sukhumvit Soi 11',
  line2: 'Unit 12A',
  city: 'Bangkok',
  postalCode: '10110',
  country: 'TH',
  phone: '+66 80 000 0000',
} as const;

export const seedUsers: SeedUser[] = [
  {
    id: 'usr_member',
    email: 'member@vanta.shop',
    name: 'Somchai Member',
    role: 'member',
    addresses: [tomAddress],
    password: 'vanta-demo',
  },
  {
    id: 'usr_admin',
    email: 'admin@vanta.shop',
    name: 'VANTA Admin',
    role: 'admin',
    addresses: [],
    password: 'vanta-admin',
  },
];
