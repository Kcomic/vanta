/**
 * Streaming fallback for the (account) route group. Synchronous + aria-hidden; `motion-safe:`
 * keeps the pulse off under prefers-reduced-motion.
 */
export default function AccountLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-6 py-16"
      aria-hidden="true"
    >
      <div className="h-9 w-40 rounded bg-smoke-900 motion-safe:animate-pulse" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-smoke-900 motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
