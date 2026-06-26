import { describe, it, expect } from 'vitest';
import { computeCountdown } from '@/lib/motion/countdown';

const SEC = 1000,
  MIN = 60 * SEC,
  HOUR = 60 * MIN,
  DAY = 24 * HOUR;

describe('computeCountdown', () => {
  it('breaks remaining ms into d/h/m/s', () => {
    const now = 0;
    const deadline = 2 * DAY + 3 * HOUR + 4 * MIN + 5 * SEC;
    expect(computeCountdown(deadline, now)).toEqual({
      total: deadline,
      done: false,
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
  });

  it('clamps to zero and reports done past the deadline', () => {
    const parts = computeCountdown(1000, 5000);
    expect(parts.total).toBe(0);
    expect(parts.done).toBe(true);
    expect(parts).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('reports done exactly at the deadline', () => {
    expect(computeCountdown(1000, 1000).done).toBe(true);
  });

  it('keeps hours/minutes/seconds within their cyclic ranges', () => {
    const parts = computeCountdown(25 * HOUR + 61 * SEC, 0);
    expect(parts.days).toBe(1);
    expect(parts.hours).toBe(1);
    expect(parts.minutes).toBe(1);
    expect(parts.seconds).toBe(1);
  });
});
