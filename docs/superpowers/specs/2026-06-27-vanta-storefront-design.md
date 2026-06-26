# VANTA® — Storefront Design Spec

**Date:** 2026-06-27
**Status:** Design (awaiting final approval → implementation plan)
**Type:** Portfolio showcase — bilingual (EN/TH) streetwear e-commerce, frontend-first, backend-ready

---

## 1. Purpose & success criteria

A **portfolio showcase** by a senior freelance frontend developer whose lived edge is backend integration. VANTA must do two jobs at once:

1. **Make a viewer feel "I want to buy this"** within ~60–90 seconds — award-tier visual craft and one unforgettable interaction.
2. **Prove senior application architecture** — a real, stateful storefront (cart, auth, inventory, drops) built so a real backend plugs in by changing *one import*, not rewriting the UI.

**Definition of done (portfolio terms):**
- Deployed live on Vercel with visible demo login credentials and seeded data so the full buy-journey walks instantly.
- One hero slice (Home → PDP → cart → **live drop**) polished to 100%.
- A case study that names the architecture seam and cross-links the author's other pieces (AETHER = craft, VANTA = application architecture, Astro site = backend) into one coherent senior story.
- Both locales (EN/TH) correct, including Thai typography and formatting.

**Explicit non-goals (deliberately NOT built — narrated in the case study instead):** real payments, a CMS, full account CRUD depth, capability-map RBAC, Thai administrative-division address cascade, reprice/archive churn simulation, CI performance/a11y pipelines.

---

## 2. Locked decisions

| Dimension | Decision |
|---|---|
| Vertical | Fashion / Streetwear |
| Framework | **Next.js 15 (App Router) + React 19.2** |
| Visual mood | Bold Hype / Streetwear, governed by one concept: **VANTA = the void** |
| Phase-1 scope | Full front-of-house: Storefront + Lookbook + Checkout + Auth/Member (scaffolded, polish-ranked) |
| Brand | Invented — **VANTA®**, "Bangkok-born. Globally worn." |
| Language | Full bilingual **EN/TH** |
| Actors | guest (user) · member (สมาชิก) · admin (route group + guard reserved, UI built later) |
| Architecture | **Approach A** — Repository pattern + Server Components + Server Actions + cookie cart, single swap point `lib/data/index.ts` |

### Decisions resolved this round (user calls)
- **Accent color:** keep acid lime but **restrain hard** — `<5%` coverage, **token-enforced** (`lime-on-dark` only; lint/forbid lime-on-paper at 1.05:1). Blaze red is the signature urgency color.
- **Display typeface:** **paired** — a characterful Latin display + a dedicated Thai display face, with **per-locale headline tokens**.
- **Checkout:** **collapse to 1–2 steps** + an over-invested, shareable confirmation screen; payment behind a `PaymentService` seam (target Stripe/Omise) with a convincing mock.
- **Cart state:** **keep Zustand** as a durable client mirror — *but* cookie is the source of truth, Zustand is hydrated from the server-rendered cart, every mutation funnels through a Server Action and reconciles from its return value, `useOptimistic` covers the in-flight add. (Captures the convenience of a client store without the 3-source-of-truth desync risk.)

---

## 3. Why this validates "backend-ready" (the thesis)

The whole point is that **the UI never knows where data comes from.** Server Components read through repository *interfaces*; Server Actions mutate through *services*. Phase 1 wires a mock adapter (typed seed data). Going live means swapping the adapter behind `lib/data/index.ts` (e.g. Prisma/Postgres or an external API) — **the components, actions, and types are untouched.**

This seam is made **visible** as the primary selling artifact: an architecture diagram + a 2–3 line "how a real backend plugs in" (NestJS / Prisma / Postgres / OAuth / webhooks) + a curl-able `/api` endpoint a reviewer can hit. (We do **not** wire a contrived client-fetched `/api` route just to populate the network tab — that would perform backend-ness against the RSC story.)

---

## 4. Architecture

### 4.1 Layering

```
lib/
  domain/        # pure types: Product, Variant, Collection, Drop, CartItem, Order, OrderLineItem, User, Address, Money
  data/
    repositories/  # interfaces: ProductRepository, CollectionRepository, OrderRepository, UserRepository, CartStore
    mock/          # seed data + mock adapters implementing the interfaces (phase 1)
    index.ts       # ← THE SWAP POINT: exports the active adapter set (mock now, prisma/api later)
  services/      # business logic: cartService, authService, checkoutService, dropService, paymentService
  actions/       # 'use server' Server Actions calling services (addToCart, login, placeOrder, ...)
  i18n/          # next-intl config, locale helpers
  format/        # Intl helpers (money, date — forced gregory calendar)
  motion/        # capability hook, reduced-motion + View Transition helpers
```

**Rules (senior signals, cheap to honor now):**
- Repositories are **async and request-context-free** — they never call `cookies()`/`headers()`/`next-intl` internally; `userId`/`locale` are passed as arguments. (Keeps the swap clean and units testable.)
- **Authorization lives in the DAL / service / Server-Action layer**, re-verified in every account page *and* every Server Action. **Middleware is UX-only** (locale + optimistic redirect). Each Server Action is treated as a public POST and gated in the service. *(Avoids the CVE-2025-29927 middleware-as-authz shape.)*
- Roles use simple `requireUser()` / `requireMember()` guards. (Capability-map RBAC is narrated in the case study as "how it scales," not built — enterprise-IAM theater on a 2-role store.)

### 4.2 Cart state model (with kept Zustand)
- **Source of truth:** signed cookie (works for guests, survives reload), read by RSC.
- **Mutations:** Server Actions → `cartService` → returns the new authoritative cart.
- **Client mirror:** Zustand store **hydrated from the server-rendered cart**; updated only from Server Action return values; `useOptimistic` handles the in-flight add-to-cart so the drawer feels instant.
- **Invariant:** Zustand never invents cart state; it only reflects server truth. One reconciliation path.

### 4.3 Auth (mock → real path)
- Phase 1: signed-cookie session, 3 seed users (guest-able, member, admin-reserved). Visible demo creds on `/login`.
- Designed to swap to **Auth.js (NextAuth)** later — the `authService` interface is what gets a real adapter.

### 4.4 Money & orders (cheap-now contracts)
- **Money = integer minor units + currency**: `{ amount: 129000, currency: 'THB' }`. One `Intl.NumberFormat` helper keyed by locale. THB for both locales, no fake FX. `compareAtPrice` drives the sale/urgency UI from real data.
- **`OrderLineItem` is a self-contained snapshot type** (title/variant/unitPrice/image/sku at purchase time); `Order` stores its own totals breakdown + status + `placedAt`. We **build the type and show it in the diagram** but do **not** simulate archive/reprice churn (seed data never desyncs).
- **Date formatting forces `calendar: 'gregory'`** to avoid the Thai Buddhist-era year trap (2567) on confirmations; Western digits in both locales.

---

## 5. Domain model (key types)

```ts
// Variant is the purchasable unit (SKU). Every wow feature renders variant state.
type Variant = {
  id: string
  sku: string
  optionValues: { size: string; color: string }
  price: Money
  compareAtPrice?: Money
  stock: number
  availability: Availability   // derived, see §6
}

type Product = {
  id: string
  slug: string
  title: LocalizedText         // { en, th }
  description: LocalizedText
  optionAxes: { size: string[]; color: string[] }
  variants: Variant[]
  imagesByColor: Record<string, ProductImage[]>   // images attach to color variants
  collectionIds: string[]
  dropId?: string
}

type Drop = { id: string; releaseAt: string; earlyAccessAt: string; endAt: string }

type CartItem = { variantId: string; quantity: number }   // references variant, not product
type Money = { amount: number; currency: 'THB' }
```

`LocalizedText` everywhere user-facing copy lives so both locales are first-class, not bolted on.

---

## 6. The hero: LIVE DROP (the one unforgettable interaction)

A single feature that is **both** the visual hero **and** the architecture proof (inventory + auth gating + derivation).

- **Availability state machine** — one pure service function `deriveAvailability(variant, drop, now, user)` returning a union read identically by home / catalog / PDP / marquee:
  `coming_soon → early_access → live → low_stock → sold_out`
- **Real countdown → LIVE flip** (deadline is cacheable; the per-second tick is a client island, never a re-fetch).
- **Stock ticks down** on add-to-cart (in-session, from seed).
- **Auth-gated early access** visibly unlocks for the seed member when logged in.
- Seed **2–3 genuinely sold-out** and **3–4 "Only N left"** so scarcity reads real (never SOLD OUT on a buyable item).
- "Notify me" on sold-out is a **visual-only** button (no backend plumbing).

---

## 7. Information architecture (routes)

```
app/[locale]/                    # en | th
  (shop)/
    page.tsx                     # Home — hero + LIVE DROP + featured + lookbook teaser   [Tier 1]
    shop/page.tsx                # Catalog — filter (size/color/category/price) + sort     [Tier 2]
    product/[slug]/page.tsx      # PDP — lean, variant-state proof                          [Tier 1]
    collections/page.tsx         # Lookbook index                                          [Tier 2]
    collections/[slug]/page.tsx  # Lookbook editorial (one stunning template)              [Tier 2]
    search/page.tsx              # Search results                                          [Tier 3]
  (checkout)/
    cart/page.tsx                # Cart page (+ global cart drawer)                         [Tier 1]
    checkout/page.tsx            # 1–2 step checkout, PaymentService mock                   [Tier 2]
    checkout/[orderId]/page.tsx  # Premium, shareable confirmation                         [Tier 1]
  (auth)/
    login/page.tsx · register/page.tsx                                                     [Tier 2]
  (account)/                     # member-only; authz in DAL, not middleware
    page.tsx                     # Dashboard                                               [Tier 3]
    orders · addresses · settings   # one tasteful example each, correct+clean, not motion-polished
  (admin)/                       # reserved route group + guard only; built later
api/                             # documented, curl-able JSON endpoint (the seam, made visible)
```

**Effort ranking (the senior judgment):** breadth is scaffolded; *polish* is concentrated.
- **Tier 1 (max craft):** Home + LIVE DROP, PDP, cart drawer, confirmation. Recorded as the OG/demo video.
- **Tier 2 (flawless but lean):** catalog, lookbook template, checkout, auth.
- **Tier 3 (correct + clean):** search, account pages — guards present, not motion-polished.

### PDP scope (lean, not a second hero)
Build only what proves variant-as-SKU state and feeds the drop: sticky buy panel, swatch-swaps-gallery, greyed/sold-out sizes, low-stock badge, View Transition in. Size & Fit = one tasteful drawer *if time allows*. **Cut:** fake reviews, cross-sell strip (breadth + fake-data risk, zero wow).

---

## 8. Actors & roles

| Actor | Phase-1 capabilities |
|---|---|
| **Guest (user)** | browse, search, add to cart, guest checkout |
| **Member (สมาชิก)** | + order history, saved address (one example), early-access drops, dashboard |
| **Admin** | route group + role guard reserved; product/order/inventory UI built later |

---

## 9. Design system

### Concept
**VANTA = the void** — Bangkok emerging out of pure black. Products *materialize out of black*. The concept governs palette, type, motion, and the bilingual lockup, and gives a principled reason to restrain lime and demote the marquee.

### Palette (token-enforced)
```
--ink     #0A0A0A   canvas
--paper   #F5F4EF   text / light surfaces
--blaze   #FF3B1F   signature urgency (drop timer, sale, sold-out)
--blaze-on-light     darker variant — paper-red is 3.23:1, needs AA-safe variant
--lime    #D4FF2E   accent, <5% coverage, lime-on-dark ONLY (token-forbidden on paper)
--smoke   greys (cards / dividers / muted)
```

### Typography (paired, per-locale headline tokens)
- **Latin display:** characterful, NOT Anton (candidates: Archivo Expanded/Black, Clash Display) — ALL-CAPS + tight tracking for `:lang(en)`.
- **Thai display:** **Kanit** (Black/SemiBold) — geometric, strong heavy weights, reads streetwear; **no ALL-CAPS, looser tracking, taller line-height** for tone/vowel marks via `:lang(th)` tokens.
- **Body:** Geist (Latin) + IBM Plex Sans Thai / Anuphan (Thai).
- **Mono:** Geist Mono (price / SKU / countdown — technical accent).
- **Hard rule:** Anton has zero Thai glyphs; a real Thai display weight is mandatory or the TH headline breaks.

### Layout
8pt spacing, 1440 max-width, 12-col grid, asymmetric editorial composition.

---

## 10. Motion (surgical, not a buffet)

| Effect | Decision |
|---|---|
| View Transitions card→PDP | **Keep** — React 19.2 `<ViewTransition>` primitive; `view-transition-name` keyed on product id (locale-stable); reduced-motion = hard cut; no-op fallback. Highest wow-per-byte. |
| LIVE DROP countdown/flip | **Keep** — client island. |
| Magnetic buttons | **Keep on 1–2 hero CTAs only** — rAF-throttled, desktop + no-reduced-motion. |
| WebGL / displacement | **Hero + lookbook only (1–3 instances)**; catalog grid uses CSS clip-path/mask reveal; pause offscreen via IntersectionObserver. |
| Marquee | **Demoted** to supporting texture (English `DROP` / `SOLD OUT` in both locales — a literal Thai translation reads as "a droplet"). |
| Site-wide Lenis smooth scroll | **Dropped** (main-thread scroll-hijack, INP regression on mobile; no ScrollSmoother substitute). |
| Global custom cursor | **Cut** (2021 "portfolio tell," breaks affordances). |
| GSAP | Used where it earns it; **no licensing worry** (free since Apr 2025). |

### Reduced motion = a real second experience
- Honored in **JS via `matchMedia`** so GSAP/View Transitions actually obey it.
- Content is **visible by default then animates in** (never stuck at `opacity:0` → never a blank-page failure).
- Static fallbacks convey countdown/marquee info.
- An **in-UI motion toggle**.
- Heavy wow gated on `reduced-motion: no-preference` **AND** `pointer:fine` **AND** not `Save-Data` only — **no** `deviceMemory`/`cores` arithmetic (coarse + absent in Safari; would wrongly downgrade premium iOS users).

---

## 11. i18n (bilingual Thai as an aesthetic weapon)

- `next-intl` + `[locale]` segment + route groups; messages in `messages/en.json`, `messages/th.json`; middleware for locale (UX-only).
- **Bilingual lockups** in logo/hero; Thai script/numerals used as a **graphic layer**.
- **Grapheme-cluster-safe split-text** via `Intl.Segmenter` — **never `.split('')`** (shatters Thai combining marks; a Thai reviewer catches it instantly).
- Per-locale headline tokens (drop ALL-CAPS/negative tracking for `:lang(th)`).
- **One-line wins:** `calendar: 'gregory'`, THB no-decimals (`฿1,990`), country-first single example address (no US "State/ZIP" labels), SEO `hreflang`.

---

## 12. Quality & tooling

- TypeScript strict.
- **Vitest** — unit tests for services/repositories (the swap-point logic, `deriveAvailability`, money formatting, cart reconciliation).
- **Playwright** — E2E for the hero slice: browse → PDP → add to cart → checkout → confirmation, in both locales; a reduced-motion run.
- **Cart-drawer a11y contract** (scoped to the hero slice): real `dialog` (focus trap/return, Esc), `aria-live` add-to-cart announcement, `:focus-visible` token. *(Full-site landmark/skip-link audit = tier-3 hygiene at most.)*
- Quality evidenced by **one local Lighthouse run screenshotted into the case study** — not a CI pipeline.

---

## 13. Tech stack

Next.js 15 (App Router, React 19.2) · TypeScript · Tailwind CSS v4 · GSAP · Zustand (disciplined mirror) · next-intl · Vitest + Playwright · npm · deployed on Vercel. Project folder: `d:/MINE/freelance/system/vanta`.

---

## 14. Build sequencing (so a correct bilingual store ships even if time runs out)

`data → i18n (both locales in ugly real screens) → cart/state → motion`

1. Domain types + mock adapters + swap point + seed catalog (incl. drops, sold-out, low-stock).
2. Both locales wired on unstyled real screens (prove i18n before polish).
3. Cart (cookie + Server Actions + Zustand mirror + `useOptimistic`).
4. Hero slice polish: Home + LIVE DROP → PDP → cart drawer → confirmation.
5. Tier 2/3 surfaces to "correct + clean."
6. Case study + architecture diagram + curl-able `/api` + Vercel deploy + demo creds + OG/demo video.

---

## 15. Open risks

- **Thai display tuning** (paired typeface) costs time — mitigated by Kanit having strong ready-made heavy weights.
- **View Transitions** + RSC + locale-stable naming needs care; reduced-motion hard-cut fallback is mandatory.
- **Scope discipline** is the recurring risk: the rule is *build the seam, not the furniture* — invisible backend correctness gets modeled and narrated, not built.
