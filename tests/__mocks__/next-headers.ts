// Stub for 'next/headers' in Vitest (node env).
// Tests for pure guard logic (enforceRole/AuthError) do not exercise cookies().
export function cookies() {
  throw new Error('next/headers cookies() is not available in the test environment');
}
