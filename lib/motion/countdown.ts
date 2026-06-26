export type CountdownParts = {
  total: number;
  done: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function computeCountdown(deadlineMs: number, nowMs: number): CountdownParts {
  const total = Math.max(0, deadlineMs - nowMs);
  return {
    total,
    done: total === 0,
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MIN),
    seconds: Math.floor((total % MIN) / SEC),
  };
}
