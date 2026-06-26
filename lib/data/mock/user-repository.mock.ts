import type { User } from '@/lib/domain';
import type { UserRepository } from '@/lib/data/repositories';
import { seedUsers, type SeedUser } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

/** Drop the seed-only password so the domain User never carries credentials. */
function toDomainUser(seed: SeedUser): User {
  const { password: _password, ...user } = clone(seed);
  return user;
}

export class MockUserRepository implements UserRepository {
  private users: SeedUser[];

  constructor(seed: SeedUser[] = seedUsers) {
    this.users = clone(seed);
  }

  async getById(userId: string): Promise<User | null> {
    const found = this.users.find((u) => u.id === userId);
    return found ? toDomainUser(found) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const found = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return found ? toDomainUser(found) : null;
  }

  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const found = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    return found ? toDomainUser(found) : null;
  }
}
