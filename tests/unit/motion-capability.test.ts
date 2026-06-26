import { describe, it, expect } from 'vitest';
import { resolveMotionEnabled, type MotionSignals } from '@/lib/motion/capability';

const ideal: MotionSignals = { prefersNoPreference: true, pointerFine: true, saveData: false };

describe('resolveMotionEnabled', () => {
  it('enables motion when all three signals are ideal', () => {
    expect(resolveMotionEnabled(ideal)).toBe(true);
  });
  it('OS prefers reduced motion disables', () => {
    expect(resolveMotionEnabled({ ...ideal, prefersNoPreference: false })).toBe(false);
  });
  it('coarse pointer (touch) disables heavy wow', () => {
    expect(resolveMotionEnabled({ ...ideal, pointerFine: false })).toBe(false);
  });
  it('Save-Data disables', () => {
    expect(resolveMotionEnabled({ ...ideal, saveData: true })).toBe(false);
  });
  it('requires ALL three (AND, not OR)', () => {
    expect(
      resolveMotionEnabled({ prefersNoPreference: true, pointerFine: false, saveData: false }),
    ).toBe(false);
  });
});
