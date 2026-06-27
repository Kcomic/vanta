export type Surface = 'dark' | 'paper';
export type TokenColor = 'ink' | 'paper' | 'blaze' | 'blaze-on-light' | 'lime';

/**
 * Design-token contract (verbatim from globals.css @theme):
 *  - lime (#D4FF2E) is lime-on-DARK ONLY (1.05:1 on paper => forbidden).
 *  - raw blaze (#FF3B1F) on paper is 3.23:1 => fails AA; use blaze-on-light (#D62E16).
 */
const ALLOWED: Record<TokenColor, Surface[]> = {
  ink: ['paper'],
  paper: ['dark'],
  blaze: ['dark'],
  'blaze-on-light': ['paper'],
  lime: ['dark'],
};

export function isColorAllowedOnSurface(color: TokenColor, surface: Surface): boolean {
  return ALLOWED[color].includes(surface);
}

export function assertColorOnSurface(color: TokenColor, surface: Surface): void {
  if (!isColorAllowedOnSurface(color, surface)) {
    throw new Error(
      `Token guard: "${color}" is not allowed on "${surface}" surface. ` +
        `lime is lime-on-dark ONLY; use blaze-on-light (not blaze) on paper.`,
    );
  }
}
