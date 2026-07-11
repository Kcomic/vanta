// next/font and geist/font modules are Next.js-only webpack transforms that
// cannot run outside the Next.js build pipeline. They are aliased to stub
// implementations in vitest.config.ts via resolve.alias, so no vi.mock() calls
// are needed here — the stubs are resolved at import time.
