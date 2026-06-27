import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** User's explicit motion override.
 *  - 'system'  → defer to OS prefers-reduced-motion (default)
 *  - 'full'    → always animate regardless of OS setting
 *  - 'reduced' → always disable heavy motion regardless of OS setting
 */
export type MotionPreference = 'system' | 'full' | 'reduced';

export type MotionPreferenceState = {
  /** User's explicit override. 'system' defers to OS prefers-reduced-motion. */
  preference: MotionPreference;
  setPreference: (preference: MotionPreference) => void;
};

export const MOTION_PREFERENCE_STORAGE_KEY = 'vanta:motion-preference';

export const useMotionPreference = create<MotionPreferenceState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: MOTION_PREFERENCE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
