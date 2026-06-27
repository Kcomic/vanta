import { AuthError } from '@/lib/services/auth-service';

// Success redirects (server-side) — the client never reads a user payload, so the success
// variant carries NO User. This avoids serialising email/role to the client action-state wire.
export type AuthActionState =
  | { ok: true }
  | { ok: false; error: 'invalid_credentials' | 'email_taken' };

/** PURE: normalize any thrown value into a safe failed state. */
export function mapAuthError(err: unknown): Extract<AuthActionState, { ok: false }> {
  if (err instanceof AuthError && err.code === 'email_taken') {
    return { ok: false, error: 'email_taken' };
  }
  // invalid_credentials, unauthorized, forbidden, and anything unexpected
  return { ok: false, error: 'invalid_credentials' };
}
