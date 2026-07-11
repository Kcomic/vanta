/**
 * Root-level not-found page. Rendered for 404s that fall outside the
 * [locale] segment (e.g. completely unknown paths with no locale prefix).
 * Must supply its own <html> because app/layout.tsx is a passthrough.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <h1>404 – Page not found</h1>
      </body>
    </html>
  );
}
