import type { Drop } from '@/lib/domain';
import type { DropRepository } from '@/lib/data/repositories';
import { seedDrops } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

export class MockDropRepository implements DropRepository {
  private drops: Drop[];

  constructor(seed: Drop[] = seedDrops) {
    this.drops = clone(seed);
  }

  async list(): Promise<Drop[]> {
    return clone(this.drops);
  }

  async getById(dropId: string): Promise<Drop | null> {
    const found = this.drops.find((d) => d.id === dropId);
    return found ? clone(found) : null;
  }

  async getActive(now: Date): Promise<Drop | null> {
    const active = this.drops.find(
      (d) => new Date(d.earlyAccessAt) <= now && now < new Date(d.endAt),
    );
    return active ? clone(active) : null;
  }
}
