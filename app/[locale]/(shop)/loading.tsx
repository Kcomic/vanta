/**
 * Streaming fallback for the (shop) route group (home / shop / product / collections / search).
 * Synchronous + aria-hidden so it paints instantly; `motion-safe:` keeps the pulse off under
 * prefers-reduced-motion, matching the project's motion discipline.
 */
export default function ShopLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-6 py-16"
      aria-hidden="true"
    >
      <div className="h-10 w-48 rounded bg-smoke-900 motion-safe:animate-pulse" />
      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] rounded bg-smoke-900 motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
