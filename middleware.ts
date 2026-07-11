import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';

// UX-ONLY: locale negotiation + optimistic prefix redirect. NEVER authorization.
// (Authorization is re-verified per call in services / Server Actions / the (account) layout.
//  This avoids the CVE-2025-29927 middleware-as-authz shape.)
export default createMiddleware(routing);

export const config = {
  // Match everything except Next internals, the API route, and static assets.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
