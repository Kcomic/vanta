import type { User } from '@/lib/domain';

export interface UserRepository {
  getById(userId: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  /** Returns the user iff credentials match (mock checks seed password). */
  verifyCredentials(email: string, password: string): Promise<User | null>;
}
