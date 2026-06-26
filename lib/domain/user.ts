import type { Address } from './order';

export type Role = 'guest' | 'member' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  addresses: Address[];
};
