import type { Drop } from '@/lib/domain';

export interface DropRepository {
  list(): Promise<Drop[]>;
  getById(dropId: string): Promise<Drop | null>;
  /**
   * Returns the drop whose window contains `now` (earlyAccessAt <= now < endAt),
   * or — for countdowns — the soonest not-yet-ended drop (earliest earlyAccessAt
   * with endAt in the future); null if all drops have ended.
   *
   * This is the sole consumer of `drop.endAt` for drop selection. Once a drop is
   * selected, per-variant availability is stock-based and does NOT consult endAt
   * (see `deriveAvailability`).
   */
  getActive(now: Date): Promise<Drop | null>;
}
