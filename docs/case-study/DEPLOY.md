# VANTA® — Vercel deploy checklist

1. `vercel link` then `vercel --prod` (framework auto-detected as Next.js).
2. Confirm region `sin1` (Singapore — closest to the Bangkok story).
3. No real secrets required: the mock adapters are the data layer. (When a real
   backend is wired, set `DATABASE_URL` and the `authService`/`PaymentService`
   env here — the swap is `lib/data/index.ts`, not the deploy config.)
4. Set `NEXT_PUBLIC_SITE_URL` to the production origin (e.g. `https://vanta.vercel.app`)
   so the OG image URL resolves correctly in social unfurl previews.
5. **Demo creds are intentionally visible** on `/login`: `member@vanta.shop` /
   `vanta-demo`.
6. Smoke the live URL:
   - `/en` and `/th` both load; LIVE DROP countdown ticks (or shows the static
     fallback under reduced motion).
   - `/en/checkout/ord_seed_demo` renders the seeded confirmation instantly.
   - `curl -s https://<url>/api/products | jq '.[0].slug'` returns a slug.
7. Verify the OG image: paste the live URL into a link unfurl preview; the
   `opengraph-image` (void-black VANTA® lockup) renders at 1200×630.

## Hero demo video (the OG/demo asset)

Record the **Tier-1 hero slice** at 1440px desktop, reduced-motion OFF, in EN:
Home (LIVE DROP countdown + magnetic CTA) → click a card (View Transition into
PDP) → swatch swap → add to cart (drawer slides in, stock ticks down) →
checkout → premium confirmation. ~20–30s, no cuts. Export MP4 +
poster frame; link it from the README and use it as the social preview where
video unfurls are supported. Store under `docs/case-study/hero-demo.mp4`.
