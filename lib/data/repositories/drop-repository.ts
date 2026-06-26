import type { Drop } from '@/lib/domain';

export interface DropRepository {
  list(): Promise<Drop[]>;
  getById(dropId: string): Promise<Drop | null>;
  getActive(now: Date): Promise<Drop | null>;
}
