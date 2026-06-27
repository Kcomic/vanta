// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { useMotionPreference, MOTION_PREFERENCE_STORAGE_KEY } from '@/lib/motion/preference';

describe('useMotionPreference', () => {
  beforeEach(() => {
    localStorage.clear();
    useMotionPreference.setState({ preference: 'system' });
  });

  it('defaults to "system"', () => {
    expect(useMotionPreference.getState().preference).toBe('system');
  });

  it('setPreference updates state and persists to localStorage', () => {
    useMotionPreference.getState().setPreference('reduced');
    expect(useMotionPreference.getState().preference).toBe('reduced');
    const persisted = JSON.parse(localStorage.getItem(MOTION_PREFERENCE_STORAGE_KEY) ?? '{}');
    expect(persisted.state.preference).toBe('reduced');
  });

  it('cycles back to "full" then "system"', () => {
    const { setPreference } = useMotionPreference.getState();
    setPreference('full');
    expect(useMotionPreference.getState().preference).toBe('full');
    setPreference('system');
    expect(useMotionPreference.getState().preference).toBe('system');
  });
});
