import type { User, Role } from '@/lib/domain';

/** Input for creating a user — registration. Password is opaque to the domain (mock stores it; a real adapter hashes it). */
export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  role?: Role;
};

export interface UserRepository {
  getById(userId: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  /** Returns the user iff credentials match (mock checks seed password). */
  verifyCredentials(email: string, password: string): Promise<User | null>;
  /**
   * Creates and persists a NEW user (registration), returning the domain User with a unique id.
   * Owning this here — rather than the service handing every registrant the seed member's
   * identity — is what keeps registrants distinct (so OrderRepository.listByUser never mixes them).
   * A real adapter does a DB insert with a hashed password.
   */
  create(input: CreateUserInput): Promise<User>;
}
