import { randomUUID } from 'node:crypto';
import type { User } from '@/lib/domain';
import type { UserRepository, CreateUserInput } from '@/lib/data/repositories';
import { seedUsers, type SeedUser } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

/** Drop the seed-only password so the domain User never carries credentials. */
function toDomainUser(seed: SeedUser): User {
  const { password: _password, ...user } = clone(seed);
  return user;
}

// Like the order store: Next.js dev runs Server Actions and RSC renders in separate module
// graphs, so a user registered in a Server Action must be readable by the account RSC. Back
// the runtime store with a process-global singleton so created users survive that boundary
// (a real DB adapter supersedes this). Tests pass an explicit seed to get an isolated store.
const USERS_KEY = Symbol.for('vanta.mock.users');

function sharedStore(): Map<string, SeedUser> {
  const g = globalThis as unknown as Record<symbol, Map<string, SeedUser> | undefined>;
  if (!g[USERS_KEY]) {
    g[USERS_KEY] = new Map(clone(seedUsers).map((u) => [u.id, u]));
  }
  return g[USERS_KEY]!;
}

export class MockUserRepository implements UserRepository {
  private users: Map<string, SeedUser>;

  constructor(seed?: SeedUser[]) {
    this.users = seed ? new Map(clone(seed).map((u) => [u.id, u])) : sharedStore();
  }

  async getById(userId: string): Promise<User | null> {
    const found = this.users.get(userId);
    return found ? toDomainUser(found) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === lower) return toDomainUser(u);
    }
    return null;
  }

  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const lower = email.toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === lower && u.password === password) return toDomainUser(u);
    }
    return null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const seedUser: SeedUser = {
      id: `usr_${randomUUID()}`,
      email: input.email,
      name: input.name,
      role: input.role ?? 'member',
      addresses: [],
      password: input.password,
    };
    this.users.set(seedUser.id, clone(seedUser));
    return toDomainUser(seedUser);
  }
}
