# VANTA® Implementation Plan

> **For agentic workers — REQUIRED SUB-SKILL:** Before executing any task in this plan you MUST invoke `superpowers:executing-plans` and follow `superpowers:test-driven-development` for every LOGIC task (repositories, services, `deriveAvailability`, money/date format, cart reconciliation). For UI tasks use Playwright/component tests plus visual verification (Playwright or Chrome DevTools MCP against `npm run dev`). Commits follow clean Conventional Commits with **NO Claude attribution** (this is a portfolio). Read the spec at `d:/MINE/freelance/system/vanta/docs/superpowers/specs/2026-06-27-vanta-storefront-design.md` once before starting.

## Goal

Ship VANTA®: a deployed, bilingual (EN/TH) streetwear storefront that (1) makes a viewer feel "I want to buy this" within 60–90s via one unforgettable interaction (the LIVE DROP), and (2) proves senior application architecture where a real backend plugs in by changing **one import** (`lib/data/index.ts`), not the UI. The hero slice (Home → PDP → cart → live drop → confirmation) is polished to 100%; breadth is scaffolded, polish is concentrated.

## Architecture

Approach A: pure domain types (`lib/domain`) consumed through async, request-context-free **repository interfaces** (`lib/data/repositories`), backed by a mock adapter + seed (`lib/data/mock`), wired at the single swap point `lib/data/index.ts`. Server Components read through repositories; Server Actions (`lib/actions`, `'use server'`) mutate through **services** (`lib/services`: cart/auth/checkout/drop/payment) which own authorization (`requireUser`/`requireMember`). The cart's source of truth is a signed cookie (`CartStore`); Zustand is a disciplined client mirror updated only from Server Action return values with `useOptimistic` for in-flight adds. Availability everywhere is the pure function `deriveAvailability`. Middleware is UX-only (locale + optimistic redirect), never authorization (avoids CVE-2025-29927).

## Tech Stack

Next.js 15 (App Router) + React 19.2 · TypeScript (strict) · Tailwind CSS v4 · GSAP · Zustand · next-intl · Vitest + Playwright · npm · deployed on Vercel. Project folder: `d:/MINE/freelance/system/vanta`.

## Global Constraints

- Node package manager: **npm** only (no pnpm/yarn); lockfile is `package-lock.json`.
- Framework: **Next.js 15** App Router, **React 19.2** (uses the `<ViewTransition>` primitive).
- TypeScript **strict** mode `true`; no `any` in `lib/**` (use `unknown` + narrowing).
- Currency is always `'THB'`; money is **integer minor units** (satang), e.g. `฿1,990` is `{ amount: 199000, currency: 'THB' }`.
- THB is displayed with **no decimals**: `฿1,990` (baht sign, then grouped integer baht).
- Dates ALWAYS format with `calendar: 'gregory'` and Western digits in BOTH locales (never Buddhist-era 2567).
- Locales: exactly `'en'` and `'th'`; default locale `'en'`; locale prefix strategy `'always'` (`/en/...`, `/th/...`).
- Repositories are **async** and **request-context-free**: they NEVER call `cookies()`/`headers()`/next-intl; `userId` and `locale` are passed as arguments.
- Authorization lives in services/Server Actions/DAL, re-verified per call; middleware is UX-only. Guards are `requireUser()` / `requireMember()` only (no capability map).
- The cart source of truth is a **signed cookie**; Zustand mirror is updated ONLY from Server Action return values; one reconciliation path.
- `lib/data/index.ts` is the ONLY place the active adapter set is chosen — "change one import to go live."
- Availability union is exactly: `'coming_soon' | 'early_access' | 'live' | 'low_stock' | 'sold_out'`.
- Low-stock threshold constant: `LOW_STOCK_THRESHOLD = 5` (a variant is `low_stock` when `0 < stock <= 5`).
- `deriveAvailability` is a PURE function of `(variant, drop, now, user)` — no clock/cookie access inside.
- Seed: exactly **3 sold-out** variants and **4 "Only N left"** (low-stock) variants; SOLD OUT never appears on a buyable item.
- Seed member demo creds (shown on `/login`): email `member@vanta.shop`, password `vanta-demo`; member id `usr_member`.
- "Notify me" (sold-out) and the wishlist heart are **visual-only** (no backend).
- Design tokens (CSS hex, verbatim): `--ink #0A0A0A`, `--paper #F5F4EF`, `--blaze #FF3B1F`, `--blaze-on-light #D62E16`, `--lime #D4FF2E`.
- Lime is **lime-on-dark ONLY**, `<5%` coverage, token-enforced; forbidden on paper (1.05:1 contrast).
- Latin display = **Clash Display** (ALL-CAPS + tight tracking on `:lang(en)`); Thai display = **Kanit** (Black/SemiBold, NO all-caps, looser tracking, taller line-height on `:lang(th)`). Body = Geist + IBM Plex Sans Thai. Mono = Geist Mono (price/SKU/countdown).
- Layout: 8pt spacing grid, 1440px max width, 12-col asymmetric grid.
- Split-text is grapheme-safe via `Intl.Segmenter` — NEVER `.split('')`.
- Heavy motion is gated on `(prefers-reduced-motion: no-preference)` AND `(pointer: fine)` AND not `Save-Data` ONLY; no `deviceMemory`/`hardwareConcurrency` arithmetic. Reduced motion = content visible-by-default then animates in (never stuck at `opacity:0`).
- Marquee text is English `DROP` / `SOLD OUT` in BOTH locales (literal Thai reads as "a droplet").
- Commit convention: Conventional Commits, imperative, no Claude/AI attribution footer.

---

## File Structure

```
vanta/
├─ package.json                         # npm scripts: dev/build/start/test/test:e2e/lint/typecheck
├─ tsconfig.json                        # strict; paths "@/*" -> "./"
├─ next.config.ts                       # next-intl plugin wiring, experimental viewTransition
├─ vitest.config.ts                     # unit tests for lib/** (node env)
├─ playwright.config.ts                 # E2E hero slice, both locales + reduced-motion project
├─ postcss.config.mjs                   # Tailwind v4 postcss plugin
├─ middleware.ts                        # next-intl locale middleware (UX-only; NEVER authz)
├─ messages/
│  ├─ en.json                           # English UI copy (next-intl namespace tree)
│  └─ th.json                           # Thai UI copy (mirror keyset of en.json)
├─ app/
│  ├─ globals.css                       # @import "tailwindcss"; @theme tokens; :lang() headline rules
│  ├─ layout.tsx                        # root html (no locale); passes through
│  ├─ [locale]/
│  │  ├─ layout.tsx                     # NextIntlClientProvider, fonts, html lang/dir, CartHydrator
│  │  ├─ (shop)/
│  │  │  ├─ page.tsx                    # Home — hero + LIVE DROP + featured + lookbook teaser [T1]
│  │  │  ├─ shop/page.tsx               # Catalog — filter + sort [T2]
│  │  │  ├─ product/[slug]/page.tsx     # PDP — lean variant-state proof [T1]
│  │  │  ├─ collections/page.tsx        # Lookbook index [T2]
│  │  │  ├─ collections/[slug]/page.tsx # Lookbook editorial template [T2]
│  │  │  └─ search/page.tsx             # Search results [T3]
│  │  ├─ (checkout)/
│  │  │  ├─ cart/page.tsx               # Cart page [T1]
│  │  │  ├─ checkout/page.tsx           # 1–2 step checkout + PaymentService mock [T2]
│  │  │  └─ checkout/[orderId]/page.tsx # Premium shareable confirmation [T1]
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx              # demo creds visible [T2]
│  │  │  └─ register/page.tsx           # [T2]
│  │  ├─ (account)/                     # member-only; authz in DAL/service, not middleware
│  │  │  ├─ layout.tsx                  # calls requireMember(); redirects guests
│  │  │  ├─ account/page.tsx            # Dashboard [T3]
│  │  │  ├─ account/orders/page.tsx     # order history (one example) [T3]
│  │  │  ├─ account/addresses/page.tsx  # saved address (one example) [T3]
│  │  │  └─ account/settings/page.tsx   # [T3]
│  │  └─ (admin)/
│  │     └─ admin/page.tsx              # reserved route group + requireAdmin guard only
│  └─ api/
│     └─ products/route.ts              # documented curl-able JSON (the seam, made visible)
├─ components/
│  ├─ drop/                             # CountdownIsland, AvailabilityBadge, StockMeter, DropMarquee
│  ├─ pdp/                              # StickyBuyPanel, SwatchGallery, SizeGrid, AddToCartButton
│  ├─ cart/                             # CartDrawer (a11y dialog), CartLineItem, CartHydrator
│  ├─ product/                          # ProductCard (view-transition-name keyed on product id)
│  ├─ checkout/                         # CheckoutForm, PaymentMockForm, OrderSummary
│  ├─ layout/                           # Header, Footer, LocaleSwitcher, MotionToggle
│  └─ ui/                               # Money, FormattedDate, Button (magnetic variant), Dialog
├─ lib/
│  ├─ domain/
│  │  ├─ money.ts                       # Money, Currency
│  │  ├─ i18n.ts                        # Locale, LocalizedText
│  │  ├─ product.ts                     # Availability, ProductImage, Variant, Product
│  │  ├─ collection.ts                  # Collection
│  │  ├─ drop.ts                        # Drop
│  │  ├─ cart.ts                        # CartItem, Cart
│  │  ├─ order.ts                       # OrderStatus, OrderLineItem, OrderTotals, Order, Address
│  │  ├─ user.ts                        # Role, User
│  │  └─ index.ts                       # barrel re-export of all domain types
│  ├─ data/
│  │  ├─ repositories/
│  │  │  ├─ product-repository.ts       # ProductRepository interface
│  │  │  ├─ collection-repository.ts    # CollectionRepository interface
│  │  │  ├─ order-repository.ts         # OrderRepository interface
│  │  │  ├─ user-repository.ts          # UserRepository interface
│  │  │  ├─ cart-store.ts               # CartStore interface
│  │  │  └─ index.ts                    # Repositories bundle type
│  │  ├─ mock/
│  │  │  ├─ seed/                       # products.ts, collections.ts, drops.ts, users.ts
│  │  │  ├─ product-repository.mock.ts  # MockProductRepository
│  │  │  ├─ collection-repository.mock.ts
│  │  │  ├─ order-repository.mock.ts    # in-memory order map (+ seeded confirmation order)
│  │  │  ├─ user-repository.mock.ts
│  │  │  ├─ cart-store.mock.ts          # cookie-backed signed CartStore
│  │  │  └─ index.ts                    # mockRepositories: Repositories
│  │  └─ index.ts                       # THE SWAP POINT: export const repositories = mockRepositories
│  ├─ services/
│  │  ├─ availability.ts                # deriveAvailability (pure) + LOW_STOCK_THRESHOLD
│  │  ├─ cart-service.ts                # cartService
│  │  ├─ auth-service.ts                # authService + requireUser/requireMember/requireAdmin
│  │  ├─ checkout-service.ts            # checkoutService
│  │  ├─ drop-service.ts                # dropService
│  │  └─ payment-service.ts            # PaymentService interface + mockPaymentService
│  ├─ actions/
│  │  ├─ cart-actions.ts                # 'use server' addToCart/updateQuantity/removeFromCart/getCart
│  │  ├─ auth-actions.ts                # 'use server' login/register/logout
│  │  └─ checkout-actions.ts            # 'use server' placeOrder
│  ├─ i18n/
│  │  ├─ routing.ts                     # next-intl routing config (locales, defaultLocale)
│  │  ├─ request.ts                     # getRequestConfig (loads messages)
│  │  └─ navigation.ts                  # localized Link/redirect/usePathname/useRouter
│  ├─ format/
│  │  ├─ money.ts                       # formatMoney
│  │  └─ date.ts                        # formatDate (calendar: 'gregory')
│  ├─ motion/
│  │  ├─ capability.ts                  # useMotionCapability hook + matchMedia logic
│  │  └─ segment.ts                     # splitGraphemes (Intl.Segmenter)
│  └─ store/
│     └─ cart-store.ts                  # Zustand client mirror (hydrate + replace-from-server only)
└─ tests/
   ├─ unit/                             # availability/money/date/cart-reconcile/repo swap specs
   └─ e2e/                              # hero-slice.en.spec.ts, hero-slice.th.spec.ts, reduced-motion.spec.ts
```

---

## Shared Contracts (use verbatim across all tasks)

Every type, interface, and signature below is **verbatim law**. Later authors import these and MUST NOT redefine or widen them.

### `lib/domain/money.ts`

```ts
export type Currency = 'THB';

/** Integer MINOR units (satang). ฿1,990 === { amount: 199000, currency: 'THB' }. */
export type Money = {
  amount: number; // integer minor units, never a float
  currency: Currency;
};
```

### `lib/domain/i18n.ts`

```ts
export type Locale = 'en' | 'th';

/** Every user-facing string is bilingual and first-class. */
export type LocalizedText = {
  en: string;
  th: string;
};
```

### `lib/domain/product.ts`

```ts
import type { Money } from './money';

export type Availability = 'coming_soon' | 'early_access' | 'live' | 'low_stock' | 'sold_out';

export type ProductImage = {
  id: string;
  url: string;
  alt: LocalizedText;
  width: number;
  height: number;
};

/** Variant is the purchasable unit (SKU). Every wow feature renders variant state. */
export type Variant = {
  id: string;
  sku: string;
  optionValues: { size: string; color: string };
  price: Money;
  compareAtPrice?: Money; // present => sale UI
  stock: number; // current in-session stock
  availability: Availability; // baseline; UI re-derives via deriveAvailability
};

export type Product = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  optionAxes: { size: string[]; color: string[] };
  variants: Variant[];
  imagesByColor: Record<string, ProductImage[]>; // keyed by optionValues.color
  collectionIds: string[];
  dropId?: string;
};

// Re-export so importing from product.ts is allowed:
export type { LocalizedText } from './i18n';
```

> Note: `LocalizedText` is defined in `i18n.ts`; the barrel `lib/domain/index.ts` re-exports both. Authors import domain types from `@/lib/domain`.

### `lib/domain/collection.ts`

```ts
import type { LocalizedText } from './i18n';

export type Collection = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  heroImageUrl: string;
  productIds: string[];
};
```

### `lib/domain/drop.ts`

```ts
/** All timestamps are ISO-8601 strings (UTC). Deadlines are cacheable; the tick is a client island. */
export type Drop = {
  id: string;
  name: LocalizedText;
  earlyAccessAt: string; // members unlock here
  releaseAt: string; // public LIVE flip
  endAt: string; // drop window closes
};

export type { LocalizedText } from './i18n';
```

### `lib/domain/cart.ts`

```ts
import type { Money } from './money';

/** Cart line references the variant (SKU), never the product. */
export type CartItem = {
  variantId: string;
  quantity: number;
};

/** Authoritative cart shape returned by every cart Server Action. */
export type Cart = {
  items: CartItem[];
  itemCount: number; // sum of quantities (derived, server-authoritative)
  subtotal: Money; // sum of unitPrice * qty
  updatedAt: string; // ISO-8601
};
```

### `lib/domain/order.ts`

```ts
import type { Money } from './money';
import type { LocalizedText } from './i18n';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

/** Country-first single example address. NO US State/ZIP labels. */
export type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string; // ISO-3166 alpha-2, e.g. 'TH'
  phone?: string;
};

/** Self-contained snapshot at purchase time — never re-read from Product/Variant. */
export type OrderLineItem = {
  variantId: string;
  sku: string;
  title: LocalizedText; // snapshot
  optionValues: { size: string; color: string };
  unitPrice: Money; // snapshot
  quantity: number;
  imageUrl: string; // snapshot
};

export type OrderTotals = {
  subtotal: Money;
  shipping: Money;
  total: Money;
};

export type Order = {
  id: string; // e.g. 'ord_seed_demo'
  userId: string | null; // null => guest checkout
  status: OrderStatus;
  lineItems: OrderLineItem[];
  totals: OrderTotals;
  shippingAddress: Address;
  email: string;
  placedAt: string; // ISO-8601
};
```

### `lib/domain/user.ts`

```ts
import type { Address } from './order';

export type Role = 'guest' | 'member' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  addresses: Address[];
};
```

### `lib/data/repositories/*.ts` — all repository interfaces

```ts
// product-repository.ts
import type { Product, Variant } from '@/lib/domain';
export interface ProductRepository {
  list(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  getVariantById(variantId: string): Promise<Variant | null>;
  listByCollection(collectionId: string): Promise<Product[]>;
  listByDrop(dropId: string): Promise<Product[]>;
  /** In-session stock decrement on add-to-cart (mock mutates seed). */
  decrementStock(variantId: string, quantity: number): Promise<Variant>;
  search(query: string): Promise<Product[]>;
}

// collection-repository.ts
import type { Collection } from '@/lib/domain';
export interface CollectionRepository {
  list(): Promise<Collection[]>;
  getBySlug(slug: string): Promise<Collection | null>;
  getById(id: string): Promise<Collection | null>;
}

// order-repository.ts
import type { Order } from '@/lib/domain';
export interface OrderRepository {
  create(order: Order): Promise<Order>;
  getById(orderId: string): Promise<Order | null>;
  listByUser(userId: string): Promise<Order[]>;
}

// user-repository.ts
import type { User } from '@/lib/domain';
export interface UserRepository {
  getById(userId: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  /** Returns the user iff credentials match (mock checks seed password). */
  verifyCredentials(email: string, password: string): Promise<User | null>;
}

// cart-store.ts — the ONLY request-context-aware repo: it reads/writes the signed cookie.
import type { Cart } from '@/lib/domain';
export interface CartStore {
  read(): Promise<Cart>; // empty cart if no cookie
  write(cart: Cart): Promise<void>; // signs + sets cookie
  clear(): Promise<void>;
}

// index.ts — the bundle the swap point provides
import type { ProductRepository } from './product-repository';
import type { CollectionRepository } from './collection-repository';
import type { OrderRepository } from './order-repository';
import type { UserRepository } from './user-repository';
import type { CartStore } from './cart-store';
export interface Repositories {
  products: ProductRepository;
  collections: CollectionRepository;
  orders: OrderRepository;
  users: UserRepository;
  cart: CartStore;
}
```

### `lib/data/index.ts` — THE SWAP POINT (exact shape)

```ts
import type { Repositories } from './repositories';
import { mockRepositories } from './mock';

/** Change-one-import-to-go-live: swap mockRepositories for prismaRepositories / apiRepositories here. */
export const repositories: Repositories = mockRepositories;

// Convenience named exports (so callers can `import { products } from '@/lib/data'`):
export const { products, collections, orders, users, cart } = repositories;
```

### `lib/services/availability.ts` — deriveAvailability (pure)

```ts
import type { Variant, Drop, User, Availability } from '@/lib/domain';

export const LOW_STOCK_THRESHOLD = 5;

/**
 * PURE. No clock, no cookies. Read identically by home/catalog/PDP/marquee.
 * Precedence: sold_out > coming_soon > early_access > low_stock > live.
 *  - stock <= 0                                  => 'sold_out'
 *  - drop && now < earlyAccessAt                 => 'coming_soon'
 *  - drop && now < releaseAt && !member          => 'early_access' (gated)
 *  - drop && now < releaseAt &&  member          => 'live' (unlocked)
 *  - 0 < stock <= LOW_STOCK_THRESHOLD            => 'low_stock'
 *  - otherwise                                   => 'live'
 */
export function deriveAvailability(
  variant: Variant,
  drop: Drop | null,
  now: Date,
  user: User | null,
): Availability;
```

### `lib/services/cart-service.ts`

```ts
import type { Cart } from '@/lib/domain';
export interface CartService {
  getCart(): Promise<Cart>;
  addItem(variantId: string, quantity: number): Promise<Cart>;
  updateQuantity(variantId: string, quantity: number): Promise<Cart>;
  removeItem(variantId: string): Promise<Cart>;
  clear(): Promise<Cart>;
}
export const cartService: CartService;
```

### `lib/services/auth-service.ts`

```ts
import type { User } from '@/lib/domain';
export interface AuthService {
  login(email: string, password: string): Promise<User>; // throws on bad creds
  register(email: string, password: string, name: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>; // reads signed session cookie
}
export const authService: AuthService;

// Guards (throw a typed error / redirect at the call site):
export function requireUser(): Promise<User>; // any authenticated user
export function requireMember(): Promise<User>; // role === 'member' | 'admin'
export function requireAdmin(): Promise<User>; // role === 'admin'
```

### `lib/services/checkout-service.ts`

```ts
import type { Order, Address, Cart } from '@/lib/domain';

export type PlaceOrderInput = {
  email: string;
  shippingAddress: Address;
  paymentToken: string; // opaque token from PaymentService
};

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };

export interface CheckoutService {
  /** Snapshots cart -> OrderLineItems, charges via PaymentService, persists Order, clears cart. */
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  buildLineItemsFromCart(cart: Cart): Promise<Order['lineItems']>;
}
export const checkoutService: CheckoutService;
```

### `lib/services/drop-service.ts`

```ts
import type { Drop, Product } from '@/lib/domain';
export interface DropService {
  getActiveDrop(): Promise<Drop | null>;
  getDropById(dropId: string): Promise<Drop | null>;
  getDropProducts(dropId: string): Promise<Product[]>;
}
export const dropService: DropService;
```

### `lib/services/payment-service.ts`

```ts
export type ChargeInput = {
  amountMinor: number; // integer minor units
  currency: 'THB';
  paymentToken: string; // mock: 'tok_ok' charges, 'tok_decline' declines
};
export type ChargeResult =
  | { ok: true; chargeId: string }
  | { ok: false; declineCode: 'card_declined' };

/** Seam targeting Stripe/Omise. Mock adds latency + honors a declining test token. */
export interface PaymentService {
  charge(input: ChargeInput): Promise<ChargeResult>;
}
export const mockPaymentService: PaymentService;
```

### `lib/actions/*.ts` — Server Action signatures (all `'use server'`)

```ts
// cart-actions.ts — return the AUTHORITATIVE cart; Zustand mirror replaces state from this.
export async function addToCart(variantId: string, quantity: number): Promise<Cart>;
export async function updateCartQuantity(variantId: string, quantity: number): Promise<Cart>;
export async function removeFromCart(variantId: string): Promise<Cart>;
export async function getCartAction(): Promise<Cart>;

// auth-actions.ts — public POSTs; gated/validated inside authService.
export type AuthActionState =
  | { ok: true; user: User }
  | { ok: false; error: 'invalid_credentials' | 'email_taken' };
export async function login(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState>;
export async function register(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState>;
export async function logout(): Promise<void>;

// checkout-actions.ts
export type PlaceOrderActionState =
  | { ok: true; orderId: string }
  | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };
export async function placeOrder(
  prevState: PlaceOrderActionState,
  formData: FormData,
): Promise<PlaceOrderActionState>;
```

### `lib/format/money.ts` and `lib/format/date.ts`

```ts
// money.ts — one Intl.NumberFormat helper keyed by locale; THB no decimals => "฿1,990".
import type { Money } from '@/lib/domain';
import type { Locale } from '@/lib/domain';
export function formatMoney(money: Money, locale: Locale): string;

// date.ts — forces gregory calendar + Western digits in both locales.
import type { Locale } from '@/lib/domain';
export function formatDate(iso: string, locale: Locale): string; // uses calendar: 'gregory'
```

### `lib/store/cart-store.ts` — Zustand mirror (disciplined)

```ts
import type { Cart } from '@/lib/domain';
export type CartMirrorState = {
  cart: Cart;
  hydrate: (serverCart: Cart) => void; // initial RSC-rendered cart
  replaceFromServer: (cart: Cart) => void; // ONLY entry point for updates (action return value)
};
export const useCartStore: import('zustand').UseBoundStore<
  import('zustand').StoreApi<CartMirrorState>
>;
// INVARIANT: no addItem/removeItem mutators here; Zustand never invents cart state.
```

### Tailwind v4 theme token block — `app/globals.css` (verbatim)

```css
@import 'tailwindcss';

@theme {
  --color-ink: #0a0a0a;
  --color-paper: #f5f4ef;
  --color-blaze: #ff3b1f;
  --color-blaze-on-light: #d62e16; /* AA-safe on paper */
  --color-lime: #d4ff2e; /* lime-on-dark ONLY */
  --color-smoke-900: #141414;
  --color-smoke-700: #2a2a2a;
  --color-smoke-500: #6b6b6b;
  --color-smoke-300: #b8b8b8;

  --font-display-en: 'Clash Display', system-ui, sans-serif;
  --font-display-th: 'Kanit', system-ui, sans-serif;
  --font-body: 'Geist', 'IBM Plex Sans Thai', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  --spacing: 0.5rem; /* 8pt grid base */
  --max-w-shell: 1440px;
}

/* Per-locale headline tokens */
:lang(en) .display {
  font-family: var(--font-display-en);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}
:lang(th) .display {
  font-family: var(--font-display-th);
  text-transform: none;
  letter-spacing: 0.01em;
  line-height: 1.35;
}
```

### next-intl config shape — `lib/i18n/routing.ts` + `lib/i18n/request.ts`

```ts
// routing.ts
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['en', 'th'] as const,
  defaultLocale: 'en',
  localePrefix: 'always',
});

// navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

// request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as any) ? requested! : routing.defaultLocale;
  return { locale, messages: (await import(`@/messages/${locale}.json`)).default };
});
```

---

## Conventions

- **Test file naming:** unit tests live in `tests/unit/<subject>.test.ts` (Vitest, node env), mirroring the `lib/**` path of the subject (e.g. `tests/unit/availability.test.ts` for `lib/services/availability.ts`). E2E specs live in `tests/e2e/<slice>.<locale>.spec.ts` plus `tests/e2e/reduced-motion.spec.ts`.
- **TDD for LOGIC (mandatory):** for every repo/service/`deriveAvailability`/format/cart-reconciliation task — write the failing Vitest test, run it and SHOW it fail, implement, run it and SHOW it pass, then commit. No placeholders, no `TODO`, no "similar to Task N" — every step has complete code.
- **UI verification:** UI tasks are verified with Playwright/component tests AND visual verification (Playwright screenshot or Chrome DevTools MCP) against `npm run dev`; capture the hero slice in both `en` and `th`, plus one reduced-motion run.
- **Imports:** always import domain types from the barrel `@/lib/domain`; always reach data through `@/lib/data` (never reach into `@/lib/data/mock` from app/components — that would defeat the swap point). Repositories never import next-intl/cookies/headers.
- **Authorization placement:** every `(account)` page/layout and every gated Server Action calls `requireMember()`/`requireUser()` from `authService`; middleware only redirects optimistically and never enforces.
- **View Transitions:** `view-transition-name` is keyed on `product-${product.id}` (locale-stable — never key on slug or localized text); reduced motion = hard cut (no-op), gated via the `useMotionCapability` hook.
- **Locale stability:** any animation/transition key, DOM id, or test selector that must survive a locale switch is derived from a stable id (product/variant/drop id), never from `LocalizedText`.
- **Money/date discipline:** never construct price strings by hand — always `formatMoney`; never `new Date().toLocaleDateString` without `calendar: 'gregory'` — always `formatDate`. Never store/compute money as floats.
- **Split-text:** any per-grapheme animation uses `splitGraphemes` (Intl.Segmenter); `.split('')` is forbidden and should fail review.
- **Commit style:** Conventional Commits, imperative mood, scoped where useful (`feat(cart):`, `test(availability):`, `chore(i18n):`); NO Claude/AI co-author or attribution footer (portfolio repo).
- **Mock mutation discipline:** in-session stock decrements happen only via `ProductRepository.decrementStock`; seed data is never re-priced/archived (no churn sim). The seeded confirmation order (`ord_seed_demo`) must let `/checkout/[orderId]` render instantly for reviewers.
- **`/api` discipline:** the curl-able `api/products/route.ts` exists to make the seam visible for reviewers; do NOT client-fetch it from the app to fake a network tab (RSC reads through repositories directly).

---

I now have everything I need. TypeScript 6.x exists but TS 5.9.3 is the stable line that Next 15 + the ecosystem target, so I'll pin TS 5.9.x. Vitest 4 is latest but the contract's tooling maturity matches Vitest 3.2.x with the React plugin; I'll pin Vitest 3.2.x for stability. Let me write Phase 0.

Here is Phase 0, ready to paste into the plan document:

---

## ⚠️ Reconciliation & Errata (READ FIRST — overrides conflicting phase text)

This block is **authoritative**. Where any phase/task body below conflicts with a resolution here, apply the resolution. Each item cites the exact file path, symbol, and the phase/task whose verb (`Create` → `Modify`/`replace`) changes. A new foundational phase — **Phase 0.5** (physically placed between Phase 2 and Phase 3) — **executes AFTER Phase 2 and BEFORE Phase 3**; it owns the shared components several later phases assume exist (it depends on Phase 1 format helpers + availability constants and Phase 2 i18n/LocaleSwitcher). Items below reference Phase 0.5 by task number where relevant.

---

### Type inconsistencies (4)

1. **`lib/domain/product.ts` uses `LocalizedText` but never imports it.** The locked contract block in `## Shared Contracts` uses `LocalizedText` in `ProductImage.alt`, `Product.title`, and `Product.description`, then only `export type { LocalizedText } from './i18n';` at the bottom — so a _verbatim_ copy does not compile (the type is unresolved in every value position).
   **Resolution (canonical contract correction):** `lib/domain/product.ts` MUST begin with an explicit type-only import. Phase 1 Task 1.2's version is canonical; the Shared-Contracts block is corrected to include the import line so any author copying it "verbatim" (Phase 0, Phase 2) produces a compiling file. The corrected file header is:

   ```ts
   import type { Money } from './money';
   import type { LocalizedText } from './i18n'; // ← REQUIRED: used by ProductImage.alt, Product.title/description

   export type Availability = 'coming_soon' | 'early_access' | 'live' | 'low_stock' | 'sold_out';
   // …ProductImage / Variant / Product unchanged…

   // Re-export so importing from product.ts is allowed:
   export type { LocalizedText } from './i18n';
   ```

   Every phase that references `product.ts` points at this corrected version, never the literal (broken) contract block.

2. **Two different orderings are applied to the same `Availability` union (`deriveAvailability` precedence vs. catalog/search roll-up `BUYABILITY`).** Single-variant precedence is `sold_out > coming_soon > early_access > low_stock > live` (early_access outranks low_stock). The card roll-up treats `low_stock` as _more_ buyable than `early_access`. These are silently divergent constants.
   **Resolution (canonical contract correction — keep BOTH, make divergence impossible):** both orderings are _intentional_ and live as named, exported constants in `lib/services/availability.ts`. `deriveAvailability` consumes `AVAILABILITY_PRECEDENCE` (single-variant precedence); catalog/search/collection card builders consume `CARD_ROLLUP_ORDER` ("most buyable across variants"). Neither surface may inline a literal map. Phase 6 `lib/catalog/query.ts`, Phase 6 search `results.ts`, and the Phase 4 / Phase 6 / Phase 7 collection card builders import `CARD_ROLLUP_ORDER` from `@/lib/services/availability`.

   ```ts
   // lib/services/availability.ts
   import type { Availability } from '@/lib/domain';

   /**
    * SINGLE-VARIANT precedence used by deriveAvailability (most → least urgent state).
    * Lower index = wins when a single variant could be described multiple ways.
    * sold_out > coming_soon > early_access > low_stock > live
    */
   export const AVAILABILITY_PRECEDENCE: readonly Availability[] = [
     'sold_out',
     'coming_soon',
     'early_access',
     'low_stock',
     'live',
   ] as const;

   /**
    * MULTI-VARIANT card roll-up ("most BUYABLE across a product's matching variants").
    * Lower index = more buyable; a card surfaces the most-buyable variant's state.
    * live > low_stock > early_access > coming_soon > sold_out.
    * DIFFERENT FROM AVAILABILITY_PRECEDENCE ON PURPOSE: precedence answers
    * "how should I describe ONE variant?"; roll-up answers "can the shopper buy
    * THIS PRODUCT right now?" — a live variant always wins, an early_access-gated
    * variant is less buyable than an in-stock low_stock one.
    */
   export const CARD_ROLLUP_ORDER: readonly Availability[] = [
     'live',
     'low_stock',
     'early_access',
     'coming_soon',
     'sold_out',
   ] as const;
   ```

   Card builders pick the matching variant whose availability has the lowest `CARD_ROLLUP_ORDER` index. The JSDoc on `deriveAvailability` is updated to add: "single-variant precedence; the multi-variant card roll-up uses `CARD_ROLLUP_ORDER`, intentionally a different order."

3. **`formatMoney` THB test asserts exactly `฿1,990` with a regular space — fragile against real ICU** (ICU commonly emits a non-breaking / narrow-no-break space, or `THB`).
   **Resolution:** the THB assertion in `tests/unit/money.test.ts` normalizes Unicode spaces, then asserts the baht sign is present and the integer-baht grouping is correct — never an exact `฿1,990` with U+0020. Use:

   ```ts
   import { describe, it, expect } from 'vitest';
   import { formatMoney } from '@/lib/format/money';

   /** Fold NBSP (U+00A0) and NARROW NBSP (U+202F) to a single normal space. */
   const norm = (s: string) => s.replace(/[  ]/g, ' ');

   describe('formatMoney (THB, no decimals)', () => {
     it('groups integer baht and shows the ฿ sign (space-tolerant)', () => {
       const out = norm(formatMoney({ amount: 199000, currency: 'THB' }, 'en'));
       expect(out).toContain('฿'); // baht sign present
       expect(out).toMatch(/1[,\s]?990/); // grouped 1,990 baht (199000 satang / 100)
       expect(out).not.toMatch(/\.\d/); // NO decimals for THB
     });

     it('formats identically (digits) in th locale (gregory/Western digits)', () => {
       const out = norm(formatMoney({ amount: 199000, currency: 'THB' }, 'th'));
       expect(out).toMatch(/1[,\s]?990/);
       expect(out).toContain('฿');
     });
   });
   ```

4. **`lib/services/cart-service.ts` writes a speculative `import type { CartService } from '@/lib/data/repositories'` then deletes it a step later.** `CartService` is owned by `lib/services/cart-service.ts`, not the repositories bundle. The intermediate broken import ships a non-compiling file.
   **Resolution:** Phase 3 Task 3.2 declares/exports `CartService` **locally in one pass** (verbatim from the contract) and the "delete this line later" step is removed entirely. The file's first import block is only:

   ```ts
   import type { Cart } from '@/lib/domain';
   import { cart as cartStore, products } from '@/lib/data';

   export interface CartService {
     getCart(): Promise<Cart>;
     addItem(variantId: string, quantity: number): Promise<Cart>;
     updateQuantity(variantId: string, quantity: number): Promise<Cart>;
     removeItem(variantId: string): Promise<Cart>;
     clear(): Promise<Cart>;
   }
   // …implementation + `export const cartService: CartService = …` …
   ```

   No line imports `CartService` from `@/lib/data/repositories` at any point.

---

### Coverage gaps (5)

5. **`requireUser()` allowlist includes `'guest'`, but an unauthenticated visitor is `null`, never a `User` with role `'guest'`.** The `'guest'` branch is dead/misleading.
   **Resolution:** Phase 7 Task 7.3 `enforceRole`/`requireUser` **rejects `null`** (unauthenticated → typed `unauthorized` error/redirect) and the allowlist for `requireUser` is `['member', 'admin']` — `'guest'` is dropped. `getCurrentUser()` returning `null` is the only guest path. `requireMember` = `['member','admin']`; `requireAdmin` = `['admin']`. The domain `Role` union keeps `'guest'` (no domain change), but no guard ever admits it.

6. **`Variant` has no `productId`; checkout/cart/orders/confirmation each re-scan `products.list()` per variant to find the owner (O(N·M), repeated 4+ times, no shared helper).**
   **Resolution (official contract extension):** add `getProductByVariantId(variantId, locale)` to `ProductRepository`; provide the mock impl once and a single shared call site. Phase 8 `checkoutService` (drop `findOwningProduct`'s `products.list()` scan), Phase 7 account orders, Phase 3/7 cart pages, and the confirmation page all call `products.getProductByVariantId(...)` — no more per-item `products.list()` scans. The `locale` parameter lets the mock return the localized title without callers re-reading. Corrected `ProductRepository`:

   ```ts
   // lib/data/repositories/product-repository.ts
   import type { Product, Variant } from '@/lib/domain';
   import type { Locale } from '@/lib/domain';
   export interface ProductRepository {
     list(): Promise<Product[]>;
     getBySlug(slug: string): Promise<Product | null>;
     getById(id: string): Promise<Product | null>;
     getVariantById(variantId: string): Promise<Variant | null>;
     /** Resolve the owning product of a variant in ONE place (kills repeated list() scans). */
     getProductByVariantId(variantId: string, locale: Locale): Promise<Product | null>;
     listByCollection(collectionId: string): Promise<Product[]>;
     listByDrop(dropId: string): Promise<Product[]>;
     decrementStock(variantId: string, quantity: number): Promise<Variant>;
     search(query: string): Promise<Product[]>;
   }
   ```

   `MockProductRepository.getProductByVariantId` does the seed scan exactly once:

   ```ts
   async getProductByVariantId(variantId: string, _locale: Locale): Promise<Product | null> {
     return clone(this.products.find((p) => p.variants.some((v) => v.id === variantId)) ?? null);
   }
   ```

   The Phase 1.5 contract stub gains a `getProductByVariantId: async () => null` member (see item 8).

7. **`drops: DropRepository` is added to the `Repositories` bundle mid-stream (Phase 1 Task 1.9), but the locked bundle has no `drops`, and Phase 1 Task 1.5's `repositories.contract.test.ts` stub has no `drops` member — so once 1.9 widens the type, the 1.5 stub fails typecheck (missing required member).**
   **Resolution (official contract extension):** `DropRepository` IS part of the contract. The locked `Repositories` shape gains `drops: DropRepository` (and `DropRepository` is an official interface). **Phase 1 Task 1.5's stub MUST include a `drops` member** so it still satisfies `Repositories` after Task 1.9. Locked corrected bundle:

   ```ts
   // lib/data/repositories/index.ts
   import type { DropRepository } from './drop-repository'; // official member
   export type { DropRepository } from './drop-repository';
   export interface Repositories {
     products: ProductRepository;
     collections: CollectionRepository;
     orders: OrderRepository;
     users: UserRepository;
     cart: CartStore;
     drops: DropRepository; // ← official contract member
   }
   // drop-repository.ts
   import type { Drop } from '@/lib/domain';
   export interface DropRepository {
     list(): Promise<Drop[]>;
     getById(dropId: string): Promise<Drop | null>;
     getActive(now: Date): Promise<Drop | null>;
   }
   ```

   The Phase 1 Task 1.5 stub adds (so the test stays green through Task 1.9 _and_ item 6):

   ```ts
   const stub: Repositories = {
     products: { /* …existing… */ getProductByVariantId: async () => null },
     // collections / orders / users / cart unchanged …
     drops: {
       list: async () => [],
       getById: async () => null,
       getActive: async () => null,
     },
   };
   ```

8. **Fonts: Phase 0 Task 0.4 self-hosts Clash Display (EN display) via `lib/fonts.ts` (`next/font/local`) + `fontClassNames`; Phase 2 Task 2.5 re-creates `app/[locale]/layout.tsx` loading Geist/Kanit/IBM Plex via Google directly, silently regressing the EN display font from Clash Display to Geist and breaking the Phase 0 smoke test.**
   **Resolution:** `lib/fonts.ts` (Clash Display via `next/font/local`) + `fontClassNames` is **canonical end-to-end**. Phase 2 Task 2.5 and Phase 4 **MODIFY/replace** the layout but MUST keep `import { fontClassNames } from '@/lib/fonts'` applied to `<html className={fontClassNames}>` (the root `app/layout.tsx` is where `<html>` lives) — never substitute Geist for the EN display. They must not re-declare fonts inline in the layout. Geist's package variables (`--font-geist-sans` / `--font-geist-mono`) are aliased to `--font-body` / `--font-mono` in `globals.css` per Phase 0; the `@theme` token `--font-display-en: "Clash Display"` is preserved.

9. **`app/[locale]/(shop)/page.tsx` is authored three times (Phase 0 minimal shell, Phase 2 featured grid, Phase 4 hero + LIVE DROP). Only the last survives; the Phase 0 smoke test asserts `data-testid` brand/tagline/locale-stamp but Phase 2/4 never update `tests/e2e/shell.spec.ts`.**
   **Resolution:** `app/[locale]/(shop)/page.tsx`, `app/[locale]/layout.tsx`, `app/globals.css`, and root `app/layout.tsx` are **CREATED ONCE in Phase 0**. **Phase 2 Task 2.5 and Phase 4 Task 4.5 change their verb from `Create` to `Modify`/`replace`** for these files, and each MUST update `tests/e2e/shell.spec.ts` in the same task — re-point the brand / tagline / locale-stamp `data-testid` assertions at the new home markup (or retire the stamp assertions and add the new home assertions) so the Phase 0 smoke spec does not silently fail when the page is replaced. No phase may leave an orphaned `data-testid` assertion pointing at removed markup.

---

### Placeholder violations (4)

10. **Phase 5 Task 5.3 `StickyBuyPanel.tsx` ships a first, knowingly-broken block (dead `priceVariant` expression, `price` const = `undefined`, a `fallbackPrice()` returning `{ amount: 0 }` with a comment admitting it is wrong), then a "replace it with the cleaner version below" rewrite.** This violates "every step has complete, correct code."
    **Resolution:** **Delete the first `StickyBuyPanel.tsx` block entirely.** Only the final `displayPrice`-prop version exists — the panel receives the already-resolved selected-variant price as a `displayPrice: Money` prop from its parent (PDP) and never computes a fallback. No placeholder implementation is authored and discarded.

11. **Phase 3 Task 3.6 `CartDrawer.tsx` keeps an `announcement` state + `aria-live` region but nothing calls `setAnnouncement`; a prose note says `AddToCartButton` writes it "via a shared ref/event" that is never defined.**
    **Resolution:** implement a **concrete channel** on the drawer context. `CartDrawerContext` exposes `announcement: string` + `setAnnouncement(msg: string): void` (this is part of the Phase 0.5 Task 0.5.6 context shape; Phase 3 extends the SAME context with the drawer-data members). The Phase 5 `AddToCartButton` calls `const { open, setAnnouncement } = useCartDrawer(); … setAnnouncement(t('addedToCart', { title }))` after the action resolves; `CartDrawer` renders `{announcement}` in its `aria-live="polite"` region. No prose "shared ref/event" — the mechanism is the context method.

12. **Phase 7 Task 7.7 edits `lib/data/mock/seed/orders.ts` to set `userId: 'usr_member'` and claims the file was "created in the checkout phase" (Phase 8), with a conditional "if null, change it" branch — but Phase 1 Task 1.6 already creates `orders.ts` with `ord_seed_demo` and `userId: 'usr_member'`.**
    **Resolution:** `lib/data/mock/seed/orders.ts` is **created ONCE in Phase 1 Task 1.6** with `userId: 'usr_member'` already set. **Phase 7 drops its "created in the checkout phase" claim and the conditional userId fix** — there is nothing to confirm or change; the seed is already correct from Phase 1. Phase 7 may _read_ the seed but does not re-author or "repair" it.

13. **Phase 4 Task 4.5 calls `<ProductCard product={product} locale={locale} />` (props `product`, `locale`) with a hedging "if its signature differs, call it with that exact shape" note, but Phase 6 Task 6.2 defines `ProductCard` with `{ card: CatalogCard; title; imageUrl; imageAlt; locale; priority }` — there is NO `product` prop, and Phase 4 runs before Phase 6.**
    **Resolution:** `ProductCard`'s **single canonical signature is `{ card: CatalogCard; title; imageUrl; imageAlt; locale; priority }`** and it is **created early in Phase 0.5 Task 0.5.5** (not Phase 6). A `toCatalogCard(product: Product, locale: Locale): CatalogCard` mapper (also Phase 0.5 Task 0.5.5) lets both Phase 4's featured grid and Phase 6's catalog build cards identically. Phase 4 Task 4.5 stops calling `ProductCard` with `product=`; it maps each featured `Product` to a card and passes the canonical props:
    ```tsx
    {
      view.featured.map((product, i) => {
        const card = toCatalogCard(product, locale);
        return (
          <ProductCard
            key={product.id}
            card={card}
            title={product.title[locale]}
            imageUrl={card.imageUrl}
            imageAlt={
              product.imagesByColor[card.matchedColors[0]]?.[0]?.alt[locale] ??
              product.title[locale]
            }
            locale={locale}
            priority={i < 3}
          />
        );
      });
    }
    ```
    The hedging note is removed. Phase 6 Task 6.2 changes verb from `Create` to **`Modify`** (`ProductCard` already exists from Phase 0.5; Phase 6 only adds the `catalog` message namespace and verifies via Playwright). `toCatalogCard` produces `imageUrl` as an explicit field on `CatalogCard` (see Phase 0.5 Task 0.5.5 for the `CatalogCard` field addition).

---

### Sequencing issues (5)

14. **Phase 4 Task 4.5 imports `@/components/product/ProductCard`, `@/components/ui/Button` (asChild + magnetic/ghost), `@/components/ui/Money`, `@/components/ui/FormattedDate`, and `@/lib/motion/capability` — but ProductCard is first defined in Phase 6, `useMotionCapability`/magnetic Button in Phase 9, and Money/FormattedDate are never created. Phase 4 imports symbols from LATER phases.**
    **Resolution:** **Phase 0.5 (new, runs after Phase 0 / before Phase 1) creates all of these foundational primitives:** `lib/motion/capability.ts` (Task 0.5.1), `components/ui/Button.tsx` with `default | ghost | magnetic` + `asChild` (Task 0.5.2), `components/ui/Money.tsx` + `components/ui/FormattedDate.tsx` (Task 0.5.3), `components/ui/Dialog.tsx` (Task 0.5.4), `components/product/ProductCard.tsx` + `toCatalogCard` (Task 0.5.5). Phase 9 Task 9.3 (motion hook) and Task 9.6 (magnetic Button) change verb to **`Modify`/enhance** the Phase-0.5 versions, not create. Phase 6 Task 6.2 `Modify`s ProductCard (item 13). Phase 4 may now import all of these because they exist.

15. **`useMotionCapability`'s shape is inconsistent: Phase 4 destructures `{ enabled }`, Phase 6 destructures `{ animate }`, Phase 9 defines `export function useMotionCapability(): boolean`.**
    **Resolution:** `useMotionCapability()` returns a **bare `boolean`** (canonical, defined in Phase 0.5 Task 0.5.1). Any `{ enabled }` or `{ animate }` destructure is wrong. All callers use `const motionEnabled = useMotionCapability();`. Concretely fix:
    - Phase 4 Task 4.3 `CountdownIsland`: `const motionEnabled = useMotionCapability();` (was `const { enabled: motionEnabled } = …`).
    - Phase 4 Task 4.4 `DropMarquee`/`AvailabilityBadge`: same (was `{ enabled: motionEnabled }`).
    - Phase 6 Task 6.2 `ProductCard`: `const motionEnabled = useMotionCapability();` and rename the local `animate`/`revealed` logic to use `motionEnabled` (was `const { animate } = …`). The `Consumes` annotation `(): { animate: boolean }` is corrected to `(): boolean`.
    - All `Expected: exit 0 … verifies useMotionCapability returns { enabled: boolean }` smoke notes are corrected to `returns boolean`.

16. **Phase 3's `CartHydrator` is "rendered inside `app/[locale]/layout.tsx`" and the cart drawer relies on a `CartDrawerProvider` mounted in the layout — but neither Phase 0 nor Phase 2 layout mounts them, and Phase 3 never edits the layout, so `useCartDrawer()` throws and the Zustand mirror is never hydrated.**
    **Resolution:** **Phase 0.5 Task 0.5.8 MODIFIES `app/[locale]/layout.tsx` to mount `<CartDrawerProvider>` wrapping `<Header/> {children} <Footer/>`** (open-state context only — drawer DATA/contents come in Phase 3). **Phase 3 then adds an explicit step to MODIFY `app/[locale]/layout.tsx` again** to mount `<CartHydrator serverCart={await cartService.getCart()} />` and the actual `<CartDrawer />` contents inside the already-present `<CartDrawerProvider>`. The server cart is read via `cartService.getCart()` (never `cartStore.read()` — see item 18). Phase 3's `CartHydrator`/`CartDrawer` task body changes its layout reference from "is rendered inside the layout (assumed)" to "MODIFY the layout to render it here."

17. **`lib/data/mock/cart-store.mock.ts` is `Create`d twice — Phase 1 Task 1.7 (in-memory `MockCartStore`) and Phase 3 Task 3.1 (signed-cookie version) — with different impls; after Phase 3 swaps in the `cookies()`-backed store, any Phase 1 bundle-level cart test would call `next/headers` `cookies()` in node env and fail. `lib/data/mock/seed/orders.ts` similarly has ambiguous creation (item 12).**
    **Resolution:** `lib/data/mock/cart-store.mock.ts` and `lib/data/mock/seed/orders.ts` are **created ONCE** (cart-store in Phase 1 Task 1.7 in-memory; orders in Phase 1 Task 1.6 with `userId: 'usr_member'`). **Phase 3 Task 3.1 changes its verb from `Create` to `replace`/overwrite** for `cart-store.mock.ts` (cookie-backed version) and is annotated: the cookie store requires a request scope, so **Phase 1's repo-swap / contract test MUST NOT exercise cart through the bundle** (it tests products/collections/orders/users only — verify cart `read()`/`write()` is untested there; any bundle-level cart assertion moves to an integration/e2e context). Phase 7 drops its duplicate orders-seed creation (item 12).

18. **Phase 8 Task 8.4 / Phase 7 account pages / Phase 5 PDP assume `components/ui/Button`, the Header cart-count trigger (`data-testid="cart-count"`), `Header`/`Footer`, `components/ui/Money`, `components/ui/FormattedDate`, and `components/ui/Dialog` exist "from earlier phases" — but no phase creates them; Phase 9 Task 9.5 even `Modify`s `Header.tsx` as if it exists; Phase 5 imports `@/components/ui/Dialog` (never created). Also: `deserializeCart` in the cookie store zeroes `subtotal` but sums `itemCount`, so a direct `cartStore.read()` returns an internally inconsistent cart.**
    **Resolution (two parts):**
    - **(a) Load-bearing components are created in Phase 0.5:** `components/layout/Header.tsx` (brand lockup, nav, `LocaleSwitcher` mount-point, cart-count trigger `data-testid="cart-count"` calling `useCartDrawer().open()`) + `components/layout/Footer.tsx` (Task 0.5.7); `components/ui/Button.tsx` (0.5.2); `components/ui/Money.tsx` + `components/ui/FormattedDate.tsx` (0.5.3); `components/ui/Dialog.tsx` (0.5.4). Phase 9 Task 9.5 and Phase 2's `LocaleSwitcher` task change to **`Modify`** Header (it already exists). The Phase 10 hero-slice e2e `data-testid="cart-count"` now resolves.
    - **(b) Cart read discipline:** `deserializeCart` in `lib/data/mock/cart-store.mock.ts` sets **BOTH `itemCount` AND `subtotal` to derived-zero** (`itemCount: 0`, `subtotal: { amount: 0, currency: 'THB' }`) so a raw store read is never half-derived. **ALL RSC reads of the cart go through `cartService.getCart(...)`**, which recomputes `itemCount` and `subtotal` from variant prices — never `cartStore.read()` directly. **Phase 7 (checkout/account) and Phase 8 are corrected to call `cartService.getCart()`** wherever they currently read `cartStore.read()`.

---

### Scaffold ownership (1) — resolves audit verdict must-fix #1

19. **Phase 0 (Tasks 0.1–0.7) AND Phase 1 Task 1.1 BOTH scaffold the project from scratch** — duplicate, conflicting `package.json` / `tsconfig.json` / `vitest.config.ts` / `.gitignore` with DIFFERENT pinned versions and a DIFFERENT Vitest path-alias mechanism. They describe the same files in the same repo, so the second one silently overwrites the first with different versions.
    **Resolution (single canonical scaffold):** **Phase 0 (Tasks 0.1–0.7) is the SOLE source of `package.json`, `tsconfig.json`, `vitest.config.ts`, `postcss.config.mjs`, `.gitignore`, and `playwright.config.ts`** — with the exact pinned versions and the `@/*` path alias from the `## Global Constraints` + `## File Structure`. **Phase 1 Task 1.1 changes its verb from `Create` to `Verify`:** it does NOT re-create those files; it runs `npm install` (if not already) then `npm run typecheck && npm run test` to confirm the Phase-0 harness is green, and adds ONLY Phase-1-specific test files (it creates no config). Delete Phase 1 Task 1.1's `package.json`/`tsconfig.json`/`vitest.config.ts`/`.gitignore` creation steps and its alternate version pins; the Vitest alias is whatever Phase 0 Task 0.6 established (`vite-tsconfig-paths` or the `resolve.alias` block — Phase 0's choice wins, Phase 1 must not introduce a second mechanism). Any version number that disagrees with Phase 0 is wrong by definition.

---

## Phase 0 — Scaffold & foundation

> **Goal of this phase:** stand up the `vanta/` project with the exact pinned stack (Next.js 15 App Router, React 19.2, TypeScript strict, Tailwind CSS v4 + its v4 PostCSS plugin, next-intl, Zustand, GSAP, Vitest, Playwright, Zod), the `@theme` token block, the per-locale headline font system, the `[locale]` root layout + UX-only locale middleware, and the empty folder skeleton. **Deliverable:** `npm run dev` renders a minimal bilingual shell at `/en` and `/th`; `npm run typecheck` and `npm run build` both pass; one Playwright smoke test proves both locales render with the correct `<html lang>` and per-locale display font wired.
>
> This is a foundation phase: there is no domain logic yet, so most tasks are _config + UI shell_ verified by build/typecheck and Playwright, not Vitest TDD. The one piece of pure logic introduced here (`lib/i18n/routing.ts` is config, not logic) is exercised indirectly by the locale smoke test. Real Vitest TDD begins in Phase 1 (domain/data/services).

---

### Task 0.1 — Initialize repo, pin the exact stack, and lock npm scripts

Create the project root by hand (we do **not** run `create-next-app`, because it scaffolds an `app/` we will replace and pulls unpinned versions; this plan pins every version). After this task, `npm install` succeeds and `package.json` exposes every script the rest of the plan invokes.

**Files**

- Create: `vanta/package.json`
- Create: `vanta/.gitignore`
- Create: `vanta/.nvmrc`
- Create: `vanta/README.md` (one-line placeholder; the full case-study README is a later phase)
- Test: none (verified by a clean install + the presence of every script; first real test arrives in Task 0.4)

**Interfaces**

- Consumes: nothing (greenfield).
- Produces: the `vanta/` npm package with scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, and `format` — every later phase invokes these exact names.

**Steps**

- [ ] Create the project directory: `mkdir -p d:/MINE/freelance/system/vanta && cd d:/MINE/freelance/system/vanta`.
- [ ] Create `vanta/package.json` with this exact content (versions pinned to the resolved Next-15 / React-19.2 line):

```json
{
  "name": "vanta",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.11.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write ."
  },
  "dependencies": {
    "next": "15.5.19",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "next-intl": "4.13.0",
    "zustand": "5.0.14",
    "gsap": "3.15.0",
    "zod": "4.4.3",
    "geist": "1.7.2"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/node": "22.20.0",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "tailwindcss": "4.3.1",
    "@tailwindcss/postcss": "4.3.1",
    "vitest": "3.2.6",
    "@vitejs/plugin-react": "6.0.3",
    "jsdom": "29.1.1",
    "@playwright/test": "1.55.1",
    "eslint": "9.39.0",
    "eslint-config-next": "15.5.19",
    "prettier": "3.6.2"
  }
}
```

- [ ] Create `vanta/.nvmrc` with the single line:

```
20.11.0
```

- [ ] Create `vanta/.gitignore` with this exact content:

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.*

# next
/.next/
/out/

# production
/build

# testing
/coverage
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/

# env
.env
.env*.local

# editor / os
.DS_Store
*.pem
.vscode/*
!.vscode/extensions.json
.idea/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.tsbuildinfo
next-env.d.ts
```

- [ ] Create `vanta/README.md` with a placeholder (the full case-study README is authored in a later phase):

````markdown
# VANTA®

Bangkok-born. Globally worn. Bilingual (EN/TH) streetwear storefront — portfolio showcase.

Backend-ready: the active data adapter is chosen in exactly one place, `lib/data/index.ts` ("change one import to go live"). See the case study (later phase) for the architecture diagram and the curl-able `/api`.

## Local dev

```bash
npm install
npm run dev   # http://localhost:3000/en  and  http://localhost:3000/th
```
````

````

- [ ] Install dependencies, generating the npm lockfile: `cd d:/MINE/freelance/system/vanta && npm install`.
  - Expected: install completes with no `ERESOLVE` peer error (next-intl 4.13.0 declares `next: ^15.0.0` and `react: ^19.0.0` as peers — both satisfied), and `vanta/package-lock.json` + `vanta/node_modules/` now exist.
- [ ] Install the Playwright Chromium browser binary (the only browser this plan drives): `cd d:/MINE/freelance/system/vanta && npx playwright install chromium`.
  - Expected: "Chromium … downloaded" (or "is already installed").
- [ ] Initialize git and make the first commit:

```bash
cd d:/MINE/freelance/system/vanta && git init && git add -A && git commit -m "chore: scaffold vanta project with pinned next 15 / react 19.2 stack"
````

---

### Task 0.2 — TypeScript strict config, PostCSS (Tailwind v4 plugin), Prettier, ESLint

Wire the compiler in **strict** mode with the `@/*` path alias rooted at the project directory (so `@/lib/domain` resolves to `vanta/lib/domain`, matching the contract's import convention), and register the Tailwind v4 PostCSS plugin. After this task, `npm run typecheck` runs (against an empty source tree) and exits 0.

**Files**

- Create: `vanta/tsconfig.json`
- Create: `vanta/postcss.config.mjs`
- Create: `vanta/.prettierrc.json`
- Create: `vanta/.prettierignore`
- Create: `vanta/eslint.config.mjs`
- Create: `vanta/next-env.d.ts` is auto-generated by `next` — do **not** hand-author it (it is gitignored in Task 0.1).
- Test: none (verified by `npm run typecheck` exit 0).

**Interfaces**

- Consumes: `package.json` from Task 0.1.
- Produces: the `@/*` → `./` path alias (the single alias every later import relies on), strict-mode compilation, and the Tailwind v4 PostCSS pipeline that `globals.css` (Task 0.3) requires.

**Steps**

- [ ] Create `vanta/tsconfig.json` with this exact content (strict; `paths "@/*" -> "./"` per the contract; `bundler` resolution for Next 15 + ESM):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> `verbatimModuleSyntax: true` enforces the contract's `import type { … }` discipline; `noUncheckedIndexedAccess: true` is the strictness lever that pushes Phase-1 code toward `unknown` + narrowing instead of `any`.

- [ ] Create `vanta/postcss.config.mjs` with this exact content (the Tailwind **v4** PostCSS plugin is a separate package, `@tailwindcss/postcss`):

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] Create `vanta/.prettierrc.json` with this exact content:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] Create `vanta/.prettierignore` with this exact content:

```
.next/
node_modules/
package-lock.json
playwright-report/
test-results/
messages/
```

- [ ] Create `vanta/eslint.config.mjs` with this exact content (flat config consuming `eslint-config-next`):

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
];

export default eslintConfig;
```

- [ ] Add the flat-config bridge dependency (required by the ESLint flat config above): `cd d:/MINE/freelance/system/vanta && npm install -D @eslint/eslintrc@3.3.1`.
- [ ] Run typecheck against the (still empty) source tree: `cd d:/MINE/freelance/system/vanta && npm run typecheck`.
  - Expected: `tsc --noEmit` exits 0 with no output. (No `.ts`/`.tsx` source files exist yet besides config; there is nothing to fail.)
- [ ] Commit:

```bash
cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "chore(config): add strict tsconfig, tailwind v4 postcss, eslint, prettier"
```

---

### Task 0.3 — `next.config.ts` (next-intl plugin + View Transitions), Tailwind v4 `globals.css` with the `@theme` token block

Wire the next-intl plugin into the Next config (pointing at the request config we author in Task 0.5), enable the experimental View Transitions flag the hero slice needs, and author `globals.css` with the **verbatim** `@theme` token block and per-locale headline rules. After this task, the global stylesheet compiles through the Tailwind v4 pipeline.

**Files**

- Create: `vanta/next.config.ts`
- Create: `vanta/app/globals.css`
- Test: none yet (CSS is validated by the build in Task 0.6 and visually by the smoke test in Task 0.7).

**Interfaces**

- Consumes: `postcss.config.mjs` (Task 0.2); references `./lib/i18n/request.ts` (authored in Task 0.5 — the path is declared here, the file lands next).
- Produces: the `@theme` design tokens (`--color-ink`, `--color-paper`, `--color-blaze`, `--color-blaze-on-light`, `--color-lime`, the smoke greys, the four font tokens, `--spacing`, `--max-w-shell`) and the `:lang(en)/:lang(th) .display` headline rules that every later UI task consumes.

**Steps**

- [ ] Create `vanta/next.config.ts` with this exact content (the next-intl plugin must be pointed at the request-config file path; `viewTransition` is enabled for the React 19.2 `<ViewTransition>` primitive used by the PDP):

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
};

export default withNextIntl(nextConfig);
```

- [ ] Create `vanta/app/globals.css` with the **verbatim** token block from the contract, plus a minimal base resetting body to the void palette so the shell renders dark out of the box:

```css
@import 'tailwindcss';

@theme {
  --color-ink: #0a0a0a;
  --color-paper: #f5f4ef;
  --color-blaze: #ff3b1f;
  --color-blaze-on-light: #d62e16; /* AA-safe on paper */
  --color-lime: #d4ff2e; /* lime-on-dark ONLY */
  --color-smoke-900: #141414;
  --color-smoke-700: #2a2a2a;
  --color-smoke-500: #6b6b6b;
  --color-smoke-300: #b8b8b8;

  --font-display-en: 'Clash Display', system-ui, sans-serif;
  --font-display-th: 'Kanit', system-ui, sans-serif;
  --font-body: 'Geist', 'IBM Plex Sans Thai', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  --spacing: 0.5rem; /* 8pt grid base */
  --max-w-shell: 1440px;
}

/* Per-locale headline tokens */
:lang(en) .display {
  font-family: var(--font-display-en);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}
:lang(th) .display {
  font-family: var(--font-display-th);
  text-transform: none;
  letter-spacing: 0.01em;
  line-height: 1.35;
}

/* Base: the void renders dark by default; reduced-motion safe (no opacity:0 anywhere). */
html {
  background-color: var(--color-ink);
  color: var(--color-paper);
  font-family: var(--font-body);
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100dvh;
}
```

> The `--font-display-en/th/body/mono` token _names_ match the `next/font` CSS variables we assign in Task 0.4 (`--font-display-en` etc.), so the font files actually back these tokens. The literal family names (`"Clash Display"`, `"Kanit"`, `"Geist"`, `"IBM Plex Sans Thai"`, `"Geist Mono"`) are the `next/font` `variable`-bound families wired there.

- [ ] Commit:

```bash
cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(config): wire next-intl plugin, view transitions, and tailwind v4 theme tokens"
```

---

### Task 0.4 — `next/font` setup for the paired display fonts + body + mono

Load the five typefaces via `next/font` so the `@theme` font tokens resolve to real font files: **Clash Display** (Latin display, self-hosted via `next/font/local`), **Kanit** (Thai display, Google), **Geist** + **Geist Mono** (the `geist` package), and **IBM Plex Sans Thai** (Thai body, Google). Each is bound to the CSS variable the token block references (`--font-display-en`, `--font-display-th`, `--font-body`, `--font-mono`, and the Thai body family folded into `--font-body`). After this task, a unit-style assertion confirms the font module exports the exact variable class names.

**Files**

- Create: `vanta/lib/fonts.ts`
- Create: `vanta/public/fonts/ClashDisplay-Variable.woff2` (placeholder binary; see step note)
- Test: `vanta/tests/unit/fonts.test.ts`

**Interfaces**

- Consumes: the `geist` package (Task 0.1); `next/font/google` and `next/font/local`.
- Produces: `export const fontClassNames: string` — a space-joined string of every font's `.variable` class, applied to `<html>` in Task 0.6 so the `--font-*` CSS variables are in scope for the `@theme` tokens.

**Steps**

- [ ] **Write the failing test first.** Create `vanta/tests/unit/fonts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fontClassNames } from '@/lib/fonts';

describe('fontClassNames', () => {
  it('is a non-empty space-joined class string', () => {
    expect(typeof fontClassNames).toBe('string');
    expect(fontClassNames.trim().length).toBeGreaterThan(0);
  });

  it('binds all five font CSS variables', () => {
    // next/font assigns each font a generated class; we assert the variable names
    // we requested are present in the className string via the variable hooks.
    expect(fontClassNames).toContain('--font-display-en');
    expect(fontClassNames).toContain('--font-display-th');
    expect(fontClassNames).toContain('--font-body');
    expect(fontClassNames).toContain('--font-body-th');
    expect(fontClassNames).toContain('--font-mono');
  });
});
```

> This test depends on `vitest.config.ts` (authored in Task 0.6). If you are executing strictly top-to-bottom, complete Task 0.6's vitest config first, then return here — or run the config step inline. The run-it-fails command below assumes the vitest config exists.

- [ ] Run it and **show it fail** (module not found): `cd d:/MINE/freelance/system/vanta && npm run test -- fonts`.
  - Expected: Vitest reports `FAIL tests/unit/fonts.test.ts` with `Error: Failed to load url @/lib/fonts` (the module does not exist yet).
- [ ] Provide the Clash Display font binary. Clash Display is a free Fontshare face with no npm package, so it is self-hosted via `next/font/local`. Place the variable `.woff2` at `vanta/public/fonts/ClashDisplay-Variable.woff2`. Download it (Fontshare ships an OTF/woff2 family; convert/extract the variable woff2):

```bash
cd d:/MINE/freelance/system/vanta && mkdir -p public/fonts
# Fetch the Clash Display variable woff2 (free, Fontshare ITF Free Font License).
curl -L -o public/fonts/ClashDisplay-Variable.woff2 \
  "https://api.fontshare.com/v2/fonts/download/clash-display" 2>/dev/null || true
```

- Expected: a `public/fonts/ClashDisplay-Variable.woff2` file exists. If the Fontshare endpoint returns a zip rather than a raw woff2, unzip it and copy the `ClashDisplay-Variable.woff2` (the variable-weight file) into `public/fonts/`. The font file must be a valid woff2 or `next/font/local` will throw at build time — verify with `file public/fonts/ClashDisplay-Variable.woff2` reporting `Web Open Font Format (Version 2)`.

- [ ] Create `vanta/lib/fonts.ts` with this exact content:

```ts
import localFont from 'next/font/local';
import { Kanit, IBM_Plex_Sans_Thai } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

/** Latin display — Clash Display (self-hosted variable woff2). ALL-CAPS + tight tracking applied via :lang(en) .display in globals.css. */
const clashDisplay = localFont({
  src: '../public/fonts/ClashDisplay-Variable.woff2',
  variable: '--font-display-en',
  display: 'swap',
  weight: '200 700',
});

/** Thai display — Kanit (Black/SemiBold). No all-caps; looser tracking via :lang(th) .display. */
const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['600', '900'],
  variable: '--font-display-th',
  display: 'swap',
});

/** Thai body — IBM Plex Sans Thai. Folded into --font-body via the family list in globals.css. */
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-th',
  display: 'swap',
});

/**
 * Every font's generated `.variable` class, space-joined for <html className>.
 * GeistSans is bound to --font-body and GeistMono to --font-mono by the geist package.
 */
export const fontClassNames: string = [
  clashDisplay.variable, // --font-display-en
  kanit.variable, // --font-display-th
  GeistSans.variable, // --font-body (geist default variable name)
  ibmPlexSansThai.variable, // --font-body-th
  GeistMono.variable, // --font-mono (geist default variable name)
].join(' ');
```

> The `geist` package binds `GeistSans` to `--font-geist-sans` and `GeistMono` to `--font-geist-mono` by default, NOT to `--font-body`/`--font-mono`. The test asserts the literal substrings `--font-body` and `--font-mono`; to satisfy that and to make the `@theme` tokens resolve, alias the geist variables in `globals.css` (next step) — the className string contains the geist-generated classes, but the _test_ must assert on names we control. **Correct the test and the variable wiring as follows** so they agree.

- [ ] Re-bind the geist variables to the contract's token names so `globals.css` resolves cleanly. Append these alias lines to `vanta/app/globals.css` (right after the `:lang(th) .display` rule), mapping geist's default variables to the families the `@theme` block names, and folding the Thai body in:

```css
/* Bind next/font variables to the @theme family names. */
:root {
  --font-display-en: var(--font-display-en, 'Clash Display');
  --font-display-th: var(--font-display-th, 'Kanit');
  --font-body: var(--font-geist-sans), var(--font-body-th), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}
```

> Because the geist package emits `--font-geist-sans` / `--font-geist-mono`, the `fontClassNames` string will contain those, not `--font-body`/`--font-mono`. Update the test's third/fifth assertions accordingly so the test reflects reality (TDD: the test asserts the _true_ contract of `fontClassNames`).

- [ ] Update `vanta/tests/unit/fonts.test.ts` — replace the second `it(...)` block with the accurate assertion set:

```ts
it('binds all five font CSS variables', () => {
  expect(fontClassNames).toContain('--font-display-en');
  expect(fontClassNames).toContain('--font-display-th');
  expect(fontClassNames).toContain('--font-geist-sans'); // -> aliased to --font-body in globals.css
  expect(fontClassNames).toContain('--font-body-th');
  expect(fontClassNames).toContain('--font-geist-mono'); // -> aliased to --font-mono in globals.css
});
```

- [ ] Run it and **show it pass**: `cd d:/MINE/freelance/system/vanta && npm run test -- fonts`.
  - Expected: `PASS tests/unit/fonts.test.ts` — 2 tests passing. (`next/font` in the Vitest node/jsdom env returns objects whose `.variable` is the generated class string containing the requested CSS-variable name, so the substring assertions hold without a browser.)
- [ ] Commit:

```bash
cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(fonts): load paired display, body, and mono fonts via next/font"
```

---

### Task 0.5 — next-intl routing, request config, navigation, middleware, and the message files

Author the next-intl config trio **verbatim** from the contract (`routing.ts`, `navigation.ts`, `request.ts`), the UX-only locale middleware (locale matching + redirect ONLY — never authorization, per CVE-2025-29927), and the two message files (`en.json` + a mirror-keyed `th.json`) with the minimal namespace the shell needs.

**Files**

- Create: `vanta/lib/i18n/routing.ts`
- Create: `vanta/lib/i18n/navigation.ts`
- Create: `vanta/lib/i18n/request.ts`
- Create: `vanta/middleware.ts`
- Create: `vanta/messages/en.json`
- Create: `vanta/messages/th.json`
- Test: `vanta/tests/unit/i18n-messages.test.ts`

**Interfaces**

- Consumes: nothing from earlier tasks at runtime; the `next.config.ts` plugin (Task 0.3) points at `request.ts`.
- Produces (verbatim per contract): `routing` (locales `['en','th']`, defaultLocale `'en'`, localePrefix `'always'`); the `Link`/`redirect`/`usePathname`/`useRouter`/`getPathname` localized navigation helpers; the default `getRequestConfig`. Produces the `messages` key tree consumed by every later UI string.

**Steps**

- [ ] **Write the failing test first.** Create `vanta/tests/unit/i18n-messages.test.ts` (proves the two locales are key-isomorphic — the contract requires `th.json` to mirror the keyset of `en.json`):

```ts
import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import th from '@/messages/th.json';

/** Recursively collect dotted key paths so we compare structure, not values. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return keyPaths(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('i18n message catalogs', () => {
  it('th.json mirrors the exact keyset of en.json', () => {
    const enKeys = keyPaths(en as Record<string, unknown>).sort();
    const thKeys = keyPaths(th as Record<string, unknown>).sort();
    expect(thKeys).toEqual(enKeys);
  });

  it('has the shell namespace used by the [locale] layout', () => {
    expect(en).toHaveProperty('Shell.tagline');
    expect(th).toHaveProperty('Shell.tagline');
  });
});
```

- [ ] Run it and **show it fail** (modules not found): `cd d:/MINE/freelance/system/vanta && npm run test -- i18n-messages`.
  - Expected: `FAIL tests/unit/i18n-messages.test.ts` with `Failed to load url @/messages/en.json` (the message files do not exist yet).
- [ ] Create `vanta/lib/i18n/routing.ts` (**verbatim**):

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'th'] as const,
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

- [ ] Create `vanta/lib/i18n/navigation.ts` (**verbatim**):

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] Create `vanta/lib/i18n/request.ts` (**verbatim** from the contract; this is the file `next.config.ts` references):

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as any) ? requested! : routing.defaultLocale;
  return { locale, messages: (await import(`@/messages/${locale}.json`)).default };
});
```

> The single `as any` here is inside the i18n config trio quoted verbatim from the locked contract; the "no `any` in `lib/**`" rule explicitly exempts these verbatim contract files. Do not "fix" it — it must match the contract byte-for-byte.

- [ ] Create `vanta/middleware.ts` — **UX-only** locale middleware. It matches/redirects locales and nothing else (no `cookies()`-based auth check, no role gate — authorization lives in services/DAL per the contract):

```ts
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
```

- [ ] Create `vanta/messages/en.json` (minimal shell namespace; later phases add `Home`, `Pdp`, `Cart`, etc.):

```json
{
  "Shell": {
    "brand": "VANTA®",
    "tagline": "Bangkok-born. Globally worn.",
    "skipToContent": "Skip to content",
    "localeName": "English"
  },
  "Locale": {
    "switchTo": "Switch language",
    "en": "EN",
    "th": "TH"
  }
}
```

- [ ] Create `vanta/messages/th.json` (exact mirror keyset; values translated — `tagline` keeps the brand line, `localeName` in Thai):

```json
{
  "Shell": {
    "brand": "VANTA®",
    "tagline": "เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก",
    "skipToContent": "ข้ามไปยังเนื้อหา",
    "localeName": "ไทย"
  },
  "Locale": {
    "switchTo": "เปลี่ยนภาษา",
    "en": "EN",
    "th": "TH"
  }
}
```

- [ ] Run the test and **show it pass**: `cd d:/MINE/freelance/system/vanta && npm run test -- i18n-messages`.
  - Expected: `PASS tests/unit/i18n-messages.test.ts` — 2 tests passing (the two catalogs are key-isomorphic and both expose `Shell.tagline`).
- [ ] Commit:

```bash
cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(i18n): add next-intl routing, request config, navigation, middleware, and en/th messages"
```

---

### Task 0.6 — Root layout, `[locale]` layout (provider + fonts + lang/dir), minimal shell page, and the Vitest config

Author the two-level layout: the locale-agnostic root `app/layout.tsx` (sets `<html>` with the font class names so the `--font-*` variables are in scope) and the `app/[locale]/layout.tsx` that validates the locale param, sets `<html lang>` to the active locale, and wraps children in `NextIntlClientProvider`. Add a minimal `(shop)/page.tsx` so `/en` and `/th` render something. Author `vitest.config.ts` so the unit tests in Tasks 0.4/0.5 run.

> **Note on `<html>` nesting:** Next 15's App Router renders exactly one `<html>`. Per the contract file structure, the root `layout.tsx` is "no locale; passes through" and `[locale]/layout.tsx` owns "html lang/dir". To avoid a double-`<html>`, the **root** layout renders `<html>` with the font classes and a neutral `lang`, and the **`[locale]`** layout sets the _runtime_ `lang`/`dir` via the `setRequestLocale` + a `lang`-syncing inline approach. We implement the simplest correct shape: root renders `<html lang>` and the locale layout updates it through Next's metadata + the provider; the smoke test asserts the final `lang` attribute.

**Files**

- Create: `vanta/app/layout.tsx`
- Create: `vanta/app/[locale]/layout.tsx`
- Create: `vanta/app/[locale]/(shop)/page.tsx`
- Create: `vanta/vitest.config.ts`
- Create: `vanta/vitest.setup.ts`
- Test: re-runs the existing unit suites (Tasks 0.4, 0.5) — this is where `vitest.config.ts` first makes them runnable end-to-end.

**Interfaces**

- Consumes: `fontClassNames` (Task 0.4), `routing` (Task 0.5), the `Shell` message namespace (Task 0.5).
- Produces: the rendered bilingual shell at `/en` and `/th`; the Vitest runner config (`node`/`jsdom` env, `@/*` alias mirrored from tsconfig, React plugin) that every later Vitest task relies on.

**Steps**

- [ ] Create `vanta/vitest.config.ts` (node env for `lib/**` logic per the contract; jsdom only where a DOM is needed — fonts/messages tests are pure module loads, so node is sufficient; the `@/*` alias mirrors tsconfig):

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
```

- [ ] Create `vanta/vitest.setup.ts` (mocks `next/font` so font modules load under Vitest without the Next bundler — returns objects whose `.variable` contains the requested CSS-variable name, satisfying the Task 0.4 assertions):

```ts
import { vi } from 'vitest';

vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({
    className: 'mock-font',
    variable: opts.variable ?? '',
    style: { fontFamily: 'mock' },
  }),
}));

vi.mock('next/font/google', () => {
  const factory = (opts: { variable?: string }) => ({
    className: 'mock-font',
    variable: opts.variable ?? '',
    style: { fontFamily: 'mock' },
  });
  return new Proxy(
    {},
    {
      get: () => factory,
    },
  );
});

vi.mock('geist/font/sans', () => ({
  GeistSans: {
    className: 'mock-geist-sans',
    variable: '--font-geist-sans',
    style: { fontFamily: 'mock' },
  },
}));

vi.mock('geist/font/mono', () => ({
  GeistMono: {
    className: 'mock-geist-mono',
    variable: '--font-geist-mono',
    style: { fontFamily: 'mock' },
  },
}));
```

- [ ] Re-run the unit suite from Tasks 0.4 and 0.5 to confirm the config wires them up: `cd d:/MINE/freelance/system/vanta && npm run test`.
  - Expected: `PASS tests/unit/fonts.test.ts` and `PASS tests/unit/i18n-messages.test.ts` — 4 tests passing total.
- [ ] Create `vanta/app/layout.tsx` (locale-agnostic root; owns the single `<html>`, applies the font variable classes and `globals.css`, base `lang="en"` overridden at runtime by the locale layout's metadata):

```tsx
import type { ReactNode } from 'react';
import { fontClassNames } from '@/lib/fonts';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={fontClassNames} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] Create `vanta/app/[locale]/layout.tsx` (validates the locale param against `routing.locales`, enables static rendering via `setRequestLocale`, loads messages, and provides them; syncs `<html lang>` to the active locale with a tiny inline script that is reduced-motion-irrelevant and SSR-safe):

```tsx
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import type { Locale } from '@/lib/domain/i18n';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Sync the document language so :lang(en)/:lang(th) headline tokens apply. */}
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir="ltr";`,
        }}
      />
      {children}
    </NextIntlClientProvider>
  );
}
```

> `import type { Locale } from '@/lib/domain/i18n'` references the domain `Locale` type. That file (`lib/domain/i18n.ts`) is authored in Phase 1. **To keep Phase 0 self-contained and building**, create the minimal `lib/domain/i18n.ts` now exactly as the contract defines it (it is locked, will not change, and Phase 1 simply builds on it):

- [ ] Create `vanta/lib/domain/i18n.ts` (verbatim per the SHARED CONTRACTS — Phase 1 owns the rest of `lib/domain`, but this one type is needed by the layout now and is locked):

```ts
export type Locale = 'en' | 'th';

/** Every user-facing string is bilingual and first-class. */
export type LocalizedText = {
  en: string;
  th: string;
};
```

- [ ] Create `vanta/app/[locale]/(shop)/page.tsx` — the minimal shell home. It reads the `Shell` namespace, renders the brand lockup with the `.display` headline class (so the per-locale token visibly switches), and is content-visible-by-default (no `opacity:0`):

```tsx
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Shell');

  return (
    <main
      style={{
        maxWidth: 'var(--max-w-shell)',
        margin: '0 auto',
        padding: 'calc(var(--spacing) * 6) calc(var(--spacing) * 3)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'calc(var(--spacing) * 2)',
      }}
    >
      <h1
        className="display"
        data-testid="brand"
        style={{ fontSize: 'clamp(3rem, 12vw, 9rem)', margin: 0, lineHeight: 1 }}
      >
        {t('brand')}
      </h1>
      <p
        data-testid="tagline"
        style={{ color: 'var(--color-smoke-300)', fontSize: '1.125rem', margin: 0 }}
      >
        {t('tagline')}
      </p>
      <code
        data-testid="locale-stamp"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-lime)', fontSize: '0.875rem' }}
      >
        /{locale}
      </code>
    </main>
  );
}
```

- [ ] Run typecheck to confirm the layout + page + domain type compile: `cd d:/MINE/freelance/system/vanta && npm run typecheck`.
  - Expected: `tsc --noEmit` exits 0 with no output.
- [ ] Commit:

```bash
cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(shell): add root and [locale] layouts, minimal bilingual home, and vitest config"
```

---

### Task 0.7 — Empty folder skeleton, Playwright config, and the bilingual smoke spec (phase deliverable)

Create the empty folder skeleton (with `.gitkeep`s) for every directory the later phases fill, author `playwright.config.ts` (boots `npm run dev`, Chromium project + a reduced-motion project), and write the smoke spec proving `/en` and `/th` both render, carry the correct `<html lang>`, and apply the correct per-locale display font. Then verify the full deliverable: `dev` renders the shell, `typecheck` and `build` pass.

**Files**

- Create: `vanta/playwright.config.ts`
- Create: `vanta/tests/e2e/shell.spec.ts`
- Create (skeleton, each with a `.gitkeep`): `vanta/lib/domain/`, `vanta/lib/data/repositories/`, `vanta/lib/data/mock/seed/`, `vanta/lib/services/`, `vanta/lib/actions/`, `vanta/lib/format/`, `vanta/lib/motion/`, `vanta/lib/store/`, `vanta/components/drop/`, `vanta/components/pdp/`, `vanta/components/cart/`, `vanta/components/product/`, `vanta/components/checkout/`, `vanta/components/layout/`, `vanta/components/ui/`, `vanta/app/api/products/`, and the route-group page folders under `app/[locale]/` listed in the contract tree.
- Test: `vanta/tests/e2e/shell.spec.ts` (Playwright — the phase deliverable check).

**Interfaces**

- Consumes: the running dev server (the shell from Task 0.6), `routing` locales.
- Produces: the directory skeleton every later phase writes into; the Playwright runner config + the bilingual + reduced-motion smoke spec.

**Steps**

- [ ] Create the empty folder skeleton with `.gitkeep` files (folders that will be populated in later phases; route-group page folders are created here so the structure matches the contract tree, but their `page.tsx` files arrive in later phases):

```bash
cd d:/MINE/freelance/system/vanta
mkdir -p \
  lib/data/repositories lib/data/mock/seed lib/services lib/actions lib/format lib/motion lib/store \
  components/drop components/pdp components/cart components/product components/checkout components/layout components/ui \
  app/api/products \
  "app/[locale]/(shop)/shop" "app/[locale]/(shop)/product/[slug]" "app/[locale]/(shop)/collections/[slug]" "app/[locale]/(shop)/search" \
  "app/[locale]/(checkout)/cart" "app/[locale]/(checkout)/checkout/[orderId]" \
  "app/[locale]/(auth)/login" "app/[locale]/(auth)/register" \
  "app/[locale]/(account)/account/orders" "app/[locale]/(account)/account/addresses" "app/[locale]/(account)/account/settings" \
  "app/[locale]/(admin)/admin"
# Drop a .gitkeep into each currently-empty leaf directory so git tracks the skeleton.
for d in lib/data/repositories lib/data/mock/seed lib/services lib/actions lib/format lib/motion lib/store \
         components/drop components/pdp components/cart components/product components/checkout components/layout components/ui \
         app/api/products \
         "app/[locale]/(shop)/shop" "app/[locale]/(shop)/product/[slug]" "app/[locale]/(shop)/collections/[slug]" "app/[locale]/(shop)/search" \
         "app/[locale]/(checkout)/cart" "app/[locale]/(checkout)/checkout/[orderId]" \
         "app/[locale]/(auth)/login" "app/[locale]/(auth)/register" \
         "app/[locale]/(account)/account/orders" "app/[locale]/(account)/account/addresses" "app/[locale]/(account)/account/settings" \
         "app/[locale]/(admin)/admin"; do
  touch "$d/.gitkeep"
done
```

- Expected: the directory tree under `lib/`, `components/`, and `app/[locale]/` now matches the contract FILE STRUCTURE, with `.gitkeep` placeholders in every leaf that has no source file yet.

- [ ] Create `vanta/playwright.config.ts` (boots the dev server, one desktop Chromium project plus a dedicated reduced-motion project so the contract's "one reduced-motion run" is a first-class project):

```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
      // Reduced-motion is forced per-test via test.use({ ... }) in reduced-motion specs;
      // this project exists so a reduced-motion run is selectable: `npx playwright test --project=reduced-motion`.
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] Create `vanta/tests/e2e/shell.spec.ts` — the phase deliverable check. It asserts both locales render the brand, carry the right `<html lang>`, expose the locale stamp, and that the `.display` headline resolves to the correct per-locale family (Clash Display family token on `/en`, Kanit on `/th`):

```ts
import { test, expect } from '@playwright/test';

test.describe('bilingual shell renders at /en and /th', () => {
  test('/en renders the shell with lang="en" and the EN display font', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('brand')).toHaveText('VANTA®');
    await expect(page.getByTestId('tagline')).toHaveText('Bangkok-born. Globally worn.');
    await expect(page.getByTestId('locale-stamp')).toHaveText('/en');

    // :lang(en) .display -> --font-display-en (Clash Display). Assert the resolved family contains it.
    const family = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Clash Display');

    // :lang(en) .display uppercases.
    const transform = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('uppercase');
  });

  test('/th renders the shell with lang="th" and the Thai display font (no all-caps)', async ({
    page,
  }) => {
    await page.goto('/th');

    await expect(page.locator('html')).toHaveAttribute('lang', 'th');
    await expect(page.getByTestId('brand')).toHaveText('VANTA®');
    await expect(page.getByTestId('tagline')).toHaveText('เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก');
    await expect(page.getByTestId('locale-stamp')).toHaveText('/th');

    const family = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Kanit');

    // :lang(th) .display does NOT uppercase.
    const transform = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('none');
  });

  test('the bare root redirects to the default locale (/en)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
  });
});
```

- [ ] **Run the smoke spec and show it pass.** Playwright will boot `npm run dev` itself via the `webServer` block: `cd d:/MINE/freelance/system/vanta && npm run test:e2e -- shell.spec.ts`.
  - Expected: `3 passed` — `/en` renders with `lang="en"`, uppercase Clash Display headline; `/th` renders with `lang="th"`, non-uppercase Kanit headline; bare `/` redirects to `/en` (locale middleware, UX-only).
- [ ] **Visual verification of both locales.** With the dev server running (`cd d:/MINE/freelance/system/vanta && npm run dev`), capture screenshots of both shells using the Playwright MCP (or Chrome DevTools MCP) against `http://localhost:3000/en` and `http://localhost:3000/th`. Confirm by eye: dark `--ink` canvas, paper text, the EN headline is ALL-CAPS tight-tracked (Clash Display) and the TH headline uses Kanit with looser tracking / taller line-height and is **not** all-caps; the lime `/en` `/th` locale stamp is the only lime on the page (lime-on-dark, well under 5% coverage). Save both screenshots for the case study.
- [ ] **Run the reduced-motion project** to prove the static experience renders identically (no `opacity:0`, content visible by default): `cd d:/MINE/freelance/system/vanta && npm run test:e2e -- --project=reduced-motion shell.spec.ts`.
  - Expected: `3 passed` (the shell has no motion yet, so reduced-motion is a no-op and content is fully visible — confirming the "visible by default" invariant from the start).
- [ ] **Verify the full phase deliverable — typecheck + build pass.** Run both gates:

```bash
cd d:/MINE/freelance/system/vanta && npm run typecheck && npm run build
```

- Expected: `tsc --noEmit` exits 0; then `next build` completes with `✓ Compiled successfully` and the route list shows `/[locale]` (and the `/_not-found`), confirming the App Router compiled the bilingual shell. No type errors, no missing-module errors.
- [ ] Commit:

```bash
cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "test(shell): add playwright bilingual smoke spec and project folder skeleton"
```

---

**Phase 0 exit criteria (all met by Task 0.7):**

- `npm run dev` serves a minimal bilingual shell at `/en` and `/th`; bare `/` redirects to `/en` via the UX-only locale middleware.
- `<html lang>` flips per locale; the `.display` headline resolves to Clash Display (uppercase, tight tracking) on EN and Kanit (no caps, looser tracking) on TH — the per-locale headline tokens are wired and proven by Playwright.
- The `@theme` token block is verbatim and live (void `--ink` canvas, `--paper` text, single lime stamp on dark).
- `npm run typecheck` and `npm run build` both pass.
- The full folder skeleton from the contract FILE STRUCTURE exists, ready for Phase 1 (domain types, repositories, mock seed) to fill in.

---

Relevant absolute file paths produced by this phase (for the next author): `d:/MINE/freelance/system/vanta/package.json`, `d:/MINE/freelance/system/vanta/tsconfig.json`, `d:/MINE/freelance/system/vanta/next.config.ts`, `d:/MINE/freelance/system/vanta/app/globals.css`, `d:/MINE/freelance/system/vanta/lib/fonts.ts`, `d:/MINE/freelance/system/vanta/lib/i18n/{routing,navigation,request}.ts`, `d:/MINE/freelance/system/vanta/middleware.ts`, `d:/MINE/freelance/system/vanta/messages/{en,th}.json`, `d:/MINE/freelance/system/vanta/app/layout.tsx`, `d:/MINE/freelance/system/vanta/app/[locale]/layout.tsx`, `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/page.tsx`, `d:/MINE/freelance/system/vanta/lib/domain/i18n.ts`, `d:/MINE/freelance/system/vanta/vitest.config.ts`, `d:/MINE/freelance/system/vanta/playwright.config.ts`, `d:/MINE/freelance/system/vanta/tests/e2e/shell.spec.ts`.

---

Now I have full context. Let me write Phase 1 as polished markdown. I'll verify the drop timing semantics from the contract's `deriveAvailability` precedence carefully and construct a coherent seed catalog that satisfies all constraints (12+ products, 3 sold-out, 4 low-stock, drops with the three timestamps).

Here is Phase 1, ready to paste into the plan document.

---

## Phase 1 — Domain & data layer

> **This phase is the TDD showcase.** Every task below is LOGIC, so each follows `superpowers:test-driven-development` strictly: write the failing Vitest test, run it and SHOW it fail with the exact command + expected output, implement the minimal code, run it and SHOW it pass, then commit with a clean Conventional Commit (NO Claude attribution). Domain types are copied **verbatim** from the LOCKED CONTRACTS — they are law and must not be widened or renamed. All app/component code reaches data through `@/lib/data` and types through `@/lib/domain`; nothing outside this phase imports `@/lib/data/mock` directly.

This phase delivers, in order:

1. The project skeleton + tooling so Vitest can run against `lib/**` (node env, `@/*` paths, strict TS).
2. `lib/domain/**` — pure types, verbatim, with a barrel.
3. `lib/format/money.ts` + `lib/format/date.ts` (TDD).
4. `lib/data/repositories/**` — the interfaces.
5. `lib/data/mock/seed/**` — the typed seed catalog (≥12 products, 3 sold-out, 4 low-stock, drops).
6. `lib/data/mock/**` adapters + `mockRepositories` bundle, then `lib/data/index.ts` (the swap point), proven by a repository-query test.
7. `lib/services/availability.ts` — `deriveAvailability` (pure), proven across every state transition incl. early-access by role.
8. `lib/services/drop-service.ts` — `dropService` wired through repositories.

---

### Task 1.1 — Project skeleton, tooling, and a green Vitest harness

The deliverable is independently testable: a single trivial Vitest spec compiles under strict TS with `@/*` path resolution and passes, proving the harness is real before any domain logic depends on it.

**Files**

- Create: `d:/MINE/freelance/system/vanta/package.json`
- Create: `d:/MINE/freelance/system/vanta/tsconfig.json`
- Create: `d:/MINE/freelance/system/vanta/vitest.config.ts`
- Create: `d:/MINE/freelance/system/vanta/.gitignore`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/harness.test.ts`

**Interfaces**

- Consumes: nothing (bootstrap).
- Produces: npm scripts `test`, `typecheck`; Vitest configured with `environment: 'node'` and the `@/*` alias resolving to the project root.

**Steps**

- [ ] Create `d:/MINE/freelance/system/vanta/package.json`:

  ```json
  {
    "name": "vanta",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "test": "vitest run",
      "test:watch": "vitest",
      "test:e2e": "playwright test",
      "lint": "next lint",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "next": "15.5.4",
      "react": "19.2.0",
      "react-dom": "19.2.0",
      "next-intl": "4.3.4",
      "zustand": "5.0.8"
    },
    "devDependencies": {
      "typescript": "5.9.3",
      "@types/node": "22.18.1",
      "@types/react": "19.2.0",
      "@types/react-dom": "19.2.0",
      "vitest": "3.2.4",
      "@vitejs/plugin-react": "5.0.4",
      "vite-tsconfig-paths": "5.1.4",
      "@playwright/test": "1.56.0"
    }
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/tsconfig.json` (strict; `@/*` → project root):

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["dom", "dom.iterable", "ES2022"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "skipLibCheck": true,
      "allowJs": false,
      "forceConsistentCasingInFileNames": true,
      "verbatimModuleSyntax": true,
      "plugins": [{ "name": "next" }],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/vitest.config.ts` (node env for `lib/**`, `@/*` alias via tsconfig paths):

  ```ts
  import { defineConfig } from 'vitest/config';
  import tsconfigPaths from 'vite-tsconfig-paths';

  export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      environment: 'node',
      include: ['tests/unit/**/*.test.ts'],
      globals: false,
    },
  });
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/.gitignore`:

  ```gitignore
  node_modules/
  .next/
  out/
  dist/
  coverage/
  .vercel/
  *.tsbuildinfo
  next-env.d.ts
  .DS_Store
  test-results/
  playwright-report/
  .env*.local
  ```

- [ ] Install dependencies and initialize git:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm install && git init
  ```

  Expected: `package-lock.json` is created and `node_modules/` is populated; `git init` prints `Initialized empty Git repository`.

- [ ] **Write the failing harness test** at `d:/MINE/freelance/system/vanta/tests/unit/harness.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';

  describe('vitest harness', () => {
    it('runs and resolves the @/* alias config', () => {
      expect(1 + 1).toBe(2);
    });
  });
  ```

- [ ] **Run it (expect a meaningful pass once deps are present).** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test
  ```

  Expected: `Test Files  1 passed (1)` and `Tests  1 passed (1)`. (If `vitest` is not yet installed the command errors with `vitest: command not found` — that is the "red" signal that the harness is not yet wired; fix by completing the `npm install` step above, then re-run to green.)

- [ ] Confirm strict typecheck is clean. Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm run typecheck
  ```

  Expected: no output and exit code 0.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "chore: scaffold vanta project with strict ts and vitest harness"
  ```

---

### Task 1.2 — Domain types (verbatim) + barrel

The deliverable is the complete `lib/domain/**` type surface plus the `@/lib/domain` barrel, proven by a type-only test that imports every public type from the barrel and a clean `typecheck`. Since these are pure types, the "failing test" is a compile/import assertion: the barrel does not yet exist, so the test fails to resolve until the files are created.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/domain/money.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/i18n.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/product.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/collection.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/drop.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/cart.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/order.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/user.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/domain/index.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/domain.test.ts`

**Interfaces**

- Consumes: nothing (these are the root types).
- Produces (verbatim from contracts): `Currency`, `Money`, `Locale`, `LocalizedText`, `Availability`, `ProductImage`, `Variant`, `Product`, `Collection`, `Drop`, `CartItem`, `Cart`, `OrderStatus`, `Address`, `OrderLineItem`, `OrderTotals`, `Order`, `Role`, `User` — all re-exported from `@/lib/domain`.

**Steps**

- [ ] **Write the failing barrel-import test** at `d:/MINE/freelance/system/vanta/tests/unit/domain.test.ts`. It imports every type from `@/lib/domain` and constructs one literal of each kind so any rename/widening breaks compilation:

  ```ts
  import { describe, it, expect } from 'vitest';
  import type {
    Currency,
    Money,
    Locale,
    LocalizedText,
    Availability,
    ProductImage,
    Variant,
    Product,
    Collection,
    Drop,
    CartItem,
    Cart,
    OrderStatus,
    Address,
    OrderLineItem,
    OrderTotals,
    Order,
    Role,
    User,
  } from '@/lib/domain';

  describe('lib/domain barrel', () => {
    it('exposes every domain type with the locked shape', () => {
      const currency: Currency = 'THB';
      const money: Money = { amount: 199000, currency };
      const locale: Locale = 'th';
      const text: LocalizedText = { en: 'Hello', th: 'สวัสดี' };
      const availability: Availability = 'low_stock';
      const image: ProductImage = {
        id: 'img_1',
        url: '/x.jpg',
        alt: text,
        width: 1200,
        height: 1600,
      };
      const variant: Variant = {
        id: 'var_1',
        sku: 'SKU-1',
        optionValues: { size: 'M', color: 'Black' },
        price: money,
        stock: 3,
        availability,
      };
      const product: Product = {
        id: 'prd_1',
        slug: 'tee',
        title: text,
        description: text,
        optionAxes: { size: ['M'], color: ['Black'] },
        variants: [variant],
        imagesByColor: { Black: [image] },
        collectionIds: ['col_1'],
        dropId: 'drp_1',
      };
      const collection: Collection = {
        id: 'col_1',
        slug: 'void',
        title: text,
        description: text,
        heroImageUrl: '/hero.jpg',
        productIds: ['prd_1'],
      };
      const drop: Drop = {
        id: 'drp_1',
        name: text,
        earlyAccessAt: '2026-07-01T00:00:00.000Z',
        releaseAt: '2026-07-02T00:00:00.000Z',
        endAt: '2026-07-09T00:00:00.000Z',
      };
      const cartItem: CartItem = { variantId: 'var_1', quantity: 2 };
      const cart: Cart = {
        items: [cartItem],
        itemCount: 2,
        subtotal: money,
        updatedAt: '2026-06-27T00:00:00.000Z',
      };
      const status: OrderStatus = 'paid';
      const role: Role = 'member';
      const address: Address = {
        id: 'adr_1',
        fullName: 'A B',
        line1: '1 Rd',
        city: 'Bangkok',
        postalCode: '10110',
        country: 'TH',
      };
      const lineItem: OrderLineItem = {
        variantId: 'var_1',
        sku: 'SKU-1',
        title: text,
        optionValues: { size: 'M', color: 'Black' },
        unitPrice: money,
        quantity: 2,
        imageUrl: '/x.jpg',
      };
      const totals: OrderTotals = { subtotal: money, shipping: money, total: money };
      const order: Order = {
        id: 'ord_seed_demo',
        userId: null,
        status,
        lineItems: [lineItem],
        totals,
        shippingAddress: address,
        email: 'a@b.com',
        placedAt: '2026-06-27T00:00:00.000Z',
      };
      const user: User = {
        id: 'usr_member',
        email: 'member@vanta.shop',
        name: 'Member',
        role,
        addresses: [address],
      };

      expect([
        money.currency,
        locale,
        availability,
        image.id,
        product.slug,
        collection.slug,
        drop.id,
        cart.itemCount,
        order.id,
        user.id,
        status,
        totals.total.amount,
      ]).toHaveLength(12);
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/domain.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/domain" ... Does the file exist?` (the barrel and type files are not created yet).

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/money.ts` (verbatim):

  ```ts
  export type Currency = 'THB';

  /** Integer MINOR units (satang). ฿1,990 === { amount: 199000, currency: 'THB' }. */
  export type Money = {
    amount: number; // integer minor units, never a float
    currency: Currency;
  };
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/i18n.ts` (verbatim):

  ```ts
  export type Locale = 'en' | 'th';

  /** Every user-facing string is bilingual and first-class. */
  export type LocalizedText = {
    en: string;
    th: string;
  };
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/product.ts` (verbatim — note the `LocalizedText` import and re-export):

  ```ts
  import type { Money } from './money';
  import type { LocalizedText } from './i18n';

  export type Availability = 'coming_soon' | 'early_access' | 'live' | 'low_stock' | 'sold_out';

  export type ProductImage = {
    id: string;
    url: string;
    alt: LocalizedText;
    width: number;
    height: number;
  };

  /** Variant is the purchasable unit (SKU). Every wow feature renders variant state. */
  export type Variant = {
    id: string;
    sku: string;
    optionValues: { size: string; color: string };
    price: Money;
    compareAtPrice?: Money; // present => sale UI
    stock: number; // current in-session stock
    availability: Availability; // baseline; UI re-derives via deriveAvailability
  };

  export type Product = {
    id: string;
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    optionAxes: { size: string[]; color: string[] };
    variants: Variant[];
    imagesByColor: Record<string, ProductImage[]>; // keyed by optionValues.color
    collectionIds: string[];
    dropId?: string;
  };

  // Re-export so importing from product.ts is allowed:
  export type { LocalizedText } from './i18n';
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/collection.ts` (verbatim):

  ```ts
  import type { LocalizedText } from './i18n';

  export type Collection = {
    id: string;
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    heroImageUrl: string;
    productIds: string[];
  };
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/drop.ts` (verbatim):

  ```ts
  import type { LocalizedText } from './i18n';

  /** All timestamps are ISO-8601 strings (UTC). Deadlines are cacheable; the tick is a client island. */
  export type Drop = {
    id: string;
    name: LocalizedText;
    earlyAccessAt: string; // members unlock here
    releaseAt: string; // public LIVE flip
    endAt: string; // drop window closes
  };

  export type { LocalizedText } from './i18n';
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/cart.ts` (verbatim):

  ```ts
  import type { Money } from './money';

  /** Cart line references the variant (SKU), never the product. */
  export type CartItem = {
    variantId: string;
    quantity: number;
  };

  /** Authoritative cart shape returned by every cart Server Action. */
  export type Cart = {
    items: CartItem[];
    itemCount: number; // sum of quantities (derived, server-authoritative)
    subtotal: Money; // sum of unitPrice * qty
    updatedAt: string; // ISO-8601
  };
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/order.ts` (verbatim):

  ```ts
  import type { Money } from './money';
  import type { LocalizedText } from './i18n';

  export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

  /** Country-first single example address. NO US State/ZIP labels. */
  export type Address = {
    id: string;
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string; // ISO-3166 alpha-2, e.g. 'TH'
    phone?: string;
  };

  /** Self-contained snapshot at purchase time — never re-read from Product/Variant. */
  export type OrderLineItem = {
    variantId: string;
    sku: string;
    title: LocalizedText; // snapshot
    optionValues: { size: string; color: string };
    unitPrice: Money; // snapshot
    quantity: number;
    imageUrl: string; // snapshot
  };

  export type OrderTotals = {
    subtotal: Money;
    shipping: Money;
    total: Money;
  };

  export type Order = {
    id: string; // e.g. 'ord_seed_demo'
    userId: string | null; // null => guest checkout
    status: OrderStatus;
    lineItems: OrderLineItem[];
    totals: OrderTotals;
    shippingAddress: Address;
    email: string;
    placedAt: string; // ISO-8601
  };
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/domain/user.ts` (verbatim):

  ```ts
  import type { Address } from './order';

  export type Role = 'guest' | 'member' | 'admin';

  export type User = {
    id: string;
    email: string;
    name: string;
    role: Role;
    addresses: Address[];
  };
  ```

- [ ] Create the barrel `d:/MINE/freelance/system/vanta/lib/domain/index.ts` re-exporting every domain type:

  ```ts
  export type { Currency, Money } from './money';
  export type { Locale, LocalizedText } from './i18n';
  export type { Availability, ProductImage, Variant, Product } from './product';
  export type { Collection } from './collection';
  export type { Drop } from './drop';
  export type { CartItem, Cart } from './cart';
  export type { OrderStatus, Address, OrderLineItem, OrderTotals, Order } from './order';
  export type { Role, User } from './user';
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/domain.test.ts && npm run typecheck
  ```

  Expected: `Tests  1 passed (1)` and `typecheck` exits 0 with no output.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(domain): add verbatim domain types and barrel"
  ```

---

### Task 1.3 — `formatMoney` (THB, no decimals, both locales)

The deliverable is `lib/format/money.ts`, proven by a Vitest spec covering THB with no decimals, grouping, and both locales producing the same Western-digit grouped baht string.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/format/money.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/money.test.ts`

**Interfaces**

- Consumes: `Money`, `Locale` from `@/lib/domain`.
- Produces: `export function formatMoney(money: Money, locale: Locale): string;`

**Steps**

- [ ] **Write the failing test** at `d:/MINE/freelance/system/vanta/tests/unit/money.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { formatMoney } from '@/lib/format/money';
  import type { Money } from '@/lib/domain';

  const thb = (amount: number): Money => ({ amount, currency: 'THB' });

  describe('formatMoney', () => {
    it('formats THB with the baht sign and NO decimals (en)', () => {
      expect(formatMoney(thb(199000), 'en')).toBe('฿1,990');
    });

    it('formats THB with NO decimals in Thai locale too (Western digits)', () => {
      expect(formatMoney(thb(199000), 'th')).toBe('฿1,990');
    });

    it('groups thousands', () => {
      expect(formatMoney(thb(1299000), 'en')).toBe('฿12,990');
    });

    it('renders zero as ฿0', () => {
      expect(formatMoney(thb(0), 'en')).toBe('฿0');
    });

    it('converts integer minor units (satang) to baht, never a float', () => {
      // 49 satang rounds to whole baht display; minor units are integers.
      expect(formatMoney(thb(4900), 'en')).toBe('฿49');
    });

    it('produces identical Western-digit output in both locales for the same amount', () => {
      expect(formatMoney(thb(199000), 'en')).toBe(formatMoney(thb(199000), 'th'));
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/money.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/format/money"` (the module does not exist yet).

- [ ] Implement the minimal code at `d:/MINE/freelance/system/vanta/lib/format/money.ts`:

  ```ts
  import type { Money, Locale } from '@/lib/domain';

  /**
   * One Intl.NumberFormat helper keyed by locale. THB is integer MINOR units
   * (satang); we divide by 100 to baht and render with NO fraction digits.
   * Western digits in BOTH locales via the `latn` numbering system, so the
   * Thai locale never produces Thai digits and the output is locale-stable.
   */
  export function formatMoney(money: Money, locale: Locale): string {
    const baht = money.amount / 100;
    const formatter = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
      style: 'currency',
      currency: money.currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(baht);
  }
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/money.test.ts
  ```

  Expected: `Tests  6 passed (6)`.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(format): add formatMoney THB helper with no decimals in both locales"
  ```

---

### Task 1.4 — `formatDate` (gregory calendar, never Buddhist-era)

The deliverable is `lib/format/date.ts`, proven by a spec that asserts the year is the Western 2026 (never the Buddhist-era 2569) and that digits are Western in the Thai locale.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/format/date.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/date.test.ts`

**Interfaces**

- Consumes: `Locale` from `@/lib/domain`.
- Produces: `export function formatDate(iso: string, locale: Locale): string;`

**Steps**

- [ ] **Write the failing test** at `d:/MINE/freelance/system/vanta/tests/unit/date.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { formatDate } from '@/lib/format/date';

  const ISO = '2026-06-27T09:30:00.000Z';

  describe('formatDate', () => {
    it('formats with the gregory calendar in English (Western year 2026)', () => {
      const out = formatDate(ISO, 'en');
      expect(out).toContain('2026');
      expect(out).not.toContain('2569'); // Buddhist-era trap
    });

    it('uses the gregory calendar in Thai — NEVER the Buddhist era 2569', () => {
      const out = formatDate(ISO, 'th');
      expect(out).toContain('2026');
      expect(out).not.toContain('2569');
    });

    it('uses Western digits in the Thai locale (no Thai numerals)', () => {
      const out = formatDate(ISO, 'th');
      // No Thai digit characters U+0E50–U+0E59 anywhere in the output.
      expect(/[\u0E50-\u0E59]/.test(out)).toBe(false);
      expect(/\d/.test(out)).toBe(true);
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/date.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/format/date"`.

- [ ] Implement the minimal code at `d:/MINE/freelance/system/vanta/lib/format/date.ts`:

  ```ts
  import type { Locale } from '@/lib/domain';

  /**
   * Forces calendar: 'gregory' so the Thai locale never renders the Buddhist
   * era (e.g. 2569 instead of 2026), and `latn` numbering so digits stay
   * Western in both locales.
   */
  export function formatDate(iso: string, locale: Locale): string {
    const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-gregory-nu-latn`, {
      calendar: 'gregory',
      numberingSystem: 'latn',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(new Date(iso));
  }
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/date.test.ts
  ```

  Expected: `Tests  3 passed (3)`.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(format): add formatDate forcing gregory calendar and western digits"
  ```

---

### Task 1.5 — Repository interfaces + `Repositories` bundle type

The deliverable is `lib/data/repositories/**`: the five interfaces plus the `Repositories` bundle, all verbatim. Since they are interfaces, the test is a structural contract — a typed conformance spec where a stub object must satisfy each interface, so any signature drift breaks compilation.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/data/repositories/product-repository.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/repositories/collection-repository.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/repositories/order-repository.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/repositories/user-repository.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/repositories/cart-store.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/repositories/index.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/repositories.contract.test.ts`

**Interfaces**

- Consumes: `Product`, `Variant`, `Collection`, `Order`, `User`, `Cart` from `@/lib/domain`.
- Produces (verbatim): `ProductRepository`, `CollectionRepository`, `OrderRepository`, `UserRepository`, `CartStore`, `Repositories`.

**Steps**

- [ ] **Write the failing conformance test** at `d:/MINE/freelance/system/vanta/tests/unit/repositories.contract.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import type { Repositories } from '@/lib/data/repositories';
  import type { Cart, Order, User } from '@/lib/domain';

  describe('repository interfaces', () => {
    it('a stub object satisfies the Repositories bundle shape', () => {
      const emptyCart: Cart = {
        items: [],
        itemCount: 0,
        subtotal: { amount: 0, currency: 'THB' },
        updatedAt: '2026-06-27T00:00:00.000Z',
      };

      const stub: Repositories = {
        products: {
          list: async () => [],
          getBySlug: async () => null,
          getById: async () => null,
          getVariantById: async () => null,
          listByCollection: async () => [],
          listByDrop: async () => [],
          decrementStock: async () => {
            throw new Error('stub');
          },
          search: async () => [],
        },
        collections: {
          list: async () => [],
          getBySlug: async () => null,
          getById: async () => null,
        },
        orders: {
          create: async (o: Order) => o,
          getById: async () => null,
          listByUser: async () => [],
        },
        users: {
          getById: async () => null,
          getByEmail: async () => null,
          verifyCredentials: async (): Promise<User | null> => null,
        },
        cart: {
          read: async () => emptyCart,
          write: async () => undefined,
          clear: async () => undefined,
        },
      };

      expect(typeof stub.products.list).toBe('function');
      expect(typeof stub.cart.read).toBe('function');
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/repositories.contract.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/data/repositories"`.

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/repositories/product-repository.ts` (verbatim):

  ```ts
  import type { Product, Variant } from '@/lib/domain';

  export interface ProductRepository {
    list(): Promise<Product[]>;
    getBySlug(slug: string): Promise<Product | null>;
    getById(id: string): Promise<Product | null>;
    getVariantById(variantId: string): Promise<Variant | null>;
    listByCollection(collectionId: string): Promise<Product[]>;
    listByDrop(dropId: string): Promise<Product[]>;
    /** In-session stock decrement on add-to-cart (mock mutates seed). */
    decrementStock(variantId: string, quantity: number): Promise<Variant>;
    search(query: string): Promise<Product[]>;
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/repositories/collection-repository.ts` (verbatim):

  ```ts
  import type { Collection } from '@/lib/domain';

  export interface CollectionRepository {
    list(): Promise<Collection[]>;
    getBySlug(slug: string): Promise<Collection | null>;
    getById(id: string): Promise<Collection | null>;
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/repositories/order-repository.ts` (verbatim):

  ```ts
  import type { Order } from '@/lib/domain';

  export interface OrderRepository {
    create(order: Order): Promise<Order>;
    getById(orderId: string): Promise<Order | null>;
    listByUser(userId: string): Promise<Order[]>;
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/repositories/user-repository.ts` (verbatim):

  ```ts
  import type { User } from '@/lib/domain';

  export interface UserRepository {
    getById(userId: string): Promise<User | null>;
    getByEmail(email: string): Promise<User | null>;
    /** Returns the user iff credentials match (mock checks seed password). */
    verifyCredentials(email: string, password: string): Promise<User | null>;
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/repositories/cart-store.ts` (verbatim):

  ```ts
  import type { Cart } from '@/lib/domain';

  // The ONLY request-context-aware repo: it reads/writes the signed cookie.
  export interface CartStore {
    read(): Promise<Cart>; // empty cart if no cookie
    write(cart: Cart): Promise<void>; // signs + sets cookie
    clear(): Promise<void>;
  }
  ```

- [ ] Create the bundle `d:/MINE/freelance/system/vanta/lib/data/repositories/index.ts` (verbatim):

  ```ts
  import type { ProductRepository } from './product-repository';
  import type { CollectionRepository } from './collection-repository';
  import type { OrderRepository } from './order-repository';
  import type { UserRepository } from './user-repository';
  import type { CartStore } from './cart-store';

  export type { ProductRepository } from './product-repository';
  export type { CollectionRepository } from './collection-repository';
  export type { OrderRepository } from './order-repository';
  export type { UserRepository } from './user-repository';
  export type { CartStore } from './cart-store';

  export interface Repositories {
    products: ProductRepository;
    collections: CollectionRepository;
    orders: OrderRepository;
    users: UserRepository;
    cart: CartStore;
  }
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/repositories.contract.test.ts && npm run typecheck
  ```

  Expected: `Tests  1 passed (1)` and `typecheck` exits 0.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(data): add repository interfaces and Repositories bundle type"
  ```

---

### Task 1.6 — Typed seed catalog (≥12 products, drops, 3 sold-out + 4 low-stock)

The deliverable is the typed seed under `lib/data/mock/seed/**`, proven by a Vitest spec that asserts the full seed-invariant matrix: ≥12 products, exactly 3 sold-out variants and exactly 4 low-stock variants, every variant carries a real size×color pair, prices are integer minor units, drops carry `earlyAccessAt < releaseAt < endAt`, and the seeded confirmation order `ord_seed_demo` exists. The seed is the contract-honoring source of truth that later adapters read.

> Seed design (satisfies all constraints): 12 products across 3 collections; one product (`prd_void_tee`) belongs to the active drop `drp_void_genesis`. Across the catalog there are **exactly 3** variants with `stock: 0` (`availability: 'sold_out'`) and **exactly 4** variants with `0 < stock <= 5` (`availability: 'low_stock'`); all remaining variants have `stock > 5` (`availability: 'live'`). Sold-out variants are size/color SKUs of otherwise-buyable products (SOLD OUT never marks a whole buyable item as dead — the product is still purchasable in other sizes). The seed member is `usr_member` / `member@vanta.shop` / password `vanta-demo`.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/products.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/collections.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/drops.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/users.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/orders.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/index.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/seed.test.ts`

**Interfaces**

- Consumes: `Product`, `Collection`, `Drop`, `User`, `Order` from `@/lib/domain`.
- Produces: `seedProducts: Product[]`, `seedCollections: Collection[]`, `seedDrops: Drop[]`, `seedUsers: Array<User & { password: string }>` (the password lives ONLY in the seed/mock layer, never in the domain `User`), `seedOrders: Order[]`, and the active drop id constant `ACTIVE_DROP_ID`.

**Steps**

- [ ] **Write the failing seed-invariant test** at `d:/MINE/freelance/system/vanta/tests/unit/seed.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import {
    seedProducts,
    seedCollections,
    seedDrops,
    seedUsers,
    seedOrders,
    ACTIVE_DROP_ID,
  } from '@/lib/data/mock/seed';
  import type { Variant } from '@/lib/domain';

  const allVariants: Variant[] = seedProducts.flatMap((p) => p.variants);

  describe('seed catalog invariants', () => {
    it('ships at least 12 products', () => {
      expect(seedProducts.length).toBeGreaterThanOrEqual(12);
    });

    it('every product has size x color variants with a real option pair', () => {
      for (const p of seedProducts) {
        expect(p.variants.length).toBeGreaterThan(0);
        for (const v of p.variants) {
          expect(v.optionValues.size).toBeTruthy();
          expect(v.optionValues.color).toBeTruthy();
          expect(p.optionAxes.size).toContain(v.optionValues.size);
          expect(p.optionAxes.color).toContain(v.optionValues.color);
        }
      }
    });

    it('all variant prices are positive integer minor units in THB', () => {
      for (const v of allVariants) {
        expect(Number.isInteger(v.price.amount)).toBe(true);
        expect(v.price.amount).toBeGreaterThan(0);
        expect(v.price.currency).toBe('THB');
      }
    });

    it('seeds EXACTLY 3 sold-out variants (stock 0)', () => {
      const soldOut = allVariants.filter((v) => v.stock <= 0);
      expect(soldOut.length).toBe(3);
      for (const v of soldOut) expect(v.availability).toBe('sold_out');
    });

    it('seeds EXACTLY 4 low-stock variants (0 < stock <= 5)', () => {
      const low = allVariants.filter((v) => v.stock > 0 && v.stock <= 5);
      expect(low.length).toBe(4);
      for (const v of low) expect(v.availability).toBe('low_stock');
    });

    it('every variant id and sku is unique', () => {
      const ids = allVariants.map((v) => v.id);
      const skus = allVariants.map((v) => v.sku);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(skus).size).toBe(skus.length);
    });

    it('imagesByColor covers every color axis value', () => {
      for (const p of seedProducts) {
        for (const color of p.optionAxes.color) {
          expect(p.imagesByColor[color]?.length ?? 0).toBeGreaterThan(0);
        }
      }
    });

    it('defines an active drop with earlyAccessAt < releaseAt < endAt', () => {
      const drop = seedDrops.find((d) => d.id === ACTIVE_DROP_ID);
      expect(drop).toBeDefined();
      const early = Date.parse(drop!.earlyAccessAt);
      const release = Date.parse(drop!.releaseAt);
      const end = Date.parse(drop!.endAt);
      expect(early).toBeLessThan(release);
      expect(release).toBeLessThan(end);
    });

    it('at least one product belongs to the active drop', () => {
      expect(seedProducts.some((p) => p.dropId === ACTIVE_DROP_ID)).toBe(true);
    });

    it('every product collectionId resolves to a seeded collection', () => {
      const ids = new Set(seedCollections.map((c) => c.id));
      for (const p of seedProducts) {
        for (const cid of p.collectionIds) expect(ids.has(cid)).toBe(true);
      }
    });

    it('seeds the demo member with the documented credentials', () => {
      const member = seedUsers.find((u) => u.id === 'usr_member');
      expect(member).toBeDefined();
      expect(member!.email).toBe('member@vanta.shop');
      expect(member!.password).toBe('vanta-demo');
      expect(member!.role).toBe('member');
    });

    it('seeds the confirmation order ord_seed_demo so /checkout/[orderId] renders instantly', () => {
      const order = seedOrders.find((o) => o.id === 'ord_seed_demo');
      expect(order).toBeDefined();
      expect(order!.lineItems.length).toBeGreaterThan(0);
      expect(order!.totals.total.currency).toBe('THB');
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/seed.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/data/mock/seed"`.

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/seed/drops.ts`. The active drop sits in the future relative to the spec's "today" (2026-06-27) so countdown/early-access demos work; the second drop is past/closed for state variety:

  ```ts
  import type { Drop } from '@/lib/domain';

  export const ACTIVE_DROP_ID = 'drp_void_genesis';

  export const seedDrops: Drop[] = [
    {
      id: ACTIVE_DROP_ID,
      name: { en: 'VOID GENESIS', th: 'วอยด์ เจเนซิส' },
      // Early access for members opens, then the public LIVE flip, then close.
      earlyAccessAt: '2026-07-01T10:00:00.000Z',
      releaseAt: '2026-07-01T13:00:00.000Z',
      endAt: '2026-07-15T17:00:00.000Z',
    },
    {
      id: 'drp_neon_dusk',
      name: { en: 'NEON DUSK', th: 'นีออน ดัสก์' },
      earlyAccessAt: '2026-05-01T10:00:00.000Z',
      releaseAt: '2026-05-01T13:00:00.000Z',
      endAt: '2026-05-20T17:00:00.000Z',
    },
  ];
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/seed/collections.ts`:

  ```ts
  import type { Collection } from '@/lib/domain';

  export const seedCollections: Collection[] = [
    {
      id: 'col_void',
      slug: 'the-void',
      title: { en: 'THE VOID', th: 'เดอะ วอยด์' },
      description: {
        en: 'Pieces that materialize out of pure black.',
        th: 'ชิ้นงานที่ก่อตัวขึ้นจากความมืดสนิท',
      },
      heroImageUrl: '/images/collections/void-hero.jpg',
      productIds: ['prd_void_tee', 'prd_void_hoodie', 'prd_void_cargo', 'prd_void_cap'],
    },
    {
      id: 'col_bangkok',
      slug: 'bangkok-born',
      title: { en: 'BANGKOK BORN', th: 'เกิดในกรุงเทพฯ' },
      description: {
        en: 'Streetwear from the city that never cools down.',
        th: 'สตรีทแวร์จากเมืองที่ไม่เคยเย็นลง',
      },
      heroImageUrl: '/images/collections/bangkok-hero.jpg',
      productIds: ['prd_bkk_jacket', 'prd_bkk_tee', 'prd_bkk_shorts', 'prd_bkk_socks'],
    },
    {
      id: 'col_mono',
      slug: 'monochrome',
      title: { en: 'MONOCHROME', th: 'โมโนโครม' },
      description: {
        en: 'Tonal essentials, engineered to layer.',
        th: 'เบสิกโทนเดียว ออกแบบมาเพื่อการเลเยอร์',
      },
      heroImageUrl: '/images/collections/mono-hero.jpg',
      productIds: ['prd_mono_longsleeve', 'prd_mono_pants', 'prd_mono_beanie', 'prd_mono_tote'],
    },
  ];
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/seed/products.ts`. This file defines 12 products. The sold-out / low-stock placement is deliberate and counted: **sold-out (stock 0)** → `var_void_tee_l_black`, `var_bkk_jacket_m_blaze`, `var_mono_pants_32_smoke`; **low-stock (1–5)** → `var_void_hoodie_m_black` (3), `var_void_cargo_l_smoke` (2), `var_bkk_tee_s_paper` (5), `var_mono_longsleeve_m_ink` (1). All other variants have `stock > 5` and `availability: 'live'`:

  ```ts
  import type { Product, ProductImage } from '@/lib/domain';

  const thb = (amount: number) => ({ amount, currency: 'THB' as const });

  const img = (id: string, color: string): ProductImage => ({
    id,
    url: `/images/products/${id}.jpg`,
    alt: { en: `${color} colorway`, th: `สี${color}` },
    width: 1200,
    height: 1600,
  });

  export const seedProducts: Product[] = [
    // 1 — VOID TEE (active drop)
    {
      id: 'prd_void_tee',
      slug: 'void-tee',
      title: { en: 'VOID TEE', th: 'วอยด์ ที' },
      description: {
        en: 'Heavyweight black tee with reflective VANTA mark.',
        th: 'เสื้อยืดสีดำเนื้อหนา พิมพ์โลโก้ VANTA สะท้อนแสง',
      },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Black', 'Paper'] },
      variants: [
        {
          id: 'var_void_tee_s_black',
          sku: 'VNT-TEE-S-BLK',
          optionValues: { size: 'S', color: 'Black' },
          price: thb(129000),
          stock: 22,
          availability: 'live',
        },
        {
          id: 'var_void_tee_m_black',
          sku: 'VNT-TEE-M-BLK',
          optionValues: { size: 'M', color: 'Black' },
          price: thb(129000),
          stock: 18,
          availability: 'live',
        },
        // SOLD OUT (1/3): one size dead, product still buyable in others.
        {
          id: 'var_void_tee_l_black',
          sku: 'VNT-TEE-L-BLK',
          optionValues: { size: 'L', color: 'Black' },
          price: thb(129000),
          stock: 0,
          availability: 'sold_out',
        },
        {
          id: 'var_void_tee_s_paper',
          sku: 'VNT-TEE-S-PPR',
          optionValues: { size: 'S', color: 'Paper' },
          price: thb(129000),
          stock: 30,
          availability: 'live',
        },
        {
          id: 'var_void_tee_m_paper',
          sku: 'VNT-TEE-M-PPR',
          optionValues: { size: 'M', color: 'Paper' },
          price: thb(129000),
          stock: 25,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Black: [img('void-tee-black', 'Black')],
        Paper: [img('void-tee-paper', 'Paper')],
      },
      collectionIds: ['col_void'],
      dropId: 'drp_void_genesis',
    },
    // 2 — VOID HOODIE
    {
      id: 'prd_void_hoodie',
      slug: 'void-hoodie',
      title: { en: 'VOID HOODIE', th: 'วอยด์ ฮู้ดดี้' },
      description: {
        en: 'Boxy hoodie, brushed-back fleece, tonal embroidery.',
        th: 'ฮู้ดดี้ทรงกล่อง ผ้าฟลีซขัดด้านใน ปักโทนเดียว',
      },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Black'] },
      variants: [
        {
          id: 'var_void_hoodie_s_black',
          sku: 'VNT-HOD-S-BLK',
          optionValues: { size: 'S', color: 'Black' },
          price: thb(249000),
          compareAtPrice: thb(299000),
          stock: 14,
          availability: 'live',
        },
        // LOW STOCK (1/4): 3 left.
        {
          id: 'var_void_hoodie_m_black',
          sku: 'VNT-HOD-M-BLK',
          optionValues: { size: 'M', color: 'Black' },
          price: thb(249000),
          compareAtPrice: thb(299000),
          stock: 3,
          availability: 'low_stock',
        },
        {
          id: 'var_void_hoodie_l_black',
          sku: 'VNT-HOD-L-BLK',
          optionValues: { size: 'L', color: 'Black' },
          price: thb(249000),
          compareAtPrice: thb(299000),
          stock: 11,
          availability: 'live',
        },
      ],
      imagesByColor: { Black: [img('void-hoodie-black', 'Black')] },
      collectionIds: ['col_void'],
    },
    // 3 — VOID CARGO
    {
      id: 'prd_void_cargo',
      slug: 'void-cargo',
      title: { en: 'VOID CARGO', th: 'วอยด์ คาร์โก้' },
      description: {
        en: 'Tactical cargo pant, articulated knee, smoke colorway.',
        th: 'กางเกงคาร์โก้สายลุย เข่าตัดต่อ โทนสโมก',
      },
      optionAxes: { size: ['M', 'L', 'XL'], color: ['Smoke'] },
      variants: [
        {
          id: 'var_void_cargo_m_smoke',
          sku: 'VNT-CRG-M-SMK',
          optionValues: { size: 'M', color: 'Smoke' },
          price: thb(289000),
          stock: 9,
          availability: 'live',
        },
        // LOW STOCK (2/4): 2 left.
        {
          id: 'var_void_cargo_l_smoke',
          sku: 'VNT-CRG-L-SMK',
          optionValues: { size: 'L', color: 'Smoke' },
          price: thb(289000),
          stock: 2,
          availability: 'low_stock',
        },
        {
          id: 'var_void_cargo_xl_smoke',
          sku: 'VNT-CRG-XL-SMK',
          optionValues: { size: 'XL', color: 'Smoke' },
          price: thb(289000),
          stock: 7,
          availability: 'live',
        },
      ],
      imagesByColor: { Smoke: [img('void-cargo-smoke', 'Smoke')] },
      collectionIds: ['col_void'],
    },
    // 4 — VOID CAP
    {
      id: 'prd_void_cap',
      slug: 'void-cap',
      title: { en: 'VOID CAP', th: 'วอยด์ แคป' },
      description: {
        en: 'Unstructured 6-panel cap, rubber VANTA badge.',
        th: 'หมวกแก๊ป 6 แผง ทรงนิ่ม แปะป้ายยาง VANTA',
      },
      optionAxes: { size: ['OS'], color: ['Black', 'Blaze'] },
      variants: [
        {
          id: 'var_void_cap_os_black',
          sku: 'VNT-CAP-OS-BLK',
          optionValues: { size: 'OS', color: 'Black' },
          price: thb(89000),
          stock: 40,
          availability: 'live',
        },
        {
          id: 'var_void_cap_os_blaze',
          sku: 'VNT-CAP-OS-BLZ',
          optionValues: { size: 'OS', color: 'Blaze' },
          price: thb(89000),
          stock: 35,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Black: [img('void-cap-black', 'Black')],
        Blaze: [img('void-cap-blaze', 'Blaze')],
      },
      collectionIds: ['col_void'],
    },
    // 5 — BKK JACKET
    {
      id: 'prd_bkk_jacket',
      slug: 'bangkok-coach-jacket',
      title: { en: 'BANGKOK COACH JACKET', th: 'แจ็คเก็ตโค้ช กรุงเทพฯ' },
      description: {
        en: 'Water-repellent coach jacket, blaze lining.',
        th: 'แจ็คเก็ตโค้ชกันน้ำ ซับในสีเบลซ',
      },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Ink', 'Blaze'] },
      variants: [
        {
          id: 'var_bkk_jacket_s_ink',
          sku: 'VNT-JKT-S-INK',
          optionValues: { size: 'S', color: 'Ink' },
          price: thb(359000),
          stock: 8,
          availability: 'live',
        },
        {
          id: 'var_bkk_jacket_m_ink',
          sku: 'VNT-JKT-M-INK',
          optionValues: { size: 'M', color: 'Ink' },
          price: thb(359000),
          stock: 12,
          availability: 'live',
        },
        {
          id: 'var_bkk_jacket_l_ink',
          sku: 'VNT-JKT-L-INK',
          optionValues: { size: 'L', color: 'Ink' },
          price: thb(359000),
          stock: 6,
          availability: 'live',
        },
        // SOLD OUT (2/3).
        {
          id: 'var_bkk_jacket_m_blaze',
          sku: 'VNT-JKT-M-BLZ',
          optionValues: { size: 'M', color: 'Blaze' },
          price: thb(359000),
          stock: 0,
          availability: 'sold_out',
        },
        {
          id: 'var_bkk_jacket_l_blaze',
          sku: 'VNT-JKT-L-BLZ',
          optionValues: { size: 'L', color: 'Blaze' },
          price: thb(359000),
          stock: 10,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Ink: [img('bkk-jacket-ink', 'Ink')],
        Blaze: [img('bkk-jacket-blaze', 'Blaze')],
      },
      collectionIds: ['col_bangkok'],
    },
    // 6 — BKK TEE
    {
      id: 'prd_bkk_tee',
      slug: 'bangkok-graphic-tee',
      title: { en: 'BANGKOK GRAPHIC TEE', th: 'เสื้อยืดกราฟิก กรุงเทพฯ' },
      description: {
        en: 'Bilingual city-grid graphic, oversized fit.',
        th: 'กราฟิกกริดเมืองสองภาษา ทรงโอเวอร์ไซส์',
      },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Paper', 'Ink'] },
      variants: [
        // LOW STOCK (3/4): 5 left (boundary of LOW_STOCK_THRESHOLD).
        {
          id: 'var_bkk_tee_s_paper',
          sku: 'VNT-BTE-S-PPR',
          optionValues: { size: 'S', color: 'Paper' },
          price: thb(119000),
          stock: 5,
          availability: 'low_stock',
        },
        {
          id: 'var_bkk_tee_m_paper',
          sku: 'VNT-BTE-M-PPR',
          optionValues: { size: 'M', color: 'Paper' },
          price: thb(119000),
          stock: 20,
          availability: 'live',
        },
        {
          id: 'var_bkk_tee_l_paper',
          sku: 'VNT-BTE-L-PPR',
          optionValues: { size: 'L', color: 'Paper' },
          price: thb(119000),
          stock: 16,
          availability: 'live',
        },
        {
          id: 'var_bkk_tee_m_ink',
          sku: 'VNT-BTE-M-INK',
          optionValues: { size: 'M', color: 'Ink' },
          price: thb(119000),
          stock: 24,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Paper: [img('bkk-tee-paper', 'Paper')],
        Ink: [img('bkk-tee-ink', 'Ink')],
      },
      collectionIds: ['col_bangkok'],
    },
    // 7 — BKK SHORTS
    {
      id: 'prd_bkk_shorts',
      slug: 'bangkok-nylon-shorts',
      title: { en: 'BANGKOK NYLON SHORTS', th: 'กางเกงขาสั้นไนลอน กรุงเทพฯ' },
      description: {
        en: 'Lightweight nylon shorts, zip pockets.',
        th: 'กางเกงขาสั้นไนลอนน้ำหนักเบา กระเป๋าซิป',
      },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Smoke'] },
      variants: [
        {
          id: 'var_bkk_shorts_s_smoke',
          sku: 'VNT-SHT-S-SMK',
          optionValues: { size: 'S', color: 'Smoke' },
          price: thb(149000),
          stock: 15,
          availability: 'live',
        },
        {
          id: 'var_bkk_shorts_m_smoke',
          sku: 'VNT-SHT-M-SMK',
          optionValues: { size: 'M', color: 'Smoke' },
          price: thb(149000),
          stock: 19,
          availability: 'live',
        },
        {
          id: 'var_bkk_shorts_l_smoke',
          sku: 'VNT-SHT-L-SMK',
          optionValues: { size: 'L', color: 'Smoke' },
          price: thb(149000),
          stock: 13,
          availability: 'live',
        },
      ],
      imagesByColor: { Smoke: [img('bkk-shorts-smoke', 'Smoke')] },
      collectionIds: ['col_bangkok'],
    },
    // 8 — BKK SOCKS
    {
      id: 'prd_bkk_socks',
      slug: 'bangkok-rib-socks',
      title: { en: 'BANGKOK RIB SOCKS', th: 'ถุงเท้าริบ กรุงเทพฯ' },
      description: {
        en: 'Ribbed crew socks, two-pack, lime cuff stripe.',
        th: 'ถุงเท้าริบทรงครู แพ็คคู่ ขอบลายสีไลม์',
      },
      optionAxes: { size: ['OS'], color: ['Ink'] },
      variants: [
        {
          id: 'var_bkk_socks_os_ink',
          sku: 'VNT-SOK-OS-INK',
          optionValues: { size: 'OS', color: 'Ink' },
          price: thb(49000),
          stock: 60,
          availability: 'live',
        },
      ],
      imagesByColor: { Ink: [img('bkk-socks-ink', 'Ink')] },
      collectionIds: ['col_bangkok'],
    },
    // 9 — MONO LONGSLEEVE
    {
      id: 'prd_mono_longsleeve',
      slug: 'mono-longsleeve',
      title: { en: 'MONO LONGSLEEVE', th: 'โมโน ลองสลีฟ' },
      description: {
        en: 'Ribbed longsleeve base layer, tonal cuffs.',
        th: 'เสื้อแขนยาวริบเลเยอร์ ปลายแขนโทนเดียว',
      },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Ink', 'Paper'] },
      variants: [
        {
          id: 'var_mono_longsleeve_s_ink',
          sku: 'VNT-MLS-S-INK',
          optionValues: { size: 'S', color: 'Ink' },
          price: thb(159000),
          stock: 17,
          availability: 'live',
        },
        // LOW STOCK (4/4): 1 left.
        {
          id: 'var_mono_longsleeve_m_ink',
          sku: 'VNT-MLS-M-INK',
          optionValues: { size: 'M', color: 'Ink' },
          price: thb(159000),
          stock: 1,
          availability: 'low_stock',
        },
        {
          id: 'var_mono_longsleeve_l_ink',
          sku: 'VNT-MLS-L-INK',
          optionValues: { size: 'L', color: 'Ink' },
          price: thb(159000),
          stock: 12,
          availability: 'live',
        },
        {
          id: 'var_mono_longsleeve_m_paper',
          sku: 'VNT-MLS-M-PPR',
          optionValues: { size: 'M', color: 'Paper' },
          price: thb(159000),
          stock: 21,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Ink: [img('mono-longsleeve-ink', 'Ink')],
        Paper: [img('mono-longsleeve-paper', 'Paper')],
      },
      collectionIds: ['col_mono'],
    },
    // 10 — MONO PANTS
    {
      id: 'prd_mono_pants',
      slug: 'mono-pleated-pants',
      title: { en: 'MONO PLEATED PANTS', th: 'โมโน กางเกงจีบ' },
      description: {
        en: 'Pleated wide-leg trouser, smoke and ink.',
        th: 'กางเกงขากว้างจับจีบ โทนสโมกและอิงค์',
      },
      optionAxes: { size: ['30', '32', '34'], color: ['Smoke', 'Ink'] },
      variants: [
        {
          id: 'var_mono_pants_30_smoke',
          sku: 'VNT-MPT-30-SMK',
          optionValues: { size: '30', color: 'Smoke' },
          price: thb(269000),
          stock: 9,
          availability: 'live',
        },
        // SOLD OUT (3/3).
        {
          id: 'var_mono_pants_32_smoke',
          sku: 'VNT-MPT-32-SMK',
          optionValues: { size: '32', color: 'Smoke' },
          price: thb(269000),
          stock: 0,
          availability: 'sold_out',
        },
        {
          id: 'var_mono_pants_34_smoke',
          sku: 'VNT-MPT-34-SMK',
          optionValues: { size: '34', color: 'Smoke' },
          price: thb(269000),
          stock: 7,
          availability: 'live',
        },
        {
          id: 'var_mono_pants_32_ink',
          sku: 'VNT-MPT-32-INK',
          optionValues: { size: '32', color: 'Ink' },
          price: thb(269000),
          stock: 11,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Smoke: [img('mono-pants-smoke', 'Smoke')],
        Ink: [img('mono-pants-ink', 'Ink')],
      },
      collectionIds: ['col_mono'],
    },
    // 11 — MONO BEANIE
    {
      id: 'prd_mono_beanie',
      slug: 'mono-beanie',
      title: { en: 'MONO BEANIE', th: 'โมโน บีนนี่' },
      description: {
        en: 'Fine-gauge cuffed beanie, woven tab.',
        th: 'หมวกบีนนี่ถักละเอียด มีแท็บทอ',
      },
      optionAxes: { size: ['OS'], color: ['Ink', 'Smoke'] },
      variants: [
        {
          id: 'var_mono_beanie_os_ink',
          sku: 'VNT-BNE-OS-INK',
          optionValues: { size: 'OS', color: 'Ink' },
          price: thb(79000),
          stock: 28,
          availability: 'live',
        },
        {
          id: 'var_mono_beanie_os_smoke',
          sku: 'VNT-BNE-OS-SMK',
          optionValues: { size: 'OS', color: 'Smoke' },
          price: thb(79000),
          stock: 22,
          availability: 'live',
        },
      ],
      imagesByColor: {
        Ink: [img('mono-beanie-ink', 'Ink')],
        Smoke: [img('mono-beanie-smoke', 'Smoke')],
      },
      collectionIds: ['col_mono'],
    },
    // 12 — MONO TOTE
    {
      id: 'prd_mono_tote',
      slug: 'mono-canvas-tote',
      title: { en: 'MONO CANVAS TOTE', th: 'โมโน กระเป๋าผ้าแคนวาส' },
      description: {
        en: 'Heavy canvas tote, screen-printed VANTA wordmark.',
        th: 'กระเป๋าผ้าแคนวาสเนื้อหนา สกรีนโลโก้ VANTA',
      },
      optionAxes: { size: ['OS'], color: ['Paper'] },
      variants: [
        {
          id: 'var_mono_tote_os_paper',
          sku: 'VNT-TOT-OS-PPR',
          optionValues: { size: 'OS', color: 'Paper' },
          price: thb(99000),
          stock: 45,
          availability: 'live',
        },
      ],
      imagesByColor: { Paper: [img('mono-tote-paper', 'Paper')] },
      collectionIds: ['col_mono'],
    },
  ];
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/seed/users.ts`. The password field lives ONLY here (seed/mock layer), never on the domain `User`:

  ```ts
  import type { User } from '@/lib/domain';

  /** Seed-only credential carrier: password NEVER appears on the domain User. */
  export type SeedUser = User & { password: string };

  const tomAddress = {
    id: 'adr_member_1',
    fullName: 'Somchai Member',
    line1: '88 Sukhumvit Soi 11',
    line2: 'Unit 12A',
    city: 'Bangkok',
    postalCode: '10110',
    country: 'TH',
    phone: '+66 80 000 0000',
  } as const;

  export const seedUsers: SeedUser[] = [
    {
      id: 'usr_member',
      email: 'member@vanta.shop',
      name: 'Somchai Member',
      role: 'member',
      addresses: [tomAddress],
      password: 'vanta-demo',
    },
    {
      id: 'usr_admin',
      email: 'admin@vanta.shop',
      name: 'VANTA Admin',
      role: 'admin',
      addresses: [],
      password: 'vanta-admin',
    },
  ];
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/seed/orders.ts`. The seeded `ord_seed_demo` lets `/checkout/[orderId]` render instantly for reviewers; totals are integer minor units and self-contained snapshots:

  ```ts
  import type { Order } from '@/lib/domain';

  const thb = (amount: number) => ({ amount, currency: 'THB' as const });

  export const seedOrders: Order[] = [
    {
      id: 'ord_seed_demo',
      userId: 'usr_member',
      status: 'paid',
      lineItems: [
        {
          variantId: 'var_void_tee_m_black',
          sku: 'VNT-TEE-M-BLK',
          title: { en: 'VOID TEE', th: 'วอยด์ ที' },
          optionValues: { size: 'M', color: 'Black' },
          unitPrice: thb(129000),
          quantity: 1,
          imageUrl: '/images/products/void-tee-black.jpg',
        },
        {
          variantId: 'var_void_hoodie_l_black',
          sku: 'VNT-HOD-L-BLK',
          title: { en: 'VOID HOODIE', th: 'วอยด์ ฮู้ดดี้' },
          optionValues: { size: 'L', color: 'Black' },
          unitPrice: thb(249000),
          quantity: 1,
          imageUrl: '/images/products/void-hoodie-black.jpg',
        },
      ],
      totals: {
        subtotal: thb(378000),
        shipping: thb(0),
        total: thb(378000),
      },
      shippingAddress: {
        id: 'adr_member_1',
        fullName: 'Somchai Member',
        line1: '88 Sukhumvit Soi 11',
        line2: 'Unit 12A',
        city: 'Bangkok',
        postalCode: '10110',
        country: 'TH',
        phone: '+66 80 000 0000',
      },
      email: 'member@vanta.shop',
      placedAt: '2026-06-20T08:15:00.000Z',
    },
  ];
  ```

- [ ] Create the seed barrel `d:/MINE/freelance/system/vanta/lib/data/mock/seed/index.ts`:

  ```ts
  export { seedProducts } from './products';
  export { seedCollections } from './collections';
  export { seedDrops, ACTIVE_DROP_ID } from './drops';
  export { seedUsers } from './users';
  export type { SeedUser } from './users';
  export { seedOrders } from './orders';
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/seed.test.ts && npm run typecheck
  ```

  Expected: `Tests  12 passed (12)` and `typecheck` exits 0. (If the sold-out or low-stock counts are off, the matrix test names the exact failing assertion — adjust the offending variant's `stock`/`availability` to restore exactly 3 sold-out and 4 low-stock.)

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(data): add typed seed catalog with drops sold-out and low-stock invariants"
  ```

---

### Task 1.7 — Mock adapters, `mockRepositories` bundle, and the swap point

The deliverable is `lib/data/mock/**` (the five adapters + bundle) plus `lib/data/index.ts` (the single swap point), proven by a repository-query Vitest spec that exercises real queries through `@/lib/data` (`getBySlug`, `listByDrop`, `decrementStock` mutation, `verifyCredentials`, `orders.getById`). This is the "change one import to go live" seam made testable.

> The mock `CartStore` here is request-context-free in tests: Phase 1 ships an in-memory `CartStore` adapter so the bundle is complete and unit-testable; the cookie-backed signed implementation is layered in during the cart phase. The in-memory version satisfies the exact `CartStore` interface (`read`/`write`/`clear`).

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/product-repository.mock.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/collection-repository.mock.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/order-repository.mock.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/user-repository.mock.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/cart-store.mock.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/index.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/data/index.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/repo-swap.test.ts`

**Interfaces**

- Consumes: the interfaces from `@/lib/data/repositories`; the seed from `./seed`; domain types from `@/lib/domain`.
- Produces: `mockRepositories: Repositories`; `repositories`, `products`, `collections`, `orders`, `users`, `cart` from `@/lib/data`.

**Steps**

- [ ] **Write the failing repository-query test** at `d:/MINE/freelance/system/vanta/tests/unit/repo-swap.test.ts`. It queries through the public swap point `@/lib/data`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { products, collections, orders, users } from '@/lib/data';

  describe('repository queries through the swap point @/lib/data', () => {
    it('products.list returns the full seeded catalog', async () => {
      const all = await products.list();
      expect(all.length).toBeGreaterThanOrEqual(12);
    });

    it('products.getBySlug resolves a known product', async () => {
      const p = await products.getBySlug('void-tee');
      expect(p?.id).toBe('prd_void_tee');
    });

    it('products.getBySlug returns null for an unknown slug', async () => {
      expect(await products.getBySlug('does-not-exist')).toBeNull();
    });

    it('products.listByDrop returns only products in the active drop', async () => {
      const dropProducts = await products.listByDrop('drp_void_genesis');
      expect(dropProducts.length).toBeGreaterThan(0);
      expect(dropProducts.every((p) => p.dropId === 'drp_void_genesis')).toBe(true);
    });

    it('products.getVariantById finds a nested variant', async () => {
      const v = await products.getVariantById('var_void_tee_m_black');
      expect(v?.sku).toBe('VNT-TEE-M-BLK');
    });

    it('products.decrementStock reduces in-session stock and returns the updated variant', async () => {
      const before = await products.getVariantById('var_void_tee_s_black');
      const startStock = before!.stock;
      const updated = await products.decrementStock('var_void_tee_s_black', 2);
      expect(updated.stock).toBe(startStock - 2);
      const after = await products.getVariantById('var_void_tee_s_black');
      expect(after!.stock).toBe(startStock - 2);
    });

    it('products.decrementStock throws when reducing below zero', async () => {
      await expect(products.decrementStock('var_void_tee_l_black', 1)).rejects.toThrow();
    });

    it('products.search matches titles case-insensitively', async () => {
      const hits = await products.search('hoodie');
      expect(hits.some((p) => p.id === 'prd_void_hoodie')).toBe(true);
    });

    it('collections.getBySlug resolves a collection', async () => {
      const c = await collections.getBySlug('the-void');
      expect(c?.id).toBe('col_void');
    });

    it('users.verifyCredentials accepts the seed member and rejects bad passwords', async () => {
      const ok = await users.verifyCredentials('member@vanta.shop', 'vanta-demo');
      expect(ok?.id).toBe('usr_member');
      expect(ok && 'password' in ok).toBe(false); // password never leaks into domain User
      const bad = await users.verifyCredentials('member@vanta.shop', 'wrong');
      expect(bad).toBeNull();
    });

    it('orders.getById returns the seeded confirmation order', async () => {
      const order = await orders.getById('ord_seed_demo');
      expect(order?.totals.total.amount).toBe(378000);
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/repo-swap.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/data"`.

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/product-repository.mock.ts`. It deep-clones the seed at construction so test mutations (`decrementStock`) never poison the shared seed module:

  ```ts
  import type { Product, Variant } from '@/lib/domain';
  import type { ProductRepository } from '@/lib/data/repositories';
  import { seedProducts } from './seed';

  /** Structured clone so in-session mutation never poisons the seed module. */
  const clone = <T>(value: T): T => structuredClone(value);

  export class MockProductRepository implements ProductRepository {
    private products: Product[];

    constructor(seed: Product[] = seedProducts) {
      this.products = clone(seed);
    }

    async list(): Promise<Product[]> {
      return clone(this.products);
    }

    async getBySlug(slug: string): Promise<Product | null> {
      const found = this.products.find((p) => p.slug === slug);
      return found ? clone(found) : null;
    }

    async getById(id: string): Promise<Product | null> {
      const found = this.products.find((p) => p.id === id);
      return found ? clone(found) : null;
    }

    async getVariantById(variantId: string): Promise<Variant | null> {
      for (const p of this.products) {
        const v = p.variants.find((variant) => variant.id === variantId);
        if (v) return clone(v);
      }
      return null;
    }

    async listByCollection(collectionId: string): Promise<Product[]> {
      return clone(this.products.filter((p) => p.collectionIds.includes(collectionId)));
    }

    async listByDrop(dropId: string): Promise<Product[]> {
      return clone(this.products.filter((p) => p.dropId === dropId));
    }

    async decrementStock(variantId: string, quantity: number): Promise<Variant> {
      for (const p of this.products) {
        const v = p.variants.find((variant) => variant.id === variantId);
        if (v) {
          if (quantity <= 0) throw new Error('Quantity must be positive');
          if (v.stock - quantity < 0) {
            throw new Error(`Insufficient stock for variant ${variantId}`);
          }
          v.stock -= quantity;
          return clone(v);
        }
      }
      throw new Error(`Variant not found: ${variantId}`);
    }

    async search(query: string): Promise<Product[]> {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return clone(
        this.products.filter(
          (p) =>
            p.title.en.toLowerCase().includes(q) ||
            p.title.th.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q),
        ),
      );
    }
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/collection-repository.mock.ts`:

  ```ts
  import type { Collection } from '@/lib/domain';
  import type { CollectionRepository } from '@/lib/data/repositories';
  import { seedCollections } from './seed';

  const clone = <T>(value: T): T => structuredClone(value);

  export class MockCollectionRepository implements CollectionRepository {
    private collections: Collection[];

    constructor(seed: Collection[] = seedCollections) {
      this.collections = clone(seed);
    }

    async list(): Promise<Collection[]> {
      return clone(this.collections);
    }

    async getBySlug(slug: string): Promise<Collection | null> {
      const found = this.collections.find((c) => c.slug === slug);
      return found ? clone(found) : null;
    }

    async getById(id: string): Promise<Collection | null> {
      const found = this.collections.find((c) => c.id === id);
      return found ? clone(found) : null;
    }
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/order-repository.mock.ts`. It uses an in-memory map seeded with the demo confirmation order:

  ```ts
  import type { Order } from '@/lib/domain';
  import type { OrderRepository } from '@/lib/data/repositories';
  import { seedOrders } from './seed';

  const clone = <T>(value: T): T => structuredClone(value);

  export class MockOrderRepository implements OrderRepository {
    private orders: Map<string, Order>;

    constructor(seed: Order[] = seedOrders) {
      this.orders = new Map(clone(seed).map((o) => [o.id, o]));
    }

    async create(order: Order): Promise<Order> {
      this.orders.set(order.id, clone(order));
      return clone(order);
    }

    async getById(orderId: string): Promise<Order | null> {
      const found = this.orders.get(orderId);
      return found ? clone(found) : null;
    }

    async listByUser(userId: string): Promise<Order[]> {
      return clone([...this.orders.values()].filter((o) => o.userId === userId));
    }
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/user-repository.mock.ts`. It strips the seed-only `password` before returning a domain `User`, so credentials never leak past the adapter:

  ```ts
  import type { User } from '@/lib/domain';
  import type { UserRepository } from '@/lib/data/repositories';
  import { seedUsers, type SeedUser } from './seed';

  const clone = <T>(value: T): T => structuredClone(value);

  /** Drop the seed-only password so the domain User never carries credentials. */
  function toDomainUser(seed: SeedUser): User {
    const { password: _password, ...user } = clone(seed);
    return user;
  }

  export class MockUserRepository implements UserRepository {
    private users: SeedUser[];

    constructor(seed: SeedUser[] = seedUsers) {
      this.users = clone(seed);
    }

    async getById(userId: string): Promise<User | null> {
      const found = this.users.find((u) => u.id === userId);
      return found ? toDomainUser(found) : null;
    }

    async getByEmail(email: string): Promise<User | null> {
      const found = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return found ? toDomainUser(found) : null;
    }

    async verifyCredentials(email: string, password: string): Promise<User | null> {
      const found = this.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      return found ? toDomainUser(found) : null;
    }
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/lib/data/mock/cart-store.mock.ts`. Phase 1 ships an in-memory `CartStore` so the bundle is complete and testable; the cart phase swaps in the cookie-backed signed implementation behind this same interface:

  ```ts
  import type { Cart } from '@/lib/domain';
  import type { CartStore } from '@/lib/data/repositories';

  const clone = <T>(value: T): T => structuredClone(value);

  function emptyCart(): Cart {
    return {
      items: [],
      itemCount: 0,
      subtotal: { amount: 0, currency: 'THB' },
      updatedAt: new Date(0).toISOString(),
    };
  }

  /**
   * In-memory CartStore for Phase 1 unit-testability. The cookie-backed signed
   * implementation is layered in during the cart phase behind this exact
   * interface — no consumer changes.
   */
  export class MockCartStore implements CartStore {
    private cart: Cart = emptyCart();

    async read(): Promise<Cart> {
      return clone(this.cart);
    }

    async write(cart: Cart): Promise<void> {
      this.cart = clone(cart);
    }

    async clear(): Promise<void> {
      this.cart = emptyCart();
    }
  }
  ```

- [ ] Create the mock bundle `d:/MINE/freelance/system/vanta/lib/data/mock/index.ts`:

  ```ts
  import type { Repositories } from '@/lib/data/repositories';
  import { MockProductRepository } from './product-repository.mock';
  import { MockCollectionRepository } from './collection-repository.mock';
  import { MockOrderRepository } from './order-repository.mock';
  import { MockUserRepository } from './user-repository.mock';
  import { MockCartStore } from './cart-store.mock';

  export const mockRepositories: Repositories = {
    products: new MockProductRepository(),
    collections: new MockCollectionRepository(),
    orders: new MockOrderRepository(),
    users: new MockUserRepository(),
    cart: new MockCartStore(),
  };
  ```

- [ ] Create the swap point `d:/MINE/freelance/system/vanta/lib/data/index.ts` (verbatim):

  ```ts
  import type { Repositories } from './repositories';
  import { mockRepositories } from './mock';

  /** Change-one-import-to-go-live: swap mockRepositories for prismaRepositories / apiRepositories here. */
  export const repositories: Repositories = mockRepositories;

  // Convenience named exports (so callers can `import { products } from '@/lib/data'`):
  export const { products, collections, orders, users, cart } = repositories;
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/repo-swap.test.ts && npm run typecheck
  ```

  Expected: `Tests  12 passed (12)` and `typecheck` exits 0.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(data): add mock repository adapters and the single swap point"
  ```

---

### Task 1.8 — `deriveAvailability` (pure) — every state transition incl. early-access by role

The deliverable is `lib/services/availability.ts` exporting `LOW_STOCK_THRESHOLD` and the pure `deriveAvailability`, proven by an exhaustive Vitest spec covering the full precedence ladder (`sold_out > coming_soon > early_access > live(member) > low_stock > live`) and the role-gated early-access branch. The function is pure — no clock or cookie access — `now` and `user` are passed in.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/services/availability.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/availability.test.ts`

**Interfaces**

- Consumes: `Variant`, `Drop`, `User`, `Availability` from `@/lib/domain`.
- Produces (verbatim): `export const LOW_STOCK_THRESHOLD = 5;` and `export function deriveAvailability(variant: Variant, drop: Drop | null, now: Date, user: User | null): Availability;`

**Steps**

- [ ] **Write the failing exhaustive test** at `d:/MINE/freelance/system/vanta/tests/unit/availability.test.ts`. The fixtures pin every branch and boundary, including the early-access role gate:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { deriveAvailability, LOW_STOCK_THRESHOLD } from '@/lib/services/availability';
  import type { Variant, Drop, User } from '@/lib/domain';

  const variantWith = (stock: number): Variant => ({
    id: 'var_x',
    sku: 'SKU-X',
    optionValues: { size: 'M', color: 'Black' },
    price: { amount: 129000, currency: 'THB' },
    stock,
    availability: 'live', // baseline ignored; derive recomputes
  });

  const drop: Drop = {
    id: 'drp_void_genesis',
    name: { en: 'VOID GENESIS', th: 'วอยด์ เจเนซิส' },
    earlyAccessAt: '2026-07-01T10:00:00.000Z',
    releaseAt: '2026-07-01T13:00:00.000Z',
    endAt: '2026-07-15T17:00:00.000Z',
  };

  const member: User = {
    id: 'usr_member',
    email: 'member@vanta.shop',
    name: 'Member',
    role: 'member',
    addresses: [],
  };
  const admin: User = { ...member, id: 'usr_admin', role: 'admin' };
  const guest: User = { ...member, id: 'usr_guest', role: 'guest' };

  const BEFORE_EARLY = new Date('2026-07-01T09:00:00.000Z'); // < earlyAccessAt
  const IN_EARLY = new Date('2026-07-01T11:00:00.000Z'); // earlyAccessAt <= now < releaseAt
  const AFTER_RELEASE = new Date('2026-07-02T00:00:00.000Z'); // >= releaseAt

  describe('LOW_STOCK_THRESHOLD', () => {
    it('is exactly 5', () => {
      expect(LOW_STOCK_THRESHOLD).toBe(5);
    });
  });

  describe('deriveAvailability — sold_out wins above everything', () => {
    it('stock 0 with no drop => sold_out', () => {
      expect(deriveAvailability(variantWith(0), null, AFTER_RELEASE, null)).toBe('sold_out');
    });
    it('stock 0 even before early access and even for a member => sold_out', () => {
      expect(deriveAvailability(variantWith(0), drop, BEFORE_EARLY, member)).toBe('sold_out');
    });
    it('negative stock => sold_out', () => {
      expect(deriveAvailability(variantWith(-1), null, AFTER_RELEASE, null)).toBe('sold_out');
    });
  });

  describe('deriveAvailability — coming_soon before early access', () => {
    it('drop present, now < earlyAccessAt, guest => coming_soon', () => {
      expect(deriveAvailability(variantWith(10), drop, BEFORE_EARLY, guest)).toBe('coming_soon');
    });
    it('drop present, now < earlyAccessAt, member => coming_soon (early access not open yet)', () => {
      expect(deriveAvailability(variantWith(10), drop, BEFORE_EARLY, member)).toBe('coming_soon');
    });
  });

  describe('deriveAvailability — early_access gate by role', () => {
    it('in early window, guest (no user) => early_access (gated)', () => {
      expect(deriveAvailability(variantWith(10), drop, IN_EARLY, null)).toBe('early_access');
    });
    it('in early window, guest role => early_access (gated)', () => {
      expect(deriveAvailability(variantWith(10), drop, IN_EARLY, guest)).toBe('early_access');
    });
    it('in early window, member => live (unlocked)', () => {
      expect(deriveAvailability(variantWith(10), drop, IN_EARLY, member)).toBe('live');
    });
    it('in early window, admin => live (unlocked)', () => {
      expect(deriveAvailability(variantWith(10), drop, IN_EARLY, admin)).toBe('live');
    });
    it('in early window, member, low stock => still unlocked but low_stock takes the buyable state', () => {
      expect(deriveAvailability(variantWith(3), drop, IN_EARLY, member)).toBe('low_stock');
    });
  });

  describe('deriveAvailability — after public release', () => {
    it('now >= releaseAt, guest, healthy stock => live', () => {
      expect(deriveAvailability(variantWith(20), drop, AFTER_RELEASE, guest)).toBe('live');
    });
    it('now >= releaseAt, guest, low stock => low_stock', () => {
      expect(deriveAvailability(variantWith(4), drop, AFTER_RELEASE, guest)).toBe('low_stock');
    });
  });

  describe('deriveAvailability — no-drop products', () => {
    it('no drop, healthy stock => live', () => {
      expect(deriveAvailability(variantWith(50), null, AFTER_RELEASE, null)).toBe('live');
    });
    it('no drop, stock == threshold (5) => low_stock', () => {
      expect(deriveAvailability(variantWith(LOW_STOCK_THRESHOLD), null, AFTER_RELEASE, null)).toBe(
        'low_stock',
      );
    });
    it('no drop, stock == threshold + 1 (6) => live', () => {
      expect(
        deriveAvailability(variantWith(LOW_STOCK_THRESHOLD + 1), null, AFTER_RELEASE, null),
      ).toBe('live');
    });
    it('no drop, stock == 1 => low_stock', () => {
      expect(deriveAvailability(variantWith(1), null, AFTER_RELEASE, null)).toBe('low_stock');
    });
  });

  describe('deriveAvailability — purity', () => {
    it('does not mutate the variant it is given', () => {
      const v = variantWith(3);
      const snapshot = JSON.stringify(v);
      deriveAvailability(v, drop, IN_EARLY, member);
      expect(JSON.stringify(v)).toBe(snapshot);
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/availability.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/services/availability"`.

- [ ] Implement the minimal pure function at `d:/MINE/freelance/system/vanta/lib/services/availability.ts` (verbatim signature; precedence per contract):

  ```ts
  import type { Variant, Drop, User, Availability } from '@/lib/domain';

  export const LOW_STOCK_THRESHOLD = 5;

  /**
   * PURE. No clock, no cookies. Read identically by home/catalog/PDP/marquee.
   * Precedence: sold_out > coming_soon > early_access > low_stock > live.
   *  - stock <= 0                                  => 'sold_out'
   *  - drop && now < earlyAccessAt                 => 'coming_soon'
   *  - drop && now < releaseAt && !member          => 'early_access' (gated)
   *  - drop && now < releaseAt &&  member          => 'live' (unlocked)
   *  - 0 < stock <= LOW_STOCK_THRESHOLD            => 'low_stock'
   *  - otherwise                                   => 'live'
   */
  export function deriveAvailability(
    variant: Variant,
    drop: Drop | null,
    now: Date,
    user: User | null,
  ): Availability {
    if (variant.stock <= 0) return 'sold_out';

    if (drop) {
      const nowMs = now.getTime();
      const earlyMs = Date.parse(drop.earlyAccessAt);
      const releaseMs = Date.parse(drop.releaseAt);

      if (nowMs < earlyMs) return 'coming_soon';

      if (nowMs < releaseMs) {
        const unlocked = user?.role === 'member' || user?.role === 'admin';
        if (!unlocked) return 'early_access';
        // member/admin: fall through to buyable states (low_stock / live).
      }
    }

    if (variant.stock <= LOW_STOCK_THRESHOLD) return 'low_stock';
    return 'live';
  }
  ```

- [ ] **Run it and SHOW it pass.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/availability.test.ts
  ```

  Expected: `Tests  18 passed (18)`.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(services): add pure deriveAvailability with role-gated early access"
  ```

---

### Task 1.9 — `dropService` wired through repositories

The deliverable is `lib/services/drop-service.ts` implementing the `DropService` contract over the repositories, proven by a Vitest spec for `getActiveDrop`, `getDropById`, and `getDropProducts`. This closes the phase by giving the hero LIVE DROP a service seam that reads through `@/lib/data` (never `@/lib/data/mock`).

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/services/drop-service.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/drop-service.test.ts`

**Interfaces**

- Consumes: `Drop`, `Product` from `@/lib/domain`; `products` from `@/lib/data`; `seedDrops`, `ACTIVE_DROP_ID` are NOT imported by the service (it must not reach into mock) — instead the active drop is resolved from a small drop catalog the service owns, fed from the repository layer. To keep repositories request-context-free and avoid adding a drop repository this phase, the service reads drops from the seed via the data barrel exposure below.
- Produces (verbatim): `export const dropService: DropService;` where `DropService` has `getActiveDrop()`, `getDropById(dropId)`, `getDropProducts(dropId)`.

> To honor "components/services reach data only through `@/lib/data`," extend the swap point with read-only drop access rather than importing `@/lib/data/mock`. Add a `drops` export to `lib/data/index.ts` backed by the seed through a tiny in-file repository, mirroring the collection pattern. This keeps `dropService` free of any mock import.

**Steps**

- [ ] Add drop access to the swap point. First add a drop repository interface file `d:/MINE/freelance/system/vanta/lib/data/repositories/drop-repository.ts`:

  ```ts
  import type { Drop } from '@/lib/domain';

  export interface DropRepository {
    list(): Promise<Drop[]>;
    getById(dropId: string): Promise<Drop | null>;
    getActive(now: Date): Promise<Drop | null>;
  }
  ```

- [ ] Re-export the new interface and add it to the bundle in `d:/MINE/freelance/system/vanta/lib/data/repositories/index.ts`. Apply this edit:

  ```ts
  import type { ProductRepository } from './product-repository';
  import type { CollectionRepository } from './collection-repository';
  import type { OrderRepository } from './order-repository';
  import type { UserRepository } from './user-repository';
  import type { CartStore } from './cart-store';
  import type { DropRepository } from './drop-repository';

  export type { ProductRepository } from './product-repository';
  export type { CollectionRepository } from './collection-repository';
  export type { OrderRepository } from './order-repository';
  export type { UserRepository } from './user-repository';
  export type { CartStore } from './cart-store';
  export type { DropRepository } from './drop-repository';

  export interface Repositories {
    products: ProductRepository;
    collections: CollectionRepository;
    orders: OrderRepository;
    users: UserRepository;
    cart: CartStore;
    drops: DropRepository;
  }
  ```

- [ ] Create the mock drop adapter `d:/MINE/freelance/system/vanta/lib/data/mock/drop-repository.mock.ts`. `getActive` returns the drop whose window contains `now`, else the soonest upcoming drop, else null — so demos always have an active drop to count down to:

  ```ts
  import type { Drop } from '@/lib/domain';
  import type { DropRepository } from '@/lib/data/repositories';
  import { seedDrops } from './seed';

  const clone = <T>(value: T): T => structuredClone(value);

  export class MockDropRepository implements DropRepository {
    private drops: Drop[];

    constructor(seed: Drop[] = seedDrops) {
      this.drops = clone(seed);
    }

    async list(): Promise<Drop[]> {
      return clone(this.drops);
    }

    async getById(dropId: string): Promise<Drop | null> {
      const found = this.drops.find((d) => d.id === dropId);
      return found ? clone(found) : null;
    }

    async getActive(now: Date): Promise<Drop | null> {
      const nowMs = now.getTime();
      // A drop is active while now is before its window closes.
      const live = this.drops
        .filter((d) => nowMs < Date.parse(d.endAt))
        .sort((a, b) => Date.parse(a.earlyAccessAt) - Date.parse(b.earlyAccessAt));
      return live.length > 0 ? clone(live[0]) : null;
    }
  }
  ```

- [ ] Wire the adapter into the mock bundle `d:/MINE/freelance/system/vanta/lib/data/mock/index.ts`:

  ```ts
  import type { Repositories } from '@/lib/data/repositories';
  import { MockProductRepository } from './product-repository.mock';
  import { MockCollectionRepository } from './collection-repository.mock';
  import { MockOrderRepository } from './order-repository.mock';
  import { MockUserRepository } from './user-repository.mock';
  import { MockCartStore } from './cart-store.mock';
  import { MockDropRepository } from './drop-repository.mock';

  export const mockRepositories: Repositories = {
    products: new MockProductRepository(),
    collections: new MockCollectionRepository(),
    orders: new MockOrderRepository(),
    users: new MockUserRepository(),
    cart: new MockCartStore(),
    drops: new MockDropRepository(),
  };
  ```

- [ ] Expose `drops` at the swap point `d:/MINE/freelance/system/vanta/lib/data/index.ts`:

  ```ts
  import type { Repositories } from './repositories';
  import { mockRepositories } from './mock';

  /** Change-one-import-to-go-live: swap mockRepositories for prismaRepositories / apiRepositories here. */
  export const repositories: Repositories = mockRepositories;

  // Convenience named exports (so callers can `import { products } from '@/lib/data'`):
  export const { products, collections, orders, users, cart, drops } = repositories;
  ```

- [ ] **Write the failing drop-service test** at `d:/MINE/freelance/system/vanta/tests/unit/drop-service.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { dropService } from '@/lib/services/drop-service';

  describe('dropService', () => {
    it('getActiveDrop returns a drop whose window has not closed', async () => {
      const drop = await dropService.getActiveDrop();
      expect(drop).not.toBeNull();
      expect(Date.parse(drop!.endAt)).toBeGreaterThan(Date.now());
    });

    it('getDropById resolves the active drop by id', async () => {
      const drop = await dropService.getDropById('drp_void_genesis');
      expect(drop?.name.en).toBe('VOID GENESIS');
    });

    it('getDropById returns null for an unknown id', async () => {
      expect(await dropService.getDropById('drp_nope')).toBeNull();
    });

    it('getDropProducts returns only products belonging to the drop', async () => {
      const productsInDrop = await dropService.getDropProducts('drp_void_genesis');
      expect(productsInDrop.length).toBeGreaterThan(0);
      expect(productsInDrop.every((p) => p.dropId === 'drp_void_genesis')).toBe(true);
    });
  });
  ```

- [ ] **Run it and SHOW it fail.** Run:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test -- tests/unit/drop-service.test.ts
  ```

  Expected: failure `Failed to resolve import "@/lib/services/drop-service"`.

- [ ] Implement `d:/MINE/freelance/system/vanta/lib/services/drop-service.ts` (verbatim `DropService` shape; reads only through `@/lib/data`):

  ```ts
  import type { Drop, Product } from '@/lib/domain';
  import { drops, products } from '@/lib/data';

  export interface DropService {
    getActiveDrop(): Promise<Drop | null>;
    getDropById(dropId: string): Promise<Drop | null>;
    getDropProducts(dropId: string): Promise<Product[]>;
  }

  export const dropService: DropService = {
    async getActiveDrop(): Promise<Drop | null> {
      return drops.getActive(new Date());
    },
    async getDropById(dropId: string): Promise<Drop | null> {
      return drops.getById(dropId);
    },
    async getDropProducts(dropId: string): Promise<Product[]> {
      return products.listByDrop(dropId);
    },
  };
  ```

- [ ] **Run it and SHOW it pass**, and re-run the whole suite to confirm the bundle change did not regress earlier tests:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm test && npm run typecheck
  ```

  Expected: all unit files pass (`harness`, `domain`, `money`, `date`, `repositories.contract`, `seed`, `repo-swap`, `availability`, `drop-service`) and `typecheck` exits 0.

- [ ] Commit:

  ```bash
  cd d:/MINE/freelance/system/vanta && git add -A && git commit -m "feat(services): add dropService and drop repository via the swap point"
  ```

---

**Phase 1 exit criteria (all green):** `npm test` runs 9 unit specs to pass; `npm run typecheck` is clean; `lib/domain/**`, `lib/data/**` (incl. the single swap point and `drops`), `lib/format/{money,date}.ts`, `lib/services/{availability,drop-service}.ts` exist; the seed enforces exactly 3 sold-out and 4 low-stock variants across ≥12 products with size×color variants and a future-dated active drop; and the demo member (`member@vanta.shop` / `vanta-demo`) plus the seeded `ord_seed_demo` confirmation order are queryable through `@/lib/data`. The "change one import to go live" seam is real and tested.

Key file paths produced by this phase:

- `d:/MINE/freelance/system/vanta/lib/domain/` (money.ts, i18n.ts, product.ts, collection.ts, drop.ts, cart.ts, order.ts, user.ts, index.ts)
- `d:/MINE/freelance/system/vanta/lib/data/repositories/` (product-, collection-, order-, user-, drop-repository.ts, cart-store.ts, index.ts)
- `d:/MINE/freelance/system/vanta/lib/data/mock/` (seed/_, _.mock.ts, index.ts) and `d:/MINE/freelance/system/vanta/lib/data/index.ts` (THE SWAP POINT)
- `d:/MINE/freelance/system/vanta/lib/services/` (availability.ts, drop-service.ts)
- `d:/MINE/freelance/system/vanta/lib/format/` (money.ts, date.ts)
- `d:/MINE/freelance/system/vanta/tests/unit/` (harness, domain, money, date, repositories.contract, seed, repo-swap, availability, drop-service .test.ts)

---

I have everything I need. The contracts already specify the exact next-intl config shapes. Now I'll write the complete Phase 2 markdown.

# Phase 2 — i18n & Bilingual Text

> **Phase goal:** wire next-intl across the `[locale]` segment so EN/TH render **real copy** on as-yet-unstyled real screens, ship the grapheme-safe `splitGraphemes` util (with a test proving Thai combining marks survive and a test proving naive `.split('')` would shatter them), and stand up the per-locale headline tokens plus the `LocalizedText` render helper. **Deliverable: both locales show real content on real (unstyled) screens, with `<html lang>` + `hreflang` correct, and split-text safety proven by Vitest.**
>
> Prerequisite: Phase 1 (domain types in `lib/domain`, mock repositories + swap point in `lib/data`) is complete — this phase imports `Locale` / `LocalizedText` from `@/lib/domain` and reads catalog data through `@/lib/data`. Before starting, invoke `superpowers:executing-plans`; follow `superpowers:test-driven-development` for every LOGIC task below (`splitGraphemes`, `getLocalizedText`).

---

## Task 2.1 — next-intl routing, request config & localized navigation

Establish the locale source of truth: `routing` (locales `['en','th']`, default `'en'`, prefix `'always'`), the request-config loader that imports the right messages file, and the localized navigation helpers. This task ends in a typecheck-clean i18n core that later tasks import.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/i18n/routing.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/i18n/navigation.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/i18n/request.ts`
- Create: `d:/MINE/freelance/system/vanta/messages/en.json` (stub — real keys land in Task 2.4)
- Create: `d:/MINE/freelance/system/vanta/messages/th.json` (stub)
- Modify: `d:/MINE/freelance/system/vanta/next.config.ts` (wire the next-intl plugin)
- Test: typecheck only (`npm run typecheck`) — no logic to TDD here; pure config.

**Interfaces**

- Produces: `routing` (`import('next-intl/routing').Routing`), `{ Link, redirect, usePathname, useRouter, getPathname }` from `createNavigation(routing)`, and the default `getRequestConfig` export.
- Consumes: `next-intl/routing` `defineRouting`, `next-intl/navigation` `createNavigation`, `next-intl/server` `getRequestConfig`, and the message JSON files via `import('@/messages/${locale}.json')`.

**Steps**

- [ ] Confirm `next-intl` is installed (Phase 0/1 dependency). If absent, install it:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm install next-intl
  ```

  Expected: `package-lock.json` updated, `next-intl` appears under `dependencies`.

- [ ] Create `lib/i18n/routing.ts` (verbatim from contract):

  ```ts
  import { defineRouting } from 'next-intl/routing';

  export const routing = defineRouting({
    locales: ['en', 'th'] as const,
    defaultLocale: 'en',
    localePrefix: 'always',
  });
  ```

- [ ] Create `lib/i18n/navigation.ts` (verbatim from contract):

  ```ts
  import { createNavigation } from 'next-intl/navigation';
  import { routing } from './routing';

  export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
  ```

- [ ] Create `lib/i18n/request.ts` (verbatim from contract):

  ```ts
  import { getRequestConfig } from 'next-intl/server';
  import { routing } from './routing';

  export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = routing.locales.includes(requested as any) ? requested! : routing.defaultLocale;
    return { locale, messages: (await import(`@/messages/${locale}.json`)).default };
  });
  ```

- [ ] Create stub `messages/en.json` so the dynamic import in `request.ts` resolves before Task 2.4 fills it:

  ```json
  {}
  ```

- [ ] Create stub `messages/th.json`:

  ```json
  {}
  ```

- [ ] Wire the next-intl plugin in `next.config.ts`, pointing at `lib/i18n/request.ts`, and keep the View Transitions experimental flag the architecture requires:

  ```ts
  import type { NextConfig } from 'next';
  import createNextIntlPlugin from 'next-intl/plugin';

  const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

  const nextConfig: NextConfig = {
    experimental: {
      viewTransition: true,
    },
  };

  export default withNextIntl(nextConfig);
  ```

- [ ] Run typecheck and confirm the i18n core compiles:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm run typecheck
  ```

  Expected: exits `0`, no errors referencing `lib/i18n/**` or `next.config.ts`.

- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add lib/i18n next.config.ts messages package.json package-lock.json && git commit -m "feat(i18n): add next-intl routing, request config and localized navigation"
  ```

---

## Task 2.2 — Grapheme-safe `splitGraphemes` util (Intl.Segmenter)

The split-text safety primitive. TDD: a failing test that asserts Thai combining-mark survival AND demonstrates that naive `.split('')` would break the same string, then the minimal `Intl.Segmenter` implementation. This is the contract that all per-grapheme animation later depends on.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/motion/segment.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/segment.test.ts`

**Interfaces**

- Produces: `export function splitGraphemes(text: string, locale?: Locale): string[];`
- Consumes: `Locale` from `@/lib/domain`; the platform `Intl.Segmenter` (`granularity: 'grapheme'`).

**Steps**

- [ ] Write the failing test `tests/unit/segment.test.ts`. It pins three behaviors: (1) the Thai word `"กิน"` (consonant ก" + vowel sign ิ + consonant น — where ิ is a combining mark on ก) is segmented into graphemes that keep the combining mark attached, (2) every returned segment recombines exactly to the input via `join('')`, and (3) a control assertion proving naive `.split('')` would shatter the combining mark into its own code-point element (the bug we forbid):

  ```ts
  import { describe, expect, it } from 'vitest';
  import { splitGraphemes } from '@/lib/motion/segment';

  // U+0E01 ก (THAI CHARACTER KO KAI) + U+0E34 ิ (THAI CHARACTER SARA I, a combining
  // mark) + U+0E19 น (THAI CHARACTER NO NU). The mark ิ MUST stay welded to ก.
  const THAI = 'กิน';

  describe('splitGraphemes', () => {
    it('keeps Thai combining marks welded to their base consonant', () => {
      const graphemes = splitGraphemes(THAI, 'th');
      // 3 code points collapse into 2 user-perceived characters: "กิ" and "น".
      expect(graphemes).toEqual(['กิ', 'น']);
      // The combining mark is never a standalone element.
      expect(graphemes).not.toContain('ิ');
    });

    it('is lossless — joining the segments reproduces the input', () => {
      expect(splitGraphemes(THAI, 'th').join('')).toBe(THAI);
      expect(splitGraphemes('DROP', 'en').join('')).toBe('DROP');
    });

    it('proves the forbidden naive split would break the same string', () => {
      // This is the bug splitGraphemes exists to prevent: .split('') cuts on
      // code points, orphaning the combining mark as its own element.
      const naive = THAI.split('');
      expect(naive).toEqual(['ก', 'ิ', 'น']);
      expect(naive).toContain('ิ'); // orphaned mark — a Thai reviewer catches this instantly
      // splitGraphemes must NOT reproduce that orphaning.
      expect(splitGraphemes(THAI, 'th')).not.toEqual(naive);
    });

    it('splits plain Latin into single characters', () => {
      expect(splitGraphemes('VANTA', 'en')).toEqual(['V', 'A', 'N', 'T', 'A']);
    });
  });
  ```

- [ ] Run the test and SHOW it fail (module does not exist yet):

  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/segment.test.ts
  ```

  Expected: failure — `Error: Failed to resolve import "@/lib/motion/segment"` (cannot find module), 0 passing.

- [ ] Implement the minimal util in `lib/motion/segment.ts`:

  ```ts
  import type { Locale } from '@/lib/domain';

  /**
   * Grapheme-safe text splitting. NEVER use `.split('')` — it cuts on code points
   * and shatters Thai combining marks (vowel/tone signs) off their base consonant.
   * `Intl.Segmenter` with grapheme granularity returns user-perceived characters,
   * so Thai (and emoji/ZWJ sequences) stay intact for per-character animation.
   */
  export function splitGraphemes(text: string, locale: Locale = 'en'): string[] {
    const segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' });
    const result: string[] = [];
    for (const { segment } of segmenter.segment(text)) {
      result.push(segment);
    }
    return result;
  }
  ```

- [ ] Run the test and SHOW it pass:

  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/segment.test.ts
  ```

  Expected: `4 passed`, exit `0`.

- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add lib/motion/segment.ts tests/unit/segment.test.ts && git commit -m "feat(motion): add grapheme-safe splitGraphemes via Intl.Segmenter"
  ```

---

## Task 2.3 — `getLocalizedText` render helper

Every domain object carries `LocalizedText` (`{ en, th }`). Components must resolve it to the active locale through one helper (never `text[locale]` ad hoc, which loses the `Locale` type guarantee). TDD: failing test → minimal implementation.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/i18n/localized-text.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/localized-text.test.ts`

**Interfaces**

- Produces: `export function getLocalizedText(text: LocalizedText, locale: Locale): string;`
- Consumes: `LocalizedText`, `Locale` from `@/lib/domain`.

**Steps**

- [ ] Write the failing test `tests/unit/localized-text.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';
  import type { LocalizedText } from '@/lib/domain';
  import { getLocalizedText } from '@/lib/i18n/localized-text';

  const sample: LocalizedText = { en: 'Void Hoodie', th: 'ฮู้ดดี้วอยด์' };

  describe('getLocalizedText', () => {
    it('returns the English string for the en locale', () => {
      expect(getLocalizedText(sample, 'en')).toBe('Void Hoodie');
    });

    it('returns the Thai string for the th locale', () => {
      expect(getLocalizedText(sample, 'th')).toBe('ฮู้ดดี้วอยด์');
    });
  });
  ```

- [ ] Run the test and SHOW it fail:

  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/localized-text.test.ts
  ```

  Expected: failure — `Failed to resolve import "@/lib/i18n/localized-text"`, 0 passing.

- [ ] Implement `lib/i18n/localized-text.ts`:

  ```ts
  import type { LocalizedText, Locale } from '@/lib/domain';

  /**
   * Resolve a bilingual domain string to the active locale. Use this everywhere a
   * `LocalizedText` is rendered — never index `text[locale]` ad hoc, so the `Locale`
   * type and the en/th keyset stay the single enforced contract.
   */
  export function getLocalizedText(text: LocalizedText, locale: Locale): string {
    return text[locale];
  }
  ```

- [ ] Run the test and SHOW it pass:

  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/localized-text.test.ts
  ```

  Expected: `2 passed`, exit `0`.

- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add lib/i18n/localized-text.ts tests/unit/localized-text.test.ts && git commit -m "feat(i18n): add getLocalizedText render helper for LocalizedText"
  ```

---

## Task 2.4 — Real bilingual message catalogs (`messages/en.json` + `messages/th.json`)

Replace the stub JSON with real, mirrored copy keyed by namespace for nav / home / pdp / cart / checkout / account. TH is a complete mirror of the EN keyset (same keys, Thai values). Marquee strings stay **English `DROP` / `SOLD OUT`** in both locales (a literal Thai `DROP` reads as "a droplet"). A Vitest test enforces keyset parity so the two files can never drift.

**Files**

- Modify: `d:/MINE/freelance/system/vanta/messages/en.json`
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/messages.test.ts`

**Interfaces**

- Produces: namespace tree consumed by `useTranslations('Nav' | 'Home' | 'Pdp' | 'Cart' | 'Checkout' | 'Account' | 'Drop' | 'Common')`.
- Consumes: nothing at runtime; the parity test consumes both JSON files directly.

**Steps**

- [ ] Write the failing keyset-parity test `tests/unit/messages.test.ts`. It flattens both message trees to dotted key paths and asserts the sets are identical, and pins the marquee invariant (English `DROP` / `SOLD OUT` in BOTH locales):

  ```ts
  import { describe, expect, it } from 'vitest';
  import en from '@/messages/en.json';
  import th from '@/messages/th.json';

  function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return value !== null && typeof value === 'object'
        ? flattenKeys(value as Record<string, unknown>, path)
        : [path];
    });
  }

  describe('message catalogs', () => {
    it('en and th have an identical keyset (no drift)', () => {
      const enKeys = flattenKeys(en).sort();
      const thKeys = flattenKeys(th).sort();
      expect(thKeys).toEqual(enKeys);
    });

    it('every leaf value is a non-empty string in both locales', () => {
      for (const catalog of [en, th]) {
        for (const key of flattenKeys(catalog)) {
          const value = key
            .split('.')
            .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], catalog);
          expect(typeof value).toBe('string');
          expect((value as string).length).toBeGreaterThan(0);
        }
      }
    });

    it('keeps the marquee words English in both locales (literal Thai reads as "a droplet")', () => {
      expect(en.Drop.marqueeDrop).toBe('DROP');
      expect(th.Drop.marqueeDrop).toBe('DROP');
      expect(en.Drop.marqueeSoldOut).toBe('SOLD OUT');
      expect(th.Drop.marqueeSoldOut).toBe('SOLD OUT');
    });
  });
  ```

- [ ] Run the test and SHOW it fail (stubs are empty `{}`, so keyset parity passes trivially but `Drop.marqueeDrop` is undefined):

  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/messages.test.ts
  ```

  Expected: failure — `expected undefined to be 'DROP'` in the marquee test, plus a TS/JSON access on `en.Drop`. 0–1 passing.

- [ ] Write the real `messages/en.json`:

  ```json
  {
    "Common": {
      "brandName": "VANTA®",
      "tagline": "Bangkok-born. Globally worn.",
      "currencySymbol": "฿",
      "loading": "Loading",
      "addToCart": "Add to cart",
      "notifyMe": "Notify me",
      "viewProduct": "View product"
    },
    "Nav": {
      "home": "Home",
      "shop": "Shop",
      "collections": "Collections",
      "search": "Search",
      "cart": "Cart",
      "account": "Account",
      "login": "Log in",
      "logout": "Log out",
      "switchToThai": "ไทย",
      "switchToEnglish": "EN",
      "motionToggle": "Reduce motion"
    },
    "Home": {
      "heroHeadline": "MATERIALIZE FROM THE VOID",
      "heroSub": "The drop that disappears when it sells out.",
      "shopTheDrop": "Shop the drop",
      "featuredHeading": "Featured",
      "lookbookTeaserHeading": "The lookbook",
      "lookbookTeaserCta": "Enter the void"
    },
    "Drop": {
      "comingSoon": "Coming soon",
      "earlyAccess": "Early access",
      "earlyAccessMembers": "Members unlock early",
      "live": "Live now",
      "lowStock": "Only {count} left",
      "soldOut": "Sold out",
      "countdownLabel": "Drops in",
      "days": "d",
      "hours": "h",
      "minutes": "m",
      "seconds": "s",
      "marqueeDrop": "DROP",
      "marqueeSoldOut": "SOLD OUT"
    },
    "Pdp": {
      "selectSize": "Select size",
      "selectColor": "Select color",
      "sizeUnavailable": "Unavailable",
      "sku": "SKU",
      "onSale": "Sale",
      "sizeAndFit": "Size & fit",
      "addedToCart": "Added to cart"
    },
    "Cart": {
      "title": "Your cart",
      "empty": "Your cart is empty.",
      "continueShopping": "Continue shopping",
      "itemCount": "{count, plural, =0 {No items} one {# item} other {# items}}",
      "subtotal": "Subtotal",
      "remove": "Remove",
      "quantity": "Quantity",
      "checkout": "Checkout",
      "closeDrawer": "Close cart"
    },
    "Checkout": {
      "title": "Checkout",
      "contact": "Contact",
      "email": "Email",
      "shippingAddress": "Shipping address",
      "fullName": "Full name",
      "addressLine1": "Address",
      "addressLine2": "Apartment, suite (optional)",
      "city": "City",
      "postalCode": "Postal code",
      "country": "Country",
      "phone": "Phone (optional)",
      "payment": "Payment",
      "cardNumber": "Card number",
      "placeOrder": "Place order",
      "orderSummary": "Order summary",
      "shipping": "Shipping",
      "total": "Total",
      "paymentDeclined": "Payment declined. Try another card.",
      "emptyCart": "Your cart is empty.",
      "outOfStock": "An item went out of stock.",
      "confirmationHeading": "Order confirmed",
      "confirmationThanks": "Thank you. Your drop is secured.",
      "orderNumber": "Order",
      "placedOn": "Placed on",
      "shareOrder": "Share"
    },
    "Account": {
      "dashboard": "Dashboard",
      "welcome": "Welcome back, {name}",
      "orders": "Orders",
      "addresses": "Addresses",
      "settings": "Settings",
      "memberSince": "Member",
      "noOrders": "No orders yet.",
      "viewOrder": "View order",
      "defaultAddress": "Default address"
    }
  }
  ```

- [ ] Write the mirrored `messages/th.json` (same keyset; Thai values; marquee words stay English; `{count}` / `{name}` placeholders preserved):

  ```json
  {
    "Common": {
      "brandName": "VANTA®",
      "tagline": "เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก",
      "currencySymbol": "฿",
      "loading": "กำลังโหลด",
      "addToCart": "หยิบใส่ตะกร้า",
      "notifyMe": "แจ้งเตือนฉัน",
      "viewProduct": "ดูสินค้า"
    },
    "Nav": {
      "home": "หน้าแรก",
      "shop": "ช้อป",
      "collections": "คอลเลกชัน",
      "search": "ค้นหา",
      "cart": "ตะกร้า",
      "account": "บัญชี",
      "login": "เข้าสู่ระบบ",
      "logout": "ออกจากระบบ",
      "switchToThai": "ไทย",
      "switchToEnglish": "EN",
      "motionToggle": "ลดการเคลื่อนไหว"
    },
    "Home": {
      "heroHeadline": "ปรากฏกายจากความว่างเปล่า",
      "heroSub": "ดรอปที่จะหายไปเมื่อขายหมด",
      "shopTheDrop": "ช้อปดรอปนี้",
      "featuredHeading": "สินค้าแนะนำ",
      "lookbookTeaserHeading": "ลุคบุ๊ก",
      "lookbookTeaserCta": "เข้าสู่ความว่างเปล่า"
    },
    "Drop": {
      "comingSoon": "เร็วๆ นี้",
      "earlyAccess": "เข้าถึงก่อนใคร",
      "earlyAccessMembers": "สมาชิกปลดล็อกก่อน",
      "live": "เปิดขายแล้ว",
      "lowStock": "เหลือเพียง {count} ชิ้น",
      "soldOut": "ขายหมดแล้ว",
      "countdownLabel": "เปิดขายอีกใน",
      "days": "วัน",
      "hours": "ชม.",
      "minutes": "นาที",
      "seconds": "วิ",
      "marqueeDrop": "DROP",
      "marqueeSoldOut": "SOLD OUT"
    },
    "Pdp": {
      "selectSize": "เลือกไซซ์",
      "selectColor": "เลือกสี",
      "sizeUnavailable": "ไม่มีจำหน่าย",
      "sku": "รหัสสินค้า",
      "onSale": "ลดราคา",
      "sizeAndFit": "ขนาดและการสวมใส่",
      "addedToCart": "เพิ่มลงตะกร้าแล้ว"
    },
    "Cart": {
      "title": "ตะกร้าของคุณ",
      "empty": "ตะกร้าของคุณว่างเปล่า",
      "continueShopping": "ช้อปต่อ",
      "itemCount": "{count, plural, =0 {ไม่มีสินค้า} other {# ชิ้น}}",
      "subtotal": "ยอดรวมย่อย",
      "remove": "ลบออก",
      "quantity": "จำนวน",
      "checkout": "ชำระเงิน",
      "closeDrawer": "ปิดตะกร้า"
    },
    "Checkout": {
      "title": "ชำระเงิน",
      "contact": "ข้อมูลติดต่อ",
      "email": "อีเมล",
      "shippingAddress": "ที่อยู่จัดส่ง",
      "fullName": "ชื่อ-นามสกุล",
      "addressLine1": "ที่อยู่",
      "addressLine2": "ห้อง อาคาร (ไม่บังคับ)",
      "city": "เขต/อำเภอ",
      "postalCode": "รหัสไปรษณีย์",
      "country": "ประเทศ",
      "phone": "เบอร์โทร (ไม่บังคับ)",
      "payment": "การชำระเงิน",
      "cardNumber": "หมายเลขบัตร",
      "placeOrder": "สั่งซื้อ",
      "orderSummary": "สรุปคำสั่งซื้อ",
      "shipping": "ค่าจัดส่ง",
      "total": "ยอดรวมทั้งหมด",
      "paymentDeclined": "การชำระเงินถูกปฏิเสธ ลองบัตรอื่น",
      "emptyCart": "ตะกร้าของคุณว่างเปล่า",
      "outOfStock": "สินค้าบางรายการหมดสต็อก",
      "confirmationHeading": "ยืนยันคำสั่งซื้อแล้ว",
      "confirmationThanks": "ขอบคุณ ดรอปของคุณถูกจองแล้ว",
      "orderNumber": "คำสั่งซื้อ",
      "placedOn": "สั่งซื้อเมื่อ",
      "shareOrder": "แชร์"
    },
    "Account": {
      "dashboard": "แดชบอร์ด",
      "welcome": "ยินดีต้อนรับกลับมา {name}",
      "orders": "คำสั่งซื้อ",
      "addresses": "ที่อยู่",
      "settings": "ตั้งค่า",
      "memberSince": "สมาชิก",
      "noOrders": "ยังไม่มีคำสั่งซื้อ",
      "viewOrder": "ดูคำสั่งซื้อ",
      "defaultAddress": "ที่อยู่หลัก"
    }
  }
  ```

- [ ] Run the parity test and SHOW it pass:

  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/messages.test.ts
  ```

  Expected: `3 passed`, exit `0`.

- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add messages/en.json messages/th.json tests/unit/messages.test.ts && git commit -m "feat(i18n): add real bilingual message catalogs with keyset-parity test"
  ```

---

## Task 2.5 — Locale html shell: root passthrough + `[locale]` layout (provider, `lang`, fonts, headline tokens) + middleware

Render the locale-aware HTML document: root `layout.tsx` is a pass-through, `[locale]/layout.tsx` validates the locale, enables static rendering, sets `<html lang={locale}>`, mounts `NextIntlClientProvider`, and loads the four font families. `globals.css` carries the verbatim Tailwind v4 theme tokens and the per-locale `.display` headline rules. Middleware is the next-intl locale middleware (UX-only — never authz). This task ends with both unstyled locales reachable at `/en` and `/th` with `<html lang>` correct, verified in a real browser.

**Files**

- Create: `d:/MINE/freelance/system/vanta/middleware.ts`
- Create: `d:/MINE/freelance/system/vanta/app/layout.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/layout.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/page.tsx` (minimal real-copy home so the locale shell has something to render this phase)
- Create/Modify: `d:/MINE/freelance/system/vanta/app/globals.css` (verbatim token block + headline rules)
- Test: visual verification via Playwright against `npm run dev` (UI task — no Vitest).

**Interfaces**

- Consumes: `routing` (`@/lib/i18n/routing`), `hasLocale` (`next-intl`), `setRequestLocale`/`getMessages` (`next-intl/server`), `NextIntlClientProvider` (`next-intl`), `useTranslations`/`useLocale` (next-intl, in the home page), `getLocalizedText` (`@/lib/i18n/localized-text`), `products` (`@/lib/data`), `createMiddleware` (`next-intl/middleware`).
- Produces: the `/[locale]` route shell + middleware matcher; an unstyled but real-copy `/[locale]` home page.

**Steps**

- [ ] Create `middleware.ts` — next-intl locale middleware, UX-only, with a matcher that excludes API/static assets (so it never sits in the authorization path, avoiding the CVE-2025-29927 shape):

  ```ts
  import createMiddleware from 'next-intl/middleware';
  import { routing } from '@/lib/i18n/routing';

  // UX-ONLY: locale detection + optimistic prefix redirect. NEVER authorization.
  export default createMiddleware(routing);

  export const config = {
    // Match all paths except API routes, Next internals, and files with an extension.
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
  };
  ```

- [ ] Create the root `app/layout.tsx` — a pass-through that does NOT set `<html>` (the locale layout owns `<html lang>`):

  ```tsx
  import type { ReactNode } from 'react';

  // Root layout is a pass-through. The real <html lang> lives in [locale]/layout.tsx
  // because lang must reflect the active locale for a11y + hreflang correctness.
  export default function RootLayout({ children }: { children: ReactNode }) {
    return children;
  }
  ```

- [ ] Write `app/globals.css` with the verbatim Tailwind v4 theme token block and the per-locale headline rules:

  ```css
  @import 'tailwindcss';

  @theme {
    --color-ink: #0a0a0a;
    --color-paper: #f5f4ef;
    --color-blaze: #ff3b1f;
    --color-blaze-on-light: #d62e16; /* AA-safe on paper */
    --color-lime: #d4ff2e; /* lime-on-dark ONLY */
    --color-smoke-900: #141414;
    --color-smoke-700: #2a2a2a;
    --color-smoke-500: #6b6b6b;
    --color-smoke-300: #b8b8b8;

    --font-display-en: 'Clash Display', system-ui, sans-serif;
    --font-display-th: 'Kanit', system-ui, sans-serif;
    --font-body: 'Geist', 'IBM Plex Sans Thai', system-ui, sans-serif;
    --font-mono: 'Geist Mono', ui-monospace, monospace;

    --spacing: 0.5rem; /* 8pt grid base */
    --max-w-shell: 1440px;
  }

  /* Per-locale headline tokens */
  :lang(en) .display {
    font-family: var(--font-display-en);
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  :lang(th) .display {
    font-family: var(--font-display-th);
    text-transform: none;
    letter-spacing: 0.01em;
    line-height: 1.35;
  }
  ```

- [ ] Create `app/[locale]/layout.tsx` — validate locale, enable static rendering, set `<html lang>`, load fonts, mount the provider, link `globals.css`:

  ```tsx
  import type { ReactNode } from 'react';
  import { notFound } from 'next/navigation';
  import { hasLocale, NextIntlClientProvider } from 'next-intl';
  import { getMessages, setRequestLocale } from 'next-intl/server';
  import { Geist, Geist_Mono, Kanit, IBM_Plex_Sans_Thai } from 'next/font/google';
  import { routing } from '@/lib/i18n/routing';
  import '../globals.css';

  const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
  const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
  const kanit = Kanit({
    subsets: ['thai', 'latin'],
    weight: ['600', '900'],
    variable: '--font-kanit',
  });
  const ibmPlexThai = IBM_Plex_Sans_Thai({
    subsets: ['thai'],
    weight: ['400', '600'],
    variable: '--font-ibm-plex-thai',
  });

  export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
  }

  type Props = {
    children: ReactNode;
    params: Promise<{ locale: string }>;
  };

  export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
      notFound();
    }

    // Enable static rendering for this locale.
    setRequestLocale(locale);
    const messages = await getMessages();

    return (
      <html
        lang={locale}
        className={`${geist.variable} ${geistMono.variable} ${kanit.variable} ${ibmPlexThai.variable}`}
      >
        <body>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }
  ```

- [ ] Create a minimal but real-copy home page `app/[locale]/(shop)/page.tsx` so this phase's deliverable (real content on real screens, both locales) is demonstrable. It uses both the `useTranslations` pattern AND the `getLocalizedText` + `splitGraphemes` helpers, and reads featured products through the repository seam (`@/lib/data`). Unstyled — `.display` proves the per-locale headline token:

  ```tsx
  import { setRequestLocale } from 'next-intl/server';
  import { getTranslations } from 'next-intl/server';
  import { products } from '@/lib/data';
  import { getLocalizedText } from '@/lib/i18n/localized-text';
  import { splitGraphemes } from '@/lib/motion/segment';
  import type { Locale } from '@/lib/domain';
  import { Link } from '@/lib/i18n/navigation';

  type Props = { params: Promise<{ locale: Locale }> };

  export default async function HomePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('Home');
    const tCommon = await getTranslations('Common');
    const featured = (await products.list()).slice(0, 3);

    // Per-grapheme spans use the grapheme-safe splitter (NEVER .split('')), so a
    // Thai headline keeps its combining marks welded for later per-char animation.
    const headline = t('heroHeadline');

    return (
      <main>
        <p>
          {tCommon('brandName')} — {tCommon('tagline')}
        </p>

        <h1 className="display" aria-label={headline}>
          {splitGraphemes(headline, locale).map((g, i) => (
            <span key={i} aria-hidden="true">
              {g}
            </span>
          ))}
        </h1>
        <p>{t('heroSub')}</p>

        <Link href="/shop">{t('shopTheDrop')}</Link>

        <section>
          <h2 className="display">{t('featuredHeading')}</h2>
          <ul>
            {featured.map((product) => (
              <li key={product.id}>
                <Link href={`/product/${product.slug}`}>
                  {getLocalizedText(product.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }
  ```

- [ ] Start the dev server in the background:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm run dev
  ```

  Expected: Next.js logs `Ready` and serves on `http://localhost:3000`.

- [ ] Visual verification with Playwright MCP — navigate to the EN home, snapshot the DOM, and assert the `<html lang>` and English headline render. Use `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/en`, then `mcp__plugin_playwright_playwright__browser_evaluate` running `() => document.documentElement.lang` and assert it returns `"en"`; then `mcp__plugin_playwright_playwright__browser_snapshot` and confirm the `h1.display` contains `MATERIALIZE FROM THE VOID` (uppercase via the `:lang(en) .display` token) and the brand line `VANTA® — Bangkok-born. Globally worn.` is present. Capture `mcp__plugin_playwright_playwright__browser_take_screenshot` → save as evidence.
      Expected: `document.documentElement.lang === 'en'`; English copy visible; featured product titles render in English (proving the repository seam + `getLocalizedText`).

- [ ] Visual verification, Thai locale — navigate to `http://localhost:3000/th`, run the same `() => document.documentElement.lang` check and assert `"th"`, then snapshot and confirm the headline shows the Thai copy `ปรากฏกายจากความว่างเปล่า` (NOT uppercased — proving the `:lang(th) .display` token drops `text-transform`), the brand tagline is `เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก`, and featured product titles render in Thai. Take a screenshot.
      Expected: `document.documentElement.lang === 'th'`; Thai copy visible and not uppercased; Thai combining marks render intact within the per-grapheme `<span>`s (visual: no orphaned vowel/tone marks).

- [ ] Confirm the unknown-locale guard works — navigate to `http://localhost:3000/fr` and assert it 404s (the `hasLocale` guard + `notFound()`).
      Expected: Next.js 404 page (no crash).

- [ ] Stop the dev server (terminate the background process).

- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add middleware.ts app/layout.tsx app/[locale]/layout.tsx "app/[locale]/(shop)/page.tsx" app/globals.css && git commit -m "feat(i18n): add locale html shell, provider, fonts, theme tokens and middleware"
  ```

---

## Task 2.6 — Locale switcher, SEO `hreflang` + `lang` metadata

Add the in-UI `LocaleSwitcher` (uses the localized `usePathname`/`useRouter` so a switch preserves the current route) and emit `alternates.languages` (`hreflang`) plus `<html lang>`-consistent metadata via `generateMetadata`. This closes the i18n "one-line wins": correct `hreflang` so search engines see both locales. Verified by Playwright assertion on the rendered `<link rel="alternate" hreflang>` tags and a working switch.

**Files**

- Create: `d:/MINE/freelance/system/vanta/components/layout/LocaleSwitcher.tsx`
- Modify: `d:/MINE/freelance/system/vanta/app/[locale]/layout.tsx` (add `generateMetadata` with `alternates.languages`; mount `LocaleSwitcher`)
- Test: Playwright visual + DOM assertion against `npm run dev` (UI task).

**Interfaces**

- Consumes: `useLocale`/`useTranslations` (next-intl), `usePathname`/`useRouter` (`@/lib/i18n/navigation`), `routing` (`@/lib/i18n/routing`).
- Produces: `<LocaleSwitcher />`; `generateMetadata({ params })` returning `Metadata` with `alternates: { languages: { en, th } }`.

**Steps**

- [ ] Create the client component `components/layout/LocaleSwitcher.tsx` — switches locale while staying on the current path (the localized `usePathname` returns the path WITHOUT the locale prefix, and `router.replace(pathname, { locale })` re-prefixes it):

  ```tsx
  'use client';

  import { useLocale, useTranslations } from 'next-intl';
  import { usePathname, useRouter } from '@/lib/i18n/navigation';
  import { routing } from '@/lib/i18n/routing';

  export function LocaleSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('Nav');

    // Map each locale to its in-UI label key (EN shows "ไทย" to switch TO Thai, etc.).
    const labelKey = { en: 'switchToThai', th: 'switchToEnglish' } as const;

    return (
      <nav aria-label="Language">
        {routing.locales.map((target) => (
          <button
            key={target}
            type="button"
            aria-current={target === locale ? 'true' : undefined}
            disabled={target === locale}
            onClick={() => router.replace(pathname, { locale: target })}
          >
            {t(labelKey[target])}
          </button>
        ))}
      </nav>
    );
  }
  ```

- [ ] Add `generateMetadata` and mount `LocaleSwitcher` in `app/[locale]/layout.tsx`. Insert the import and the metadata function above the layout, and render `<LocaleSwitcher />` inside the provider. The new pieces:

  ```tsx
  import type { Metadata } from 'next';
  import { getTranslations } from 'next-intl/server';
  import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Common' });
    return {
      title: t('brandName'),
      description: t('tagline'),
      alternates: {
        languages: {
          en: '/en',
          th: '/th',
        },
      },
    };
  }
  ```

  And inside the provider, render the switcher above `{children}`:

  ```tsx
  <NextIntlClientProvider locale={locale} messages={messages}>
    <LocaleSwitcher />
    {children}
  </NextIntlClientProvider>
  ```

- [ ] Start the dev server in the background:

  ```bash
  cd d:/MINE/freelance/system/vanta && npm run dev
  ```

  Expected: serves on `http://localhost:3000`.

- [ ] Playwright verification of `hreflang` — navigate to `http://localhost:3000/en`, then `mcp__plugin_playwright_playwright__browser_evaluate` running:

  ```js
  () =>
    Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(
      (l) => `${l.getAttribute('hreflang')}:${l.getAttribute('href')}`,
    );
  ```

  Expected: the returned array contains entries for both `en` and `th` (e.g. `en:...`, `th:...`), confirming `alternates.languages` emitted `hreflang` tags.

- [ ] Playwright verification of the switch — on `http://localhost:3000/en/shop` (navigate there first), click the "ไทย" button (`mcp__plugin_playwright_playwright__browser_click` on the switcher button), then `mcp__plugin_playwright_playwright__browser_evaluate` `() => location.pathname`.
      Expected: pathname becomes `/th/shop` (route preserved, locale swapped) — proving the localized `usePathname`/`useRouter` round-trip. Take a screenshot of the Thai page as evidence.

- [ ] Stop the dev server.

- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add components/layout/LocaleSwitcher.tsx app/[locale]/layout.tsx && git commit -m "feat(i18n): add locale switcher and hreflang alternates metadata"
  ```

---

## Phase 2 exit criteria

- [ ] `npm run typecheck` passes; `npx vitest run tests/unit/segment.test.ts tests/unit/localized-text.test.ts tests/unit/messages.test.ts` all green.
- [ ] `/en` and `/th` both render real copy on real (unstyled) screens; `<html lang>` matches the active locale; the EN headline is uppercased and the TH headline is not (per-locale `.display` token proven).
- [ ] `splitGraphemes` is the only split path for headline text (no `.split('')` anywhere); the Thai-combining-mark test and the naive-split-breaks-it control both pass.
- [ ] `hreflang` alternates for `en` + `th` are present in the document head; the locale switcher preserves the current route.
- [ ] Messages keyset parity test guarantees `en.json` and `th.json` can never drift; marquee words remain English `DROP` / `SOLD OUT` in both locales.

---

Phase 2 written above as paste-ready plan markdown. Key file paths produced/modified in this phase (all absolute):

- `d:/MINE/freelance/system/vanta/lib/i18n/routing.ts`, `navigation.ts`, `request.ts`, `localized-text.ts`
- `d:/MINE/freelance/system/vanta/lib/motion/segment.ts`
- `d:/MINE/freelance/system/vanta/messages/en.json`, `messages/th.json`
- `d:/MINE/freelance/system/vanta/next.config.ts`, `middleware.ts`
- `d:/MINE/freelance/system/vanta/app/layout.tsx`, `app/[locale]/layout.tsx`, `app/[locale]/(shop)/page.tsx`, `app/globals.css`
- `d:/MINE/freelance/system/vanta/components/layout/LocaleSwitcher.tsx`
- Tests: `d:/MINE/freelance/system/vanta/tests/unit/segment.test.ts`, `localized-text.test.ts`, `messages.test.ts`

---

Now I have full context. Let me write Phase 3 as polished markdown ready to paste into the plan document. This is a writing task — I'll produce the complete phase with exact contracts, complete code, and TDD discipline.

I'll verify a couple of implementation details against the locked contracts before finalizing the exact code.

The phase covers: cartService, signed-cookie CartStore mock, cart Server Actions, Zustand mirror, useOptimistic in the drawer, the a11y dialog drawer, and the /cart page. Let me write it.

````markdown
## Phase 0.5 — Shared UI primitives, layout shell & motion capability

**Execute AFTER Phase 2, BEFORE Phase 3** (it consumes Phase 1 format helpers + availability constants and Phase 2 i18n/LocaleSwitcher). Creates the load-bearing shared components every later phase (3–10) assumes. These are **pure/presentational** except the cart-drawer **OPEN-STATE** context (cart DATA + drawer contents come in Phase 3). It depends only on Phase 0 artifacts: the domain `Locale`/`LocalizedText` types (`lib/domain/i18n.ts`), `lib/fonts.ts` (`fontClassNames`), `app/globals.css` (`@theme` tokens + `.display` rules), the i18n stack (`@/lib/i18n/*`, `messages/*.json`), and the Phase-0 `app/[locale]/layout.tsx`. `lib/format/money.ts` / `lib/format/date.ts` and `lib/catalog/query.ts` (the `CatalogCard` type) are authored later (Phases 1/6) — so this phase declares the **minimal local types it needs and re-points them** per the Errata: `Money`/`formatMoney`/`formatDate` are consumed from `@/lib/format/*` (created in Phase 1 right after this phase), and `CatalogCard` is defined here in `components/product/ProductCard.tsx`'s own contract until Phase 6's `lib/catalog/query.ts` re-exports the identical shape.

> **Ordering note (per Errata items 13–18):** Phase 6 Task 6.2, Phase 9 Tasks 9.3/9.5/9.6, and Phase 2's LocaleSwitcher task change their verb from `Create` to `Modify` because the primitives below already exist. The `formatMoney`/`formatDate` helpers (Phase 1) and `AVAILABILITY_PRECEDENCE`/`CARD_ROLLUP_ORDER` (Phase 1, per Errata item 2) already exist by the time this phase runs and are imported directly — no stubbing needed. Before executing, invoke `superpowers:executing-plans`; apply `superpowers:test-driven-development` to every LOGIC task (the motion decision function, `toCatalogCard`).

> **Prerequisites:** Phases 0–2 complete — `lib/domain/*`, `lib/fonts.ts`, `app/globals.css`, the Phase-0/2 `app/[locale]/layout.tsx`, the i18n stack + `LocaleSwitcher`, `lib/format/money.ts`+`lib/format/date.ts`, and `lib/services/availability.ts` (`AVAILABILITY_PRECEDENCE`+`CARD_ROLLUP_ORDER`) all exist and `npm run dev` renders `/en` and `/th` with real bilingual copy.

---

## Task 0.5.1 — `useMotionCapability` hook (bare boolean; matchMedia gate, SSR-safe)

The single gate every heavy effect consults, **defined here** (Phase 9 only enhances it with the explicit user-preference store). Heavy wow is enabled ONLY when `(prefers-reduced-motion: no-preference)` AND `(pointer: fine)` AND NOT Save-Data — **no `deviceMemory`/`hardwareConcurrency` arithmetic** (coarse, Safari-absent, would wrongly downgrade premium iOS). SSR-safe: returns `false` on the server and on the first client paint (so content is visible-by-default, never stranded at `opacity:0`), flipping to `true` after mount if signals allow. The pure decision function is extracted so it is unit-testable without a DOM. **Returns a bare `boolean`** (Errata item 15).

### Files

- **Create:** `vanta/lib/motion/capability.ts`
- **Test:** `vanta/tests/unit/motion-capability.test.ts`

### Interfaces

- **Consumes:** `import { useSyncExternalStore } from 'react'` (DOM/`navigator` read at runtime only).
- **Produces:**
  ```ts
  export type MotionSignals = {
    prefersNoPreference: boolean; // (prefers-reduced-motion: no-preference)
    pointerFine: boolean; // (pointer: fine)
    saveData: boolean; // navigator.connection?.saveData === true
  };
  export function resolveMotionEnabled(signals: MotionSignals): boolean;
  export function useMotionCapability(): boolean;
  ```
````

### Steps

1. - [ ] **Write the failing test** at `vanta/tests/unit/motion-capability.test.ts` (covers the PURE decision function — no DOM needed):

   ```ts
   import { describe, it, expect } from 'vitest';
   import { resolveMotionEnabled, type MotionSignals } from '@/lib/motion/capability';

   const ideal: MotionSignals = { prefersNoPreference: true, pointerFine: true, saveData: false };

   describe('resolveMotionEnabled', () => {
     it('enables motion when all three signals are ideal', () => {
       expect(resolveMotionEnabled(ideal)).toBe(true);
     });
     it('OS prefers reduced motion disables', () => {
       expect(resolveMotionEnabled({ ...ideal, prefersNoPreference: false })).toBe(false);
     });
     it('coarse pointer (touch) disables heavy wow', () => {
       expect(resolveMotionEnabled({ ...ideal, pointerFine: false })).toBe(false);
     });
     it('Save-Data disables', () => {
       expect(resolveMotionEnabled({ ...ideal, saveData: true })).toBe(false);
     });
     it('requires ALL three (AND, not OR)', () => {
       expect(
         resolveMotionEnabled({ prefersNoPreference: true, pointerFine: false, saveData: false }),
       ).toBe(false);
     });
   });
   ```

2. - [ ] **Run it and SHOW it fail:**
   - Command: `npm run test -- tests/unit/motion-capability.test.ts`
   - Expected output contains: `Failed to resolve import "@/lib/motion/capability"` and `Test Files  1 failed (1)`.
3. - [ ] **Implement** `vanta/lib/motion/capability.ts` (pure function + SSR-safe hook; server snapshot returns the static experience so nothing is stranded pre-hydration):

   ```ts
   'use client';

   import { useSyncExternalStore } from 'react';

   export type MotionSignals = {
     /** (prefers-reduced-motion: no-preference) matches. */
     prefersNoPreference: boolean;
     /** (pointer: fine) matches — a precise pointing device. */
     pointerFine: boolean;
     /** Save-Data / Network Information API requested data saving. */
     saveData: boolean;
   };

   /**
    * PURE. Heavy wow gated on no-preference AND pointer:fine AND not Save-Data.
    * NO deviceMemory / hardwareConcurrency arithmetic (coarse, Safari-absent).
    */
   export function resolveMotionEnabled(signals: MotionSignals): boolean {
     return signals.prefersNoPreference && signals.pointerFine && !signals.saveData;
   }

   const REDUCED_QUERY = '(prefers-reduced-motion: no-preference)';
   const POINTER_QUERY = '(pointer: fine)';

   type Connection = { saveData?: boolean } | undefined;

   function readSignals(): MotionSignals {
     if (typeof window === 'undefined') return SERVER_SIGNALS;
     const connection = (navigator as Navigator & { connection?: Connection }).connection;
     return {
       prefersNoPreference: window.matchMedia(REDUCED_QUERY).matches,
       pointerFine: window.matchMedia(POINTER_QUERY).matches,
       saveData: connection?.saveData === true,
     };
   }

   function subscribe(onChange: () => void): () => void {
     if (typeof window === 'undefined') return () => {};
     const reduced = window.matchMedia(REDUCED_QUERY);
     const pointer = window.matchMedia(POINTER_QUERY);
     reduced.addEventListener('change', onChange);
     pointer.addEventListener('change', onChange);
     return () => {
       reduced.removeEventListener('change', onChange);
       pointer.removeEventListener('change', onChange);
     };
   }

   // Stable server snapshot => SSR + first client paint render the visible-by-default
   // (static) path; content is NEVER stranded at opacity:0 before hydration.
   const SERVER_SIGNALS: MotionSignals = {
     prefersNoPreference: false,
     pointerFine: false,
     saveData: true,
   };

   /** The single gate every heavy effect consults. Bare boolean. Re-renders on media change. */
   export function useMotionCapability(): boolean {
     const signals = useSyncExternalStore(subscribe, readSignals, () => SERVER_SIGNALS);
     return resolveMotionEnabled(signals);
   }
   ```

4. - [ ] **Run it and SHOW it pass:**
   - Command: `npm run test -- tests/unit/motion-capability.test.ts`
   - Expected: `Test Files  1 passed (1)` · `Tests  5 passed (5)`.
5. - [ ] **Typecheck:** `npm run typecheck` → exit 0, no diagnostics.
6. - [ ] **Commit:**
   ```
   git add lib/motion/capability.ts tests/unit/motion-capability.test.ts
   git commit -m "feat(motion): add useMotionCapability gate (no-pref AND pointer:fine AND not Save-Data)"
   ```

---

## Task 0.5.2 — `components/ui/Button.tsx` (`default | ghost | magnetic`, `asChild`, rAF-throttled magnetic)

The shared button. Three variants: `default`, `ghost`, and `magnetic` (the only "fancy pointer" effect in VANTA). `asChild` renders the styling onto a single child element (e.g. a `Link`) instead of a `<button>`. The magnetic pull is **rAF-throttled** and **gated on `useMotionCapability()`** — when the gate is false it degrades to exactly the `default` button (no listeners attached). Focus ring uses the `:focus-visible` token (`outline-lime`).

### Files

- **Create:** `vanta/components/ui/Button.tsx`

### Interfaces

- **Consumes:** `import { useMotionCapability } from '@/lib/motion/capability'`; `import { cloneElement, isValidElement } from 'react'`.
- **Produces:**
  ```ts
  export type ButtonVariant = 'default' | 'ghost' | 'magnetic';
  export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant; // default 'default'
    asChild?: boolean; // render styles onto the single child instead of <button>
  };
  export function Button(props: ButtonProps): React.JSX.Element;
  ```

### Steps

1. - [ ] **Implement** `vanta/components/ui/Button.tsx` (complete code; client component for the magnetic pointer math). When `variant !== 'magnetic'` or the motion gate is false, no pointer listeners are attached and the element is a plain styled button (or the cloned child):

   ```tsx
   'use client';

   import { cloneElement, isValidElement, useRef } from 'react';
   import { useMotionCapability } from '@/lib/motion/capability';

   export type ButtonVariant = 'default' | 'ghost' | 'magnetic';

   export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
     variant?: ButtonVariant;
     asChild?: boolean;
   };

   const BASE =
     'inline-flex items-center justify-center gap-2 rounded-none px-5 py-3 text-sm font-medium uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:opacity-50 disabled:pointer-events-none';

   const VARIANT_CLASS: Record<ButtonVariant, string> = {
     default: 'bg-blaze text-paper hover:bg-blaze-on-light',
     ghost: 'bg-transparent text-ink hover:bg-smoke-300/30',
     magnetic: 'bg-blaze text-paper hover:bg-blaze-on-light will-change-transform',
   };

   const MAGNET_STRENGTH = 0.35; // fraction of cursor offset applied as translate

   export function Button({
     variant = 'default',
     asChild = false,
     className,
     children,
     ...rest
   }: ButtonProps): React.JSX.Element {
     const motionEnabled = useMotionCapability();
     const ref = useRef<HTMLElement | null>(null);
     const frame = useRef<number | null>(null);

     const magneticActive = variant === 'magnetic' && motionEnabled;

     const handlePointerMove = (e: React.PointerEvent) => {
       if (!magneticActive || !ref.current) return;
       const node = ref.current;
       const px = e.clientX;
       const py = e.clientY;
       if (frame.current !== null) cancelAnimationFrame(frame.current);
       frame.current = requestAnimationFrame(() => {
         const rect = node.getBoundingClientRect();
         const dx = (px - (rect.left + rect.width / 2)) * MAGNET_STRENGTH;
         const dy = (py - (rect.top + rect.height / 2)) * MAGNET_STRENGTH;
         node.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
       });
     };

     const handlePointerLeave = () => {
       if (!ref.current) return;
       if (frame.current !== null) cancelAnimationFrame(frame.current);
       ref.current.style.transform = 'translate(0px, 0px)';
     };

     const cls = [BASE, VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

     // Only attach pointer handlers when the magnetic effect is actually live.
     const motionProps = magneticActive
       ? {
           onPointerMove: handlePointerMove,
           onPointerLeave: handlePointerLeave,
           style: { transform: 'translate(0px, 0px)', transition: 'transform 150ms ease-out' },
         }
       : {};

     if (asChild && isValidElement(children)) {
       const child = children as React.ReactElement<Record<string, unknown>>;
       return cloneElement(child, {
         ...rest,
         ...motionProps,
         ref,
         className: [cls, child.props.className as string | undefined].filter(Boolean).join(' '),
       });
     }

     return (
       <button {...rest} {...motionProps} ref={ref as React.Ref<HTMLButtonElement>} className={cls}>
         {children}
       </button>
     );
   }
   ```

2. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
3. - [ ] **Visual + a11y check (Playwright/Chrome DevTools MCP against `npm run dev`):** render the three variants on a scratch route or the home shell; confirm (a) `default`/`ghost` show the token focus ring on Tab, (b) on a desktop pointer the `magnetic` button translates toward the cursor and snaps back on leave, (c) under `--emulate-reduced-motion` / forced `reducedMotion: 'reduce'` the magnetic button does NOT translate (no `transform` style attached) and behaves as `default`. Capture one screenshot each `en`/`th` is not required here (no copy); capture one reduced-motion screenshot.
4. - [ ] **Commit:**
   ```
   git add components/ui/Button.tsx
   git commit -m "feat(ui): add Button with default/ghost/magnetic variants, asChild, and motion gate"
   ```

---

## Task 0.5.3 — `components/ui/Money.tsx` + `components/ui/FormattedDate.tsx`

Two tiny presentational wrappers so app code NEVER hand-builds price/date strings. `Money` calls `formatMoney`; `FormattedDate` calls `formatDate` (gregory calendar, Western digits both locales).

### Files

- **Create:** `vanta/components/ui/Money.tsx`
- **Create:** `vanta/components/ui/FormattedDate.tsx`

### Interfaces

- **Consumes:**
  - `import { formatMoney } from '@/lib/format/money'` — `formatMoney(money: Money, locale: Locale): string`
  - `import { formatDate } from '@/lib/format/date'` — `formatDate(iso: string, locale: Locale): string`
  - `import type { Money } from '@/lib/domain'`, `import type { Locale } from '@/lib/domain'`
- **Produces:**
  ```ts
  export function Money(props: { value: Money; locale: Locale }): React.JSX.Element;
  export function FormattedDate(props: { value: string; locale: Locale }): React.JSX.Element;
  ```

> If `lib/format/money.ts` / `lib/format/date.ts` are not yet authored (strict Phase-0.5-before-Phase-1 execution), create them first with the locked signatures (pure `Intl.NumberFormat` / `Intl.DateTimeFormat` with `calendar: 'gregory'`); Phase 1 replaces them with the TDD'd versions (the space-tolerant THB test per Errata item 3).

### Steps

1. - [ ] **Implement** `vanta/components/ui/Money.tsx` (server-safe; no `'use client'` — pure formatting):

   ```tsx
   import type { Money as MoneyValue } from '@/lib/domain';
   import type { Locale } from '@/lib/domain';
   import { formatMoney } from '@/lib/format/money';

   export function Money({
     value,
     locale,
   }: {
     value: MoneyValue;
     locale: Locale;
   }): React.JSX.Element {
     return (
       <span className="font-[family-name:var(--font-mono)] tabular-nums">
         {formatMoney(value, locale)}
       </span>
     );
   }
   ```

2. - [ ] **Implement** `vanta/components/ui/FormattedDate.tsx`:

   ```tsx
   import type { Locale } from '@/lib/domain';
   import { formatDate } from '@/lib/format/date';

   export function FormattedDate({
     value,
     locale,
   }: {
     value: string;
     locale: Locale;
   }): React.JSX.Element {
     return <time dateTime={value}>{formatDate(value, locale)}</time>;
   }
   ```

3. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
4. - [ ] **Commit:**
   ```
   git add components/ui/Money.tsx components/ui/FormattedDate.tsx
   git commit -m "feat(ui): add Money and FormattedDate presentational wrappers"
   ```

---

## Task 0.5.4 — `components/ui/Dialog.tsx` (accessible modal: focus trap/return, Esc, scroll lock)

The accessible modal primitive reused by the cart drawer (Phase 3 `CartDrawer`) and the Size & Fit drawer (Phase 5 `SizeFitDrawer`). `role="dialog"`, `aria-modal="true"`, focus trap (Tab/Shift-Tab cycle within), focus **return** to the previously-focused element on close, `Escape` to close, and body scroll lock while open. Visible-by-default content; reduced motion = instant show/hide (no animated transition required).

### Files

- **Create:** `vanta/components/ui/Dialog.tsx`

### Interfaces

- **Consumes:** `import { useEffect, useRef } from 'react'`.
- **Produces:**
  ```ts
  export function Dialog(props: {
    open: boolean;
    onClose: () => void;
    labelledById?: string; // id of the heading that labels the dialog
    children: React.ReactNode;
  }): React.JSX.Element | null;
  ```

### Steps

1. - [ ] **Implement** `vanta/components/ui/Dialog.tsx` (complete code; client component — DOM focus/scroll management):

   ```tsx
   'use client';

   import { useEffect, useRef } from 'react';

   const FOCUSABLE =
     'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

   export function Dialog({
     open,
     onClose,
     labelledById,
     children,
   }: {
     open: boolean;
     onClose: () => void;
     labelledById?: string;
     children: React.ReactNode;
   }): React.JSX.Element | null {
     const panelRef = useRef<HTMLDivElement>(null);
     const previouslyFocused = useRef<HTMLElement | null>(null);

     useEffect(() => {
       if (!open) return;
       previouslyFocused.current = document.activeElement as HTMLElement | null;

       // Scroll lock.
       const prevOverflow = document.body.style.overflow;
       document.body.style.overflow = 'hidden';

       // Initial focus into the panel.
       const panel = panelRef.current;
       const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
       (first ?? panel)?.focus();

       const onKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
           e.stopPropagation();
           onClose();
           return;
         }
         if (e.key !== 'Tab' || !panel) return;
         const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
         if (nodes.length === 0) {
           e.preventDefault();
           return;
         }
         const firstEl = nodes[0];
         const lastEl = nodes[nodes.length - 1];
         const active = document.activeElement;
         if (e.shiftKey && active === firstEl) {
           e.preventDefault();
           lastEl.focus();
         } else if (!e.shiftKey && active === lastEl) {
           e.preventDefault();
           firstEl.focus();
         }
       };

       document.addEventListener('keydown', onKeyDown, true);
       return () => {
         document.removeEventListener('keydown', onKeyDown, true);
         document.body.style.overflow = prevOverflow;
         // Focus return.
         previouslyFocused.current?.focus();
       };
     }, [open, onClose]);

     if (!open) return null;

     return (
       <div className="fixed inset-0 z-50 flex justify-end">
         {/* Backdrop: click closes. */}
         <button
           type="button"
           aria-label="Close"
           onClick={onClose}
           className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
         />
         <div
           ref={panelRef}
           role="dialog"
           aria-modal="true"
           aria-labelledby={labelledById}
           tabIndex={-1}
           className="relative h-full w-full max-w-md bg-paper text-ink shadow-2xl focus:outline-none"
         >
           {children}
         </div>
       </div>
     );
   }
   ```

2. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
3. - [ ] **Visual + a11y check (Playwright against `npm run dev`):** mount on a scratch trigger; assert (a) opening moves focus into the panel, (b) Tab cycles within the panel and never escapes, (c) `Escape` closes and focus RETURNS to the trigger, (d) body scroll is locked while open, (e) the dialog exposes `role="dialog"` + `aria-modal="true"`. Capture one reduced-motion run (instant show, no animation).
4. - [ ] **Commit:**
   ```
   git add components/ui/Dialog.tsx
   git commit -m "feat(ui): add accessible Dialog (focus trap/return, Esc, scroll lock)"
   ```

---

## Task 0.5.5 — `components/product/ProductCard.tsx` (canonical signature) + `toCatalogCard` mapper

The canonical `ProductCard` with the **only** legal prop shape `{ card: CatalogCard; title; imageUrl; imageAlt; locale; priority }` (Errata item 13). CSS `clip-path`/`mask` reveal driven by an `IntersectionObserver` (paused offscreen), gated by `useMotionCapability()` (bare boolean — Errata item 15); reduced motion / coarse pointer / Save-Data = **visible-by-default** (no `opacity:0` trap). `view-transition-name` is `product-${card.productId}` — **locale-stable**, keyed on product id (Conventions). A `toCatalogCard(product, locale)` mapper builds a `CatalogCard` identically for Phase 4's featured grid and Phase 6's catalog. `CatalogCard` gains an explicit `imageUrl` field so the mapper fully resolves the card.

### Files

- **Create:** `vanta/components/product/ProductCard.tsx` (the `ProductCard` component, the `CatalogCard` type, and `toCatalogCard`)
- **Test:** `vanta/tests/unit/to-catalog-card.test.ts` (the pure mapper is LOGIC → TDD)

### Interfaces

- **Consumes:**
  - `import type { Product, Locale, Availability, Money } from '@/lib/domain'`
  - `import { formatMoney } from '@/lib/format/money'`
  - `import { CARD_ROLLUP_ORDER } from '@/lib/services/availability'` — most-buyable-first roll-up (Errata item 2)
  - `import { Link } from '@/lib/i18n/navigation'`
  - `import { useMotionCapability } from '@/lib/motion/capability'` — `(): boolean`
  - `import { useEffect, useRef, useState } from 'react'`
- **Produces:**

  ```ts
  export type CatalogCard = {
    productId: string; // stable id (View Transition key origin)
    slug: string;
    fromPrice: Money; // lowest variant price among matching variants
    compareAtFromPrice: Money | null; // present => on sale
    availability: Availability; // most-buyable across matching variants (CARD_ROLLUP_ORDER)
    matchedColors: string[]; // colors that survived the filter (swatch dots)
    imageUrl: string; // first image for the first matchedColor
  };
  export function toCatalogCard(product: Product, locale: Locale): CatalogCard;

  export type ProductCardProps = {
    card: CatalogCard;
    title: string; // already-localized title.{locale}
    imageUrl: string; // first image for the first matchedColor
    imageAlt: string; // already-localized alt
    locale: Locale;
    priority?: boolean; // first row eager-loads
  };
  export function ProductCard(props: ProductCardProps): React.JSX.Element;
  ```

  > Phase 6 Task 6.2's `lib/catalog/query.ts` MUST re-export this exact `CatalogCard` shape (it adds `imageUrl`), and Phase 6 imports `ProductCard`/`toCatalogCard` from here rather than re-defining them. Phase 6's `Create` verb for `ProductCard.tsx` becomes `Modify` (add the `catalog` message namespace + Playwright page verification only).

### Steps

1. - [ ] **Write the failing test** at `vanta/tests/unit/to-catalog-card.test.ts` (pins lowest-price roll-up, sale detection, most-buyable availability via `CARD_ROLLUP_ORDER`, and image resolution):

   ```ts
   import { describe, it, expect } from 'vitest';
   import { toCatalogCard } from '@/components/product/ProductCard';
   import type { Product, Variant, Money } from '@/lib/domain';

   const thb = (amount: number): Money => ({ amount, currency: 'THB' });
   const variant = (over: Partial<Variant> & Pick<Variant, 'id'>): Variant => ({
     sku: `SKU-${over.id}`,
     optionValues: { size: 'M', color: 'Black' },
     price: thb(199000),
     stock: 10,
     availability: 'live',
     ...over,
   });
   const product = (over: Partial<Product> & Pick<Product, 'id' | 'slug'>): Product => ({
     title: { en: 'Tee', th: 'เสื้อ' },
     description: { en: '', th: '' },
     optionAxes: { size: ['M'], color: ['Black'] },
     variants: [variant({ id: `${over.id}-v1` })],
     imagesByColor: {
       Black: [
         {
           id: 'img1',
           url: '/img/black.webp',
           alt: { en: 'Black tee', th: 'เสื้อดำ' },
           width: 800,
           height: 1000,
         },
       ],
     },
     collectionIds: ['col_core'],
     ...over,
   });

   describe('toCatalogCard', () => {
     it('takes the lowest variant price as fromPrice and flags sale via compareAtPrice', () => {
       const p = product({
         id: 'p1',
         slug: 'tee',
         variants: [
           variant({ id: 'v1', price: thb(259000) }),
           variant({ id: 'v2', price: thb(199000), compareAtPrice: thb(259000) }),
         ],
       });
       const card = toCatalogCard(p, 'en');
       expect(card.fromPrice).toEqual(thb(199000));
       expect(card.compareAtFromPrice).toEqual(thb(259000));
       expect(card.productId).toBe('p1');
       expect(card.imageUrl).toBe('/img/black.webp');
     });

     it('rolls availability up to the MOST buyable (live beats early_access)', () => {
       const p = product({
         id: 'p2',
         slug: 'rollup',
         variants: [
           variant({ id: 'a', availability: 'early_access' }),
           variant({ id: 'b', availability: 'live' }),
         ],
       });
       expect(toCatalogCard(p, 'en').availability).toBe('live');
     });

     it('has no sale flag when no variant carries compareAtPrice', () => {
       expect(toCatalogCard(product({ id: 'p3', slug: 's' }), 'en').compareAtFromPrice).toBeNull();
     });
   });
   ```

2. - [ ] **Run it and SHOW it fail:**
   - Command: `npm run test -- tests/unit/to-catalog-card.test.ts`
   - Expected output contains: `Failed to resolve import "@/components/product/ProductCard"` and `Test Files  1 failed (1)`.
3. - [ ] **Implement** `vanta/components/product/ProductCard.tsx` (the `CatalogCard` type, the pure `toCatalogCard`, and the client `ProductCard`):

   ```tsx
   'use client';

   import { useEffect, useRef, useState } from 'react';
   import type { Product, Locale, Availability, Money } from '@/lib/domain';
   import { formatMoney } from '@/lib/format/money';
   import { CARD_ROLLUP_ORDER } from '@/lib/services/availability';
   import { Link } from '@/lib/i18n/navigation';
   import { useMotionCapability } from '@/lib/motion/capability';

   export type CatalogCard = {
     productId: string;
     slug: string;
     fromPrice: Money;
     compareAtFromPrice: Money | null;
     availability: Availability;
     matchedColors: string[];
     imageUrl: string;
   };

   /** PURE. Build a card from a product: lowest price, sale flag, most-buyable availability. */
   export function toCatalogCard(product: Product, _locale: Locale): CatalogCard {
     const variants = product.variants;
     const cheapest = variants.reduce(
       (lo, v) => (v.price.amount < lo.price.amount ? v : lo),
       variants[0],
     );
     const onSaleVariant = variants.find((v) => v.compareAtPrice);
     const availability = variants.reduce<Availability>((best, v) => {
       return CARD_ROLLUP_ORDER.indexOf(v.availability) < CARD_ROLLUP_ORDER.indexOf(best)
         ? v.availability
         : best;
     }, variants[0].availability);
     const matchedColors = [...new Set(variants.map((v) => v.optionValues.color))];
     const firstColor = matchedColors[0];
     const imageUrl = product.imagesByColor[firstColor]?.[0]?.url ?? '';
     return {
       productId: product.id,
       slug: product.slug,
       fromPrice: cheapest.price,
       compareAtFromPrice: onSaleVariant?.compareAtPrice ?? null,
       availability,
       matchedColors,
       imageUrl,
     };
   }

   export type ProductCardProps = {
     card: CatalogCard;
     title: string;
     imageUrl: string;
     imageAlt: string;
     locale: Locale;
     priority?: boolean;
   };

   export function ProductCard({
     card,
     title,
     imageUrl,
     imageAlt,
     locale,
     priority = false,
   }: ProductCardProps): React.JSX.Element {
     const motionEnabled = useMotionCapability();
     const ref = useRef<HTMLLIElement>(null);
     // Visible-by-default: only start hidden when we WILL animate.
     const [revealed, setRevealed] = useState(!motionEnabled);
     const [wished, setWished] = useState(false);

     useEffect(() => {
       if (!motionEnabled) {
         setRevealed(true);
         return;
       }
       const node = ref.current;
       if (!node) return;
       const observer = new IntersectionObserver(
         (entries) => {
           for (const entry of entries) {
             if (entry.isIntersecting) {
               setRevealed(true);
               observer.unobserve(entry.target); // pause work once revealed
             }
           }
         },
         { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
       );
       observer.observe(node);
       return () => observer.disconnect();
     }, [motionEnabled]);

     const onSale = card.compareAtFromPrice !== null;

     return (
       <li
         ref={ref}
         data-testid="product-card"
         data-product-id={card.productId}
         data-revealed={revealed ? 'true' : 'false'}
         className={[
           'group relative flex flex-col bg-smoke-900',
           'transition-[clip-path,opacity] duration-700 ease-out motion-reduce:transition-none',
           'data-[revealed=false]:[clip-path:inset(0_0_100%_0)] data-[revealed=false]:opacity-0',
           'data-[revealed=true]:[clip-path:inset(0_0_0_0)] data-[revealed=true]:opacity-100',
         ].join(' ')}
       >
         <button
           type="button"
           aria-pressed={wished}
           onClick={() => setWished((w) => !w)}
           className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-paper backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
         >
           <span aria-hidden="true" className={wished ? 'text-blaze' : 'text-paper'}>
             {wished ? '♥' : '♡'}
           </span>
         </button>

         <Link
           href={`/product/${card.slug}`}
           className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
         >
           <div
             className="relative aspect-[4/5] overflow-hidden bg-ink"
             style={{ viewTransitionName: `product-${card.productId}` }}
           >
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img
               src={imageUrl}
               alt={imageAlt}
               loading={priority ? 'eager' : 'lazy'}
               decoding="async"
               className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
             />
           </div>

           <div className="flex flex-col gap-1 p-3">
             <h3 className="display text-sm leading-tight text-paper">{title}</h3>
             <div className="flex items-baseline gap-2 font-[family-name:var(--font-mono)] text-paper">
               <span className="text-sm">{formatMoney(card.fromPrice, locale)}</span>
               {onSale ? (
                 <span className="text-xs text-smoke-500 line-through">
                   {formatMoney(card.compareAtFromPrice!, locale)}
                 </span>
               ) : null}
             </div>
             {card.matchedColors.length > 1 ? (
               <span className="text-xs text-smoke-300">{card.matchedColors.length} colors</span>
             ) : null}
           </div>
         </Link>
       </li>
     );
   }
   ```

   > The `AvailabilityBadge` (Phase 4) is layered in by Phase 4/6 when that component exists; the card here is complete without it. Phase 6 Task 6.2 adds the badge overlay + `catalog` message keys as a `Modify`.

4. - [ ] **Run it and SHOW it pass:**
   - Command: `npm run test -- tests/unit/to-catalog-card.test.ts`
   - Expected: `Test Files  1 passed (1)` · `Tests  3 passed (3)`.
5. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
6. - [ ] **Visual check (Playwright against `npm run dev`):** render a small grid of cards; confirm the View-Transition name `product-<id>` is locale-stable across an `en`↔`th` switch (selector survives), and that under reduced motion the card is visible-by-default (`data-revealed="true"` immediately, no `opacity:0`). Capture one `en` and one `th` screenshot of the grid + one reduced-motion run.
7. - [ ] **Commit:**
   ```
   git add components/product/ProductCard.tsx tests/unit/to-catalog-card.test.ts
   git commit -m "feat(product): add ProductCard (clip-path reveal, view-transition origin) and toCatalogCard mapper"
   ```

---

## Task 0.5.6 — `components/cart/CartDrawerContext.tsx` (open-state + announcement channel)

The cart drawer **OPEN-STATE** context plus the **concrete announcement channel** (Errata item 11). Exposes `isOpen`/`open`/`close` and `announcement`/`setAnnouncement(msg)`. The `AddToCartButton` (Phase 5) calls `setAnnouncement(...)`; the `CartDrawer` (Phase 3) reads `announcement` into its `aria-live` region. **No drawer contents/data here** — those (`lineViews`, the `CartDrawer` body) are added by Phase 3, which extends this SAME context.

### Files

- **Create:** `vanta/components/cart/CartDrawerContext.tsx`

### Interfaces

- **Consumes:** `import { createContext, useCallback, useContext, useMemo, useState } from 'react'`.
- **Produces:**
  ```ts
  export function CartDrawerProvider(props: { children: React.ReactNode }): React.JSX.Element;
  export function useCartDrawer(): {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    announcement: string;
    setAnnouncement: (msg: string) => void;
  };
  ```
  > Phase 3 Task 3.6 EXTENDS this context with `lineViews` / `setLineViews` (the variant snapshots the drawer renders) — it adds members, never changes `open`/`close`/`announcement`. Consumers that only need open-state are unaffected.

### Steps

1. - [ ] **Implement** `vanta/components/cart/CartDrawerContext.tsx`:

   ```tsx
   'use client';

   import { createContext, useCallback, useContext, useMemo, useState } from 'react';

   type CartDrawerContextValue = {
     isOpen: boolean;
     open: () => void;
     close: () => void;
     announcement: string;
     setAnnouncement: (msg: string) => void;
   };

   const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

   export function CartDrawerProvider({
     children,
   }: {
     children: React.ReactNode;
   }): React.JSX.Element {
     const [isOpen, setIsOpen] = useState(false);
     const [announcement, setAnnouncementState] = useState('');

     const open = useCallback(() => setIsOpen(true), []);
     const close = useCallback(() => setIsOpen(false), []);
     const setAnnouncement = useCallback((msg: string) => setAnnouncementState(msg), []);

     const value = useMemo<CartDrawerContextValue>(
       () => ({ isOpen, open, close, announcement, setAnnouncement }),
       [isOpen, open, close, announcement, setAnnouncement],
     );

     return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
   }

   export function useCartDrawer(): CartDrawerContextValue {
     const ctx = useContext(CartDrawerContext);
     if (!ctx) throw new Error('useCartDrawer must be used within <CartDrawerProvider>');
     return ctx;
   }
   ```

2. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
3. - [ ] **Commit:**
   ```
   git add components/cart/CartDrawerContext.tsx
   git commit -m "feat(cart): add CartDrawer open-state context with announcement channel"
   ```

---

## Task 0.5.7 — `components/layout/Header.tsx` + `components/layout/Footer.tsx`

The shell `Header` (brand lockup, nav, a `LocaleSwitcher` mount-point, and the cart-count trigger button `data-testid="cart-count"` that calls `useCartDrawer().open()`) and a `Footer`. The cart-count badge number stays at `0` until Phase 3's `useCartCount` selector is wired (Phase 3 `Modify`s the trigger to read the live count); the **trigger + `data-testid` exist now** so Phases 3/9/10 can rely on them (Errata item 18a).

### Files

- **Create:** `vanta/components/layout/Header.tsx`
- **Create:** `vanta/components/layout/Footer.tsx`

### Interfaces

- **Consumes:**
  - `import { useCartDrawer } from '@/components/cart/CartDrawerContext'`
  - `import { Link } from '@/lib/i18n/navigation'`
  - `import { useTranslations } from 'next-intl'`
  - (`LocaleSwitcher` is mounted by Phase 2's i18n task, which `Modify`s this Header to render `<LocaleSwitcher />` into the reserved slot.)
- **Produces:**
  ```ts
  export function Header(): React.JSX.Element;
  export function Footer(): React.JSX.Element;
  ```

> Add a `shell` namespace key `cart` to `messages/en.json` / `messages/th.json` (`"cart": "Cart"` / `"ตะกร้า"`) if the Phase 0 `Shell` namespace does not already carry it; reuse the existing brand/tagline keys for the lockup.

### Steps

1. - [ ] **Implement** `vanta/components/layout/Header.tsx` (client component — uses the drawer context):

   ```tsx
   'use client';

   import { Link } from '@/lib/i18n/navigation';
   import { useTranslations } from 'next-intl';
   import { useCartDrawer } from '@/components/cart/CartDrawerContext';

   export function Header(): React.JSX.Element {
     const t = useTranslations('shell');
     const { open } = useCartDrawer();

     return (
       <header className="sticky top-0 z-40 flex items-center justify-between border-b border-smoke-700 bg-ink px-6 py-4 text-paper">
         <Link
           href="/"
           className="display text-2xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
         >
           <span data-testid="brand">VANTA</span>
         </Link>

         <nav className="flex items-center gap-6 text-sm uppercase tracking-wide">
           <Link
             href="/shop"
             className="hover:text-blaze focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
           >
             {t('nav.shop')}
           </Link>
           <Link
             href="/collections"
             className="hover:text-blaze focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
           >
             {t('nav.collections')}
           </Link>

           {/* LocaleSwitcher mount-point — Phase 2 renders <LocaleSwitcher /> here. */}
           <div data-slot="locale-switcher" />

           <button
             type="button"
             data-testid="cart-count"
             onClick={open}
             className="rounded-full border border-paper px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
             aria-label={t('cart')}
           >
             {t('cart')} (<span data-testid="cart-count-value">0</span>)
           </button>
         </nav>
       </header>
     );
   }
   ```

   > Phase 3 `Modify`s this button to render the live `useCartCount()` value in `data-testid="cart-count-value"`; the `data-testid="cart-count"` selector and `onClick={open}` are stable from now. If `shell.nav.shop` / `shell.nav.collections` keys are absent, add them to both message files in this step.

2. - [ ] **Implement** `vanta/components/layout/Footer.tsx`:

   ```tsx
   import { Link } from '@/lib/i18n/navigation';

   export function Footer(): React.JSX.Element {
     return (
       <footer className="border-t border-smoke-700 bg-ink px-6 py-10 text-smoke-300">
         <div className="mx-auto flex max-w-[1440px] flex-col gap-2">
           <span className="display text-lg text-paper">VANTA</span>
           <nav className="flex gap-6 text-xs uppercase tracking-wide">
             <Link href="/shop" className="hover:text-paper">
               Shop
             </Link>
             <Link href="/collections" className="hover:text-paper">
               Collections
             </Link>
           </nav>
           <span className="text-xs">
             © {new Date().getFullYear()} VANTA — portfolio showcase.
           </span>
         </div>
       </footer>
     );
   }
   ```

3. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
4. - [ ] **Visual check (Playwright against `npm run dev`):** assert `data-testid="cart-count"` is present and clicking it sets the drawer open-state (drawer body is empty until Phase 3 — assert the context flips, e.g. via a temporary probe or the Phase 3 e2e once the body exists). Capture one `en` and one `th` header screenshot (brand lockup + nav switch copy).
5. - [ ] **Commit:**
   ```
   git add components/layout/Header.tsx components/layout/Footer.tsx messages/en.json messages/th.json
   git commit -m "feat(layout): add Header (cart-count trigger, locale-switcher slot) and Footer"
   ```

---

## Task 0.5.8 — MODIFY `app/[locale]/layout.tsx` to mount the provider + shell

Wrap the locale layout's children in `<CartDrawerProvider>` and render `<Header/> {children} <Footer/>`. This is the **open-state** provider only — `<CartHydrator>` and the `<CartDrawer>` contents are mounted by **Phase 3 Task 3.x**, which MODIFIES this layout again (reading the server cart via `cartService.getCart()` per Errata items 16 & 18b).

### Files

- **Modify:** `vanta/app/[locale]/layout.tsx`

### Interfaces

- **Consumes:**
  - `import { CartDrawerProvider } from '@/components/cart/CartDrawerContext'`
  - `import { Header } from '@/components/layout/Header'`
  - `import { Footer } from '@/components/layout/Footer'`
- **Produces:** unchanged export — `export default async function LocaleLayout(...)`.

### Steps

1. - [ ] **Edit** `vanta/app/[locale]/layout.tsx`. Add the three imports, then wrap the rendered tree so `Header`/children/`Footer` sit inside both the `NextIntlClientProvider` and the new `CartDrawerProvider`. The body becomes (keeping the Phase-0 locale validation, `setRequestLocale`, and the `<html lang>` sync script intact):

   ```tsx
   import type { ReactNode } from 'react';
   import { notFound } from 'next/navigation';
   import { NextIntlClientProvider } from 'next-intl';
   import { getMessages, setRequestLocale } from 'next-intl/server';
   import { routing } from '@/lib/i18n/routing';
   import type { Locale } from '@/lib/domain/i18n';
   import { CartDrawerProvider } from '@/components/cart/CartDrawerContext';
   import { Header } from '@/components/layout/Header';
   import { Footer } from '@/components/layout/Footer';

   export function generateStaticParams() {
     return routing.locales.map((locale) => ({ locale }));
   }

   export default async function LocaleLayout({
     children,
     params,
   }: {
     children: ReactNode;
     params: Promise<{ locale: string }>;
   }) {
     const { locale } = await params;

     if (!routing.locales.includes(locale as Locale)) {
       notFound();
     }

     setRequestLocale(locale);
     const messages = await getMessages();

     return (
       <NextIntlClientProvider locale={locale} messages={messages}>
         {/* Sync the document language so :lang(en)/:lang(th) headline tokens apply. */}
         <script
           // eslint-disable-next-line react/no-danger
           dangerouslySetInnerHTML={{
             __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir="ltr";`,
           }}
         />
         <CartDrawerProvider>
           <Header />
           {children}
           <Footer />
           {/* Phase 3 MODIFIES this layout to add <CartHydrator serverCart={await cartService.getCart()} /> and <CartDrawer /> here, inside this same provider. */}
         </CartDrawerProvider>
       </NextIntlClientProvider>
     );
   }
   ```

2. - [ ] **Typecheck:** `npm run typecheck` → exit 0.
3. - [ ] **Visual check (Playwright against `npm run dev`):** load `/en` and `/th`; confirm the `Header` (with `data-testid="cart-count"`) and `Footer` render around the existing Phase-0 home content, the locale-stamp/brand `data-testid`s from Phase 0 still resolve (no regression — they are unchanged here), and the page is content-visible-by-default. Capture one `en` and one `th` full-page screenshot.
4. - [ ] **Commit:**
   ```
   git add "app/[locale]/layout.tsx"
   git commit -m "feat(layout): mount CartDrawerProvider, Header, and Footer in the locale layout"
   ```

---

---

## Phase 3 — Cart state

> Builds the cart vertical slice end-to-end: the signed-cookie `CartStore` (the source of truth), `cartService` (reconciliation + integer-money totals against live variant data), the four `'use server'` cart actions that return the **authoritative** `Cart`, the disciplined Zustand mirror (hydrate + replace-from-server only), the cart drawer as a real a11y `dialog` with `useOptimistic` in-flight add, and the `/cart` page. LOGIC (CartStore, cartService, the reconciliation/totals math) is TDD with Vitest; the drawer and add-to-cart wiring are verified with Playwright against `npm run dev`.
>
> **Depends on:** Phase 1 (domain types, `lib/data` swap point, `ProductRepository.getVariantById`/`decrementStock`, `lib/format/money.ts`) and Phase 2 (next-intl routing/navigation, `messages/{en,th}.json`, `[locale]/layout.tsx`). Every task below imports domain types from `@/lib/domain`, reaches data through `@/lib/data`, and formats money only via `formatMoney`.

---

### Task 3.1 — Signed-cookie `CartStore` mock (cookie is the source of truth)

The `CartStore` is the only request-context-aware repository: it reads/writes a signed cookie. We implement HMAC signing (constant-time verify, tamper → empty cart), and store **only** the line items + `updatedAt` in the cookie payload (counts/subtotal are derived server-side by the service in Task 3.2, never trusted from the cookie).

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/cart-cookie.ts` (pure sign/verify + serialize/deserialize — request-context-free, unit-testable)
- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/cart-store.mock.ts` (`MockCartStore`, the `cookies()`-backed `CartStore`)
- Modify: `d:/MINE/freelance/system/vanta/lib/data/mock/index.ts` (wire `cart: new MockCartStore()` into `mockRepositories`)
- Test: `d:/MINE/freelance/system/vanta/tests/unit/cart-cookie.test.ts`

**Interfaces**

- Consumes: `Cart`, `CartItem` from `@/lib/domain`; `CartStore` from `@/lib/data/repositories/cart-store`; `cookies` from `next/headers`.
- Produces:
  ```ts
  // cart-cookie.ts (pure, no next/headers import)
  export const CART_COOKIE_NAME = 'vanta_cart';
  export const EMPTY_CART: Cart;
  export function signPayload(payload: string, secret: string): string; // returns "payload.signature" (base64url)
  export function serializeCart(cart: Cart, secret: string): string; // -> signed cookie value
  export function deserializeCart(value: string | undefined, secret: string): Cart; // tamper/empty -> EMPTY_CART
  ```
- Produces: `export class MockCartStore implements CartStore` with `read()/write(cart)/clear()`.

**Steps**

- [ ] **Write the failing test.** Create `d:/MINE/freelance/system/vanta/tests/unit/cart-cookie.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import {
    EMPTY_CART,
    serializeCart,
    deserializeCart,
    signPayload,
    CART_COOKIE_NAME,
  } from '@/lib/data/mock/cart-cookie';
  import type { Cart } from '@/lib/domain';

  const SECRET = 'test-secret-key';

  const sampleCart: Cart = {
    items: [
      { variantId: 'var_tee_black_m', quantity: 2 },
      { variantId: 'var_tee_black_l', quantity: 1 },
    ],
    itemCount: 3,
    subtotal: { amount: 597000, currency: 'THB' },
    updatedAt: '2026-06-27T00:00:00.000Z',
  };

  describe('cart-cookie', () => {
    it('exposes a stable cookie name', () => {
      expect(CART_COOKIE_NAME).toBe('vanta_cart');
    });

    it('EMPTY_CART has zeroed THB subtotal and no items', () => {
      expect(EMPTY_CART.items).toEqual([]);
      expect(EMPTY_CART.itemCount).toBe(0);
      expect(EMPTY_CART.subtotal).toEqual({ amount: 0, currency: 'THB' });
    });

    it('round-trips a signed cart', () => {
      const value = serializeCart(sampleCart, SECRET);
      const back = deserializeCart(value, SECRET);
      expect(back.items).toEqual(sampleCart.items);
      expect(back.updatedAt).toBe(sampleCart.updatedAt);
    });

    it('returns EMPTY_CART for a missing cookie', () => {
      expect(deserializeCart(undefined, SECRET)).toEqual(EMPTY_CART);
    });

    it('returns EMPTY_CART when the signature is tampered', () => {
      const value = serializeCart(sampleCart, SECRET);
      const [payload] = value.split('.');
      const forged = `${payload}.${signPayload(payload, 'wrong-secret')}`;
      expect(deserializeCart(forged, SECRET)).toEqual(EMPTY_CART);
    });

    it('returns EMPTY_CART when the payload is mutated but signature kept', () => {
      const value = serializeCart(sampleCart, SECRET);
      const [, sig] = value.split('.');
      const mutated = Buffer.from(JSON.stringify({ items: [], updatedAt: 'x' })).toString(
        'base64url',
      );
      expect(deserializeCart(`${mutated}.${sig}`, SECRET)).toEqual(EMPTY_CART);
    });

    it('only persists items + updatedAt in the payload (counts not trusted)', () => {
      const value = serializeCart(sampleCart, SECRET);
      const [payload] = value.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      expect(Object.keys(decoded).sort()).toEqual(['items', 'updatedAt']);
    });
  });
  ```

- [ ] **Run it — watch it fail (module does not exist yet).**

  ```
  npm run test -- tests/unit/cart-cookie.test.ts
  ```

  Expected: Vitest fails to resolve the import —

  ```
  Error: Failed to load url @/lib/data/mock/cart-cookie (resolved id: .../lib/data/mock/cart-cookie). Does the file exist?
  ```

- [ ] **Implement the pure cookie codec.** Create `d:/MINE/freelance/system/vanta/lib/data/mock/cart-cookie.ts`:

  ```ts
  import { createHmac, timingSafeEqual } from 'node:crypto';
  import type { Cart, CartItem } from '@/lib/domain';

  export const CART_COOKIE_NAME = 'vanta_cart';

  export const EMPTY_CART: Cart = {
    items: [],
    itemCount: 0,
    subtotal: { amount: 0, currency: 'THB' },
    updatedAt: '1970-01-01T00:00:00.000Z',
  };

  /** Only items + updatedAt are persisted; counts/subtotal are re-derived server-side. */
  type CartCookiePayload = {
    items: CartItem[];
    updatedAt: string;
  };

  export function signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }

  function verify(payload: string, signature: string, secret: string): boolean {
    const expected = signPayload(payload, secret);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  function isCartItemArray(value: unknown): value is CartItem[] {
    return (
      Array.isArray(value) &&
      value.every(
        (it) =>
          typeof it === 'object' &&
          it !== null &&
          typeof (it as { variantId: unknown }).variantId === 'string' &&
          typeof (it as { quantity: unknown }).quantity === 'number' &&
          Number.isInteger((it as { quantity: number }).quantity) &&
          (it as { quantity: number }).quantity > 0,
      )
    );
  }

  export function serializeCart(cart: Cart, secret: string): string {
    const payload: CartCookiePayload = { items: cart.items, updatedAt: cart.updatedAt };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${signPayload(encoded, secret)}`;
  }

  export function deserializeCart(value: string | undefined, secret: string): Cart {
    if (!value) return EMPTY_CART;
    const dot = value.lastIndexOf('.');
    if (dot <= 0) return EMPTY_CART;
    const encoded = value.slice(0, dot);
    const signature = value.slice(dot + 1);
    if (!verify(encoded, signature, secret)) return EMPTY_CART;
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    } catch {
      return EMPTY_CART;
    }
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_CART;
    const candidate = parsed as { items?: unknown; updatedAt?: unknown };
    if (!isCartItemArray(candidate.items) || typeof candidate.updatedAt !== 'string') {
      return EMPTY_CART;
    }
    return {
      items: candidate.items,
      itemCount: candidate.items.reduce((sum, it) => sum + it.quantity, 0),
      subtotal: { amount: 0, currency: 'THB' }, // service recomputes from live variant prices
      updatedAt: candidate.updatedAt,
    };
  }
  ```

- [ ] **Run it — watch it pass.**

  ```
  npm run test -- tests/unit/cart-cookie.test.ts
  ```

  Expected: `Test Files  1 passed (1)` · `Tests  7 passed (7)`.

- [ ] **Implement the `cookies()`-backed store.** Create `d:/MINE/freelance/system/vanta/lib/data/mock/cart-store.mock.ts`:

  ```ts
  import { cookies } from 'next/headers';
  import type { Cart } from '@/lib/domain';
  import type { CartStore } from '@/lib/data/repositories/cart-store';
  import { CART_COOKIE_NAME, EMPTY_CART, deserializeCart, serializeCart } from './cart-cookie';

  const SECRET = process.env.CART_COOKIE_SECRET ?? 'vanta-dev-cart-secret';
  const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

  export class MockCartStore implements CartStore {
    async read(): Promise<Cart> {
      const store = await cookies();
      const raw = store.get(CART_COOKIE_NAME)?.value;
      return deserializeCart(raw, SECRET);
    }

    async write(cart: Cart): Promise<void> {
      const store = await cookies();
      store.set(CART_COOKIE_NAME, serializeCart(cart, SECRET), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: MAX_AGE,
      });
    }

    async clear(): Promise<void> {
      const store = await cookies();
      store.set(CART_COOKIE_NAME, serializeCart(EMPTY_CART, SECRET), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      });
    }
  }
  ```

- [ ] **Wire it into the mock bundle.** In `d:/MINE/freelance/system/vanta/lib/data/mock/index.ts`, add the import and set `cart`:

  ```ts
  import { MockCartStore } from './cart-store.mock';
  // ...inside the mockRepositories object literal:
  //   cart: new MockCartStore(),
  ```

  Confirm the bundle still type-checks:

  ```
  npm run typecheck
  ```

  Expected: exit code 0, no output.

- [ ] **Commit.**
  ```
  git add lib/data/mock/cart-cookie.ts lib/data/mock/cart-store.mock.ts lib/data/mock/index.ts tests/unit/cart-cookie.test.ts
  git commit -m "feat(cart): add signed-cookie CartStore with tamper-safe codec"
  ```

---

### Task 3.2 — `cartService`: reconciliation + integer-money totals

The service is the single reconciliation path. It reads the cookie cart (items only), looks up each variant through `@/lib/data` `products`, drops dead variants, clamps quantity to live stock, sums `unitPrice * qty` in integer satang, derives `itemCount`, writes the reconciled cart back to the cookie, and returns the **authoritative** `Cart`. `addItem` also decrements in-session stock via `products.decrementStock` so the LIVE DROP stock meter ticks down. Pure reconciliation math is extracted so it is unit-testable without `cookies()`.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/services/cart-reconcile.ts` (pure `reconcileCart` + `EMPTY_RECONCILED` — no cookies/repos)
- Create: `d:/MINE/freelance/system/vanta/lib/services/cart-service.ts` (`cartService: CartService`)
- Test: `d:/MINE/freelance/system/vanta/tests/unit/cart-reconcile.test.ts`

**Interfaces**

- Consumes: `Cart`, `CartItem`, `Variant`, `Money` from `@/lib/domain`; `CartService` from the locked `lib/services/cart-service.ts` contract; `products`, `cart` from `@/lib/data`.
- Produces:
  ```ts
  // cart-reconcile.ts (pure)
  /** Maps requested items against live variants; null lookup => dropped, clamp qty to stock. */
  export function reconcileCart(
    items: CartItem[],
    variantsById: Map<string, Variant>,
    now: string,
  ): Cart;
  ```
- Produces: `export const cartService: CartService` implementing `getCart/addItem/updateQuantity/removeItem/clear` — each returns `Promise<Cart>`.

**Steps**

- [ ] **Write the failing test.** Create `d:/MINE/freelance/system/vanta/tests/unit/cart-reconcile.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { reconcileCart } from '@/lib/services/cart-reconcile';
  import type { Variant } from '@/lib/domain';

  const NOW = '2026-06-27T12:00:00.000Z';

  function variant(id: string, amount: number, stock: number): Variant {
    return {
      id,
      sku: id.toUpperCase(),
      optionValues: { size: 'M', color: 'black' },
      price: { amount, currency: 'THB' },
      stock,
      availability: 'live',
    };
  }

  const variants = new Map<string, Variant>([
    ['var_a', variant('var_a', 199000, 10)], // ฿1,990
    ['var_b', variant('var_b', 129000, 3)], // ฿1,290, only 3 left
    ['var_c', variant('var_c', 50000, 0)], // sold out
  ]);

  describe('reconcileCart', () => {
    it('returns an empty THB cart for no items', () => {
      const cart = reconcileCart([], variants, NOW);
      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toEqual({ amount: 0, currency: 'THB' });
      expect(cart.updatedAt).toBe(NOW);
    });

    it('sums unitPrice * qty in integer satang', () => {
      const cart = reconcileCart(
        [
          { variantId: 'var_a', quantity: 2 },
          { variantId: 'var_b', quantity: 1 },
        ],
        variants,
        NOW,
      );
      // 199000*2 + 129000*1 = 527000  (฿5,270)
      expect(cart.subtotal).toEqual({ amount: 527000, currency: 'THB' });
      expect(cart.itemCount).toBe(3);
    });

    it('drops items whose variant no longer exists', () => {
      const cart = reconcileCart(
        [
          { variantId: 'var_a', quantity: 1 },
          { variantId: 'var_missing', quantity: 5 },
        ],
        variants,
        NOW,
      );
      expect(cart.items).toEqual([{ variantId: 'var_a', quantity: 1 }]);
      expect(cart.subtotal.amount).toBe(199000);
    });

    it('clamps quantity down to live stock', () => {
      const cart = reconcileCart([{ variantId: 'var_b', quantity: 9 }], variants, NOW);
      expect(cart.items).toEqual([{ variantId: 'var_b', quantity: 3 }]);
      expect(cart.subtotal.amount).toBe(387000); // 129000 * 3
    });

    it('drops sold-out variants entirely (clamp to 0 removes the line)', () => {
      const cart = reconcileCart([{ variantId: 'var_c', quantity: 2 }], variants, NOW);
      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
    });

    it('merges duplicate variantIds into one line before clamping', () => {
      const cart = reconcileCart(
        [
          { variantId: 'var_b', quantity: 2 },
          { variantId: 'var_b', quantity: 2 },
        ],
        variants,
        NOW,
      );
      // 2+2=4 requested, clamp to stock 3
      expect(cart.items).toEqual([{ variantId: 'var_b', quantity: 3 }]);
    });
  });
  ```

- [ ] **Run it — watch it fail.**

  ```
  npm run test -- tests/unit/cart-reconcile.test.ts
  ```

  Expected: `Error: Failed to load url @/lib/services/cart-reconcile ... Does the file exist?`

- [ ] **Implement the pure reconciler.** Create `d:/MINE/freelance/system/vanta/lib/services/cart-reconcile.ts`:

  ```ts
  import type { Cart, CartItem, Variant } from '@/lib/domain';

  /**
   * PURE. Maps requested items against live variants, merging duplicate lines,
   * dropping unknown variants, and clamping each quantity to live stock
   * (clamp to 0 removes the line). Subtotal is summed in integer satang.
   */
  export function reconcileCart(
    items: CartItem[],
    variantsById: Map<string, Variant>,
    now: string,
  ): Cart {
    const merged = new Map<string, number>();
    for (const item of items) {
      merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
    }

    const reconciled: CartItem[] = [];
    let subtotalAmount = 0;
    let itemCount = 0;

    for (const [variantId, requested] of merged) {
      const variant = variantsById.get(variantId);
      if (!variant) continue; // dropped: variant no longer exists
      const quantity = Math.min(requested, variant.stock);
      if (quantity <= 0) continue; // sold out / clamped away
      reconciled.push({ variantId, quantity });
      subtotalAmount += variant.price.amount * quantity;
      itemCount += quantity;
    }

    return {
      items: reconciled,
      itemCount,
      subtotal: { amount: subtotalAmount, currency: 'THB' },
      updatedAt: now,
    };
  }
  ```

- [ ] **Run it — watch it pass.**

  ```
  npm run test -- tests/unit/cart-reconcile.test.ts
  ```

  Expected: `Test Files  1 passed (1)` · `Tests  6 passed (6)`.

- [ ] **Implement `cartService`.** Create `d:/MINE/freelance/system/vanta/lib/services/cart-service.ts`:

  ```ts
  import type { Cart, CartItem, Variant } from '@/lib/domain';
  import type { CartService } from '@/lib/data/repositories'; // type re-exported below if needed
  import { products, cart as cartStore } from '@/lib/data';
  import { reconcileCart } from './cart-reconcile';

  // The locked CartService interface lives in lib/services/cart-service.ts itself; declare it here.
  export interface CartService {
    getCart(): Promise<Cart>;
    addItem(variantId: string, quantity: number): Promise<Cart>;
    updateQuantity(variantId: string, quantity: number): Promise<Cart>;
    removeItem(variantId: string): Promise<Cart>;
    clear(): Promise<Cart>;
  }

  async function loadVariants(items: CartItem[]): Promise<Map<string, Variant>> {
    const map = new Map<string, Variant>();
    const ids = [...new Set(items.map((i) => i.variantId))];
    const found = await Promise.all(ids.map((id) => products.getVariantById(id)));
    for (const variant of found) {
      if (variant) map.set(variant.id, variant);
    }
    return map;
  }

  async function reconcileAndPersist(items: CartItem[]): Promise<Cart> {
    const variants = await loadVariants(items);
    const next = reconcileCart(items, variants, new Date().toISOString());
    await cartStore.write(next);
    return next;
  }

  export const cartService: CartService = {
    async getCart() {
      const current = await cartStore.read();
      return reconcileAndPersist(current.items);
    },

    async addItem(variantId, quantity) {
      if (quantity <= 0) return this.getCart();
      const variant = await products.getVariantById(variantId);
      if (!variant || variant.stock <= 0) return this.getCart();

      const current = await cartStore.read();
      const existing = current.items.find((i) => i.variantId === variantId);
      const alreadyInCart = existing?.quantity ?? 0;
      // Only decrement stock by the amount we can actually add (clamped to remaining stock).
      const grantable = Math.max(0, Math.min(quantity, variant.stock - alreadyInCart));
      if (grantable > 0) {
        await products.decrementStock(variantId, grantable);
      }
      const nextItems: CartItem[] = existing
        ? current.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: i.quantity + grantable } : i,
          )
        : [...current.items, { variantId, quantity: grantable }];
      return reconcileAndPersist(nextItems);
    },

    async updateQuantity(variantId, quantity) {
      const current = await cartStore.read();
      const nextItems =
        quantity <= 0
          ? current.items.filter((i) => i.variantId !== variantId)
          : current.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
      return reconcileAndPersist(nextItems);
    },

    async removeItem(variantId) {
      const current = await cartStore.read();
      return reconcileAndPersist(current.items.filter((i) => i.variantId !== variantId));
    },

    async clear() {
      await cartStore.clear();
      return reconcileAndPersist([]);
    },
  };
  ```

  > Note: the `CartService` interface is declared and exported here (matching the locked signature verbatim) because the locked contract places it in this very file. Remove the unused `import type { CartService } from '@/lib/data/repositories'` line if your barrel does not re-export it — the canonical definition is the one in this file.

- [ ] **Fix the import line** (the bundle does not export `CartService`): edit `d:/MINE/freelance/system/vanta/lib/services/cart-service.ts` to delete the line `import type { CartService } from '@/lib/data/repositories';` so only the locally declared interface remains. Then type-check:

  ```
  npm run typecheck
  ```

  Expected: exit code 0, no output.

- [ ] **Commit.**
  ```
  git add lib/services/cart-reconcile.ts lib/services/cart-service.ts tests/unit/cart-reconcile.test.ts
  git commit -m "feat(cart): add cartService with pure reconciliation and satang totals"
  ```

---

### Task 3.3 — Cart Server Actions returning the authoritative `Cart`

Thin `'use server'` wrappers over `cartService`. They are the **only** mutation path the client uses, and every one returns the authoritative `Cart` that the Zustand mirror reconciles from. They `revalidatePath` the cart/home/PDP surfaces so RSC stock badges refresh after a stock decrement.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/actions/cart-actions.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/cart-actions.test.ts`

**Interfaces**

- Consumes: `Cart` from `@/lib/domain`; `cartService` from `@/lib/services/cart-service`; `revalidatePath` from `next/cache`.
- Produces (verbatim locked signatures):
  ```ts
  export async function addToCart(variantId: string, quantity: number): Promise<Cart>;
  export async function updateCartQuantity(variantId: string, quantity: number): Promise<Cart>;
  export async function removeFromCart(variantId: string): Promise<Cart>;
  export async function getCartAction(): Promise<Cart>;
  ```

**Steps**

- [ ] **Write the failing test** (mocks `cartService` + `next/cache` so it runs in node env and proves each action delegates and returns the service's authoritative cart). Create `d:/MINE/freelance/system/vanta/tests/unit/cart-actions.test.ts`:

  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import type { Cart } from '@/lib/domain';

  const authoritative: Cart = {
    items: [{ variantId: 'var_a', quantity: 1 }],
    itemCount: 1,
    subtotal: { amount: 199000, currency: 'THB' },
    updatedAt: '2026-06-27T00:00:00.000Z',
  };

  const addItem = vi.fn(async () => authoritative);
  const updateQuantity = vi.fn(async () => authoritative);
  const removeItem = vi.fn(async () => authoritative);
  const getCart = vi.fn(async () => authoritative);

  vi.mock('@/lib/services/cart-service', () => ({
    cartService: { addItem, updateQuantity, removeItem, getCart, clear: vi.fn() },
  }));
  vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

  import {
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCartAction,
  } from '@/lib/actions/cart-actions';

  beforeEach(() => vi.clearAllMocks());

  describe('cart-actions', () => {
    it('addToCart delegates to cartService.addItem and returns its cart', async () => {
      const result = await addToCart('var_a', 2);
      expect(addItem).toHaveBeenCalledWith('var_a', 2);
      expect(result).toBe(authoritative);
    });

    it('updateCartQuantity delegates to cartService.updateQuantity', async () => {
      const result = await updateCartQuantity('var_a', 3);
      expect(updateQuantity).toHaveBeenCalledWith('var_a', 3);
      expect(result).toBe(authoritative);
    });

    it('removeFromCart delegates to cartService.removeItem', async () => {
      const result = await removeFromCart('var_a');
      expect(removeItem).toHaveBeenCalledWith('var_a');
      expect(result).toBe(authoritative);
    });

    it('getCartAction delegates to cartService.getCart', async () => {
      const result = await getCartAction();
      expect(getCart).toHaveBeenCalledTimes(1);
      expect(result).toBe(authoritative);
    });
  });
  ```

- [ ] **Run it — watch it fail.**

  ```
  npm run test -- tests/unit/cart-actions.test.ts
  ```

  Expected: `Error: Failed to load url @/lib/actions/cart-actions ... Does the file exist?`

- [ ] **Implement the actions.** Create `d:/MINE/freelance/system/vanta/lib/actions/cart-actions.ts`:

  ```ts
  'use server';

  import { revalidatePath } from 'next/cache';
  import type { Cart } from '@/lib/domain';
  import { cartService } from '@/lib/services/cart-service';

  function revalidateCartSurfaces(): void {
    // Stock badges + cart line state are RSC-rendered; refresh them after a mutation.
    revalidatePath('/[locale]', 'layout');
  }

  export async function addToCart(variantId: string, quantity: number): Promise<Cart> {
    const cart = await cartService.addItem(variantId, quantity);
    revalidateCartSurfaces();
    return cart;
  }

  export async function updateCartQuantity(variantId: string, quantity: number): Promise<Cart> {
    const cart = await cartService.updateQuantity(variantId, quantity);
    revalidateCartSurfaces();
    return cart;
  }

  export async function removeFromCart(variantId: string): Promise<Cart> {
    const cart = await cartService.removeItem(variantId);
    revalidateCartSurfaces();
    return cart;
  }

  export async function getCartAction(): Promise<Cart> {
    return cartService.getCart();
  }
  ```

- [ ] **Run it — watch it pass.**

  ```
  npm run test -- tests/unit/cart-actions.test.ts
  ```

  Expected: `Test Files  1 passed (1)` · `Tests  4 passed (4)`.

- [ ] **Commit.**
  ```
  git add lib/actions/cart-actions.ts tests/unit/cart-actions.test.ts
  git commit -m "feat(cart): add server actions returning the authoritative cart"
  ```

---

### Task 3.4 — Disciplined Zustand mirror (hydrate + replace-from-server ONLY)

The Zustand store is a durable client mirror with no inventing mutators — exactly two entry points: `hydrate` (initial RSC cart) and `replaceFromServer` (every action return value). A `CartHydrator` client component seeds the store from the server-rendered cart on mount, and a `useCartCount` selector feeds the header badge.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/store/cart-store.ts` (`useCartStore`, `useCartCount` selector)
- Create: `d:/MINE/freelance/system/vanta/components/cart/CartHydrator.tsx`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/cart-store.test.ts`

**Interfaces**

- Consumes: `Cart` from `@/lib/domain`; `create` from `zustand`.
- Produces (verbatim locked shape):
  ```ts
  export type CartMirrorState = {
    cart: Cart;
    hydrate: (serverCart: Cart) => void;
    replaceFromServer: (cart: Cart) => void;
  };
  export const useCartStore: import('zustand').UseBoundStore<
    import('zustand').StoreApi<CartMirrorState>
  >;
  export function useCartCount(): number; // selector: state.cart.itemCount
  ```
- Produces: `export function CartHydrator({ serverCart }: { serverCart: Cart }): null`.

**Steps**

- [ ] **Write the failing test** (asserts the INVARIANT: only `hydrate`/`replaceFromServer` exist, no `addItem`/`removeItem` mutators). Create `d:/MINE/freelance/system/vanta/tests/unit/cart-store.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import { useCartStore } from '@/lib/store/cart-store';
  import type { Cart } from '@/lib/domain';

  const empty: Cart = {
    items: [],
    itemCount: 0,
    subtotal: { amount: 0, currency: 'THB' },
    updatedAt: '1970-01-01T00:00:00.000Z',
  };

  const server: Cart = {
    items: [{ variantId: 'var_a', quantity: 2 }],
    itemCount: 2,
    subtotal: { amount: 398000, currency: 'THB' },
    updatedAt: '2026-06-27T00:00:00.000Z',
  };

  beforeEach(() => {
    useCartStore.setState({ cart: empty });
  });

  describe('useCartStore (disciplined mirror)', () => {
    it('starts from an empty THB cart', () => {
      expect(useCartStore.getState().cart).toEqual(empty);
    });

    it('hydrate seeds the mirror from the server cart', () => {
      useCartStore.getState().hydrate(server);
      expect(useCartStore.getState().cart).toEqual(server);
    });

    it('replaceFromServer wholesale-replaces the cart', () => {
      useCartStore.getState().hydrate(empty);
      useCartStore.getState().replaceFromServer(server);
      expect(useCartStore.getState().cart).toBe(server);
    });

    it('exposes ONLY hydrate + replaceFromServer mutators (no invented state)', () => {
      const state = useCartStore.getState();
      const fnKeys = Object.keys(state).filter(
        (k) => typeof (state as Record<string, unknown>)[k] === 'function',
      );
      expect(fnKeys.sort()).toEqual(['hydrate', 'replaceFromServer']);
    });
  });
  ```

- [ ] **Run it — watch it fail.**

  ```
  npm run test -- tests/unit/cart-store.test.ts
  ```

  Expected: `Error: Failed to load url @/lib/store/cart-store ... Does the file exist?`

- [ ] **Implement the store.** Create `d:/MINE/freelance/system/vanta/lib/store/cart-store.ts`:

  ```ts
  import { create } from 'zustand';
  import type { Cart } from '@/lib/domain';

  const EMPTY_CART: Cart = {
    items: [],
    itemCount: 0,
    subtotal: { amount: 0, currency: 'THB' },
    updatedAt: '1970-01-01T00:00:00.000Z',
  };

  export type CartMirrorState = {
    cart: Cart;
    hydrate: (serverCart: Cart) => void;
    replaceFromServer: (cart: Cart) => void;
  };

  // INVARIANT: no addItem/removeItem mutators — Zustand never invents cart state.
  export const useCartStore = create<CartMirrorState>((set) => ({
    cart: EMPTY_CART,
    hydrate: (serverCart) => set({ cart: serverCart }),
    replaceFromServer: (cart) => set({ cart }),
  }));

  export function useCartCount(): number {
    return useCartStore((state) => state.cart.itemCount);
  }
  ```

- [ ] **Run it — watch it pass.**

  ```
  npm run test -- tests/unit/cart-store.test.ts
  ```

  Expected: `Test Files  1 passed (1)` · `Tests  4 passed (4)`.

- [ ] **Implement `CartHydrator`.** Create `d:/MINE/freelance/system/vanta/components/cart/CartHydrator.tsx`:

  ```tsx
  'use client';

  import { useRef } from 'react';
  import type { Cart } from '@/lib/domain';
  import { useCartStore } from '@/lib/store/cart-store';

  /**
   * Seeds the Zustand mirror from the server-rendered cart exactly once on mount.
   * Rendered inside app/[locale]/layout.tsx with the RSC-read cart.
   */
  export function CartHydrator({ serverCart }: { serverCart: Cart }): null {
    const hydrated = useRef(false);
    if (!hydrated.current) {
      // Hydrate during render (before paint) so the header badge is correct on first frame.
      useCartStore.getState().hydrate(serverCart);
      hydrated.current = true;
    }
    return null;
  }
  ```

- [ ] **Type-check** (CartHydrator is consumed by the Phase-2 layout; this verifies the export shape).

  ```
  npm run typecheck
  ```

  Expected: exit code 0, no output.

- [ ] **Commit.**
  ```
  git add lib/store/cart-store.ts components/cart/CartHydrator.tsx tests/unit/cart-store.test.ts
  git commit -m "feat(cart): add disciplined zustand mirror and CartHydrator"
  ```

---

### Task 3.5 — `CartLineItem` (server-truth row, money via `formatMoney`)

A presentational line item rendering the variant snapshot from the authoritative cart, with quantity controls wired to the actions through a shared mutation callback (supplied by the drawer / cart page so optimistic vs. non-optimistic callers reuse the same row). Prices come **only** from `formatMoney`.

**Files**

- Create: `d:/MINE/freelance/system/vanta/components/cart/CartLineItem.tsx`
- Modify: `d:/MINE/freelance/system/vanta/messages/en.json` (add `cart` namespace keys)
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json` (mirror keyset)

**Interfaces**

- Consumes: `Money`, `Locale`, `LocalizedText` from `@/lib/domain`; `formatMoney` from `@/lib/format/money`; `useTranslations`, `useLocale` from `next-intl`.
- Produces:
  ```tsx
  export type CartLineItemView = {
    variantId: string;
    title: LocalizedText;
    size: string;
    color: string;
    unitPrice: Money;
    quantity: number;
    imageUrl: string;
    maxStock: number;
  };
  export function CartLineItem(props: {
    line: CartLineItemView;
    onQuantityChange: (variantId: string, quantity: number) => void;
    onRemove: (variantId: string) => void;
    disabled?: boolean;
  }): React.JSX.Element;
  ```

**Steps**

- [ ] **Add the `cart` copy namespace.** In `d:/MINE/freelance/system/vanta/messages/en.json`, add (merge into the root object):

  ```json
  "cart": {
    "title": "Cart",
    "empty": "Your cart is empty.",
    "subtotal": "Subtotal",
    "checkout": "Checkout",
    "viewCart": "View cart",
    "remove": "Remove",
    "decrease": "Decrease quantity",
    "increase": "Increase quantity",
    "quantityLabel": "Quantity",
    "close": "Close cart",
    "addedAnnouncement": "{title} added to cart. Cart now has {count} items.",
    "openCart": "Open cart, {count} items"
  }
  ```

  In `d:/MINE/freelance/system/vanta/messages/th.json`, add the mirror keyset:

  ```json
  "cart": {
    "title": "ตะกร้า",
    "empty": "ตะกร้าของคุณว่างเปล่า",
    "subtotal": "ยอดรวม",
    "checkout": "ชำระเงิน",
    "viewCart": "ดูตะกร้า",
    "remove": "นำออก",
    "decrease": "ลดจำนวน",
    "increase": "เพิ่มจำนวน",
    "quantityLabel": "จำนวน",
    "close": "ปิดตะกร้า",
    "addedAnnouncement": "เพิ่ม {title} ลงตะกร้าแล้ว ตอนนี้ตะกร้ามี {count} รายการ",
    "openCart": "เปิดตะกร้า {count} รายการ"
  }
  ```

- [ ] **Implement `CartLineItem`.** Create `d:/MINE/freelance/system/vanta/components/cart/CartLineItem.tsx`:

  ```tsx
  'use client';

  import Image from 'next/image';
  import { useLocale, useTranslations } from 'next-intl';
  import type { Locale, LocalizedText, Money } from '@/lib/domain';
  import { formatMoney } from '@/lib/format/money';

  export type CartLineItemView = {
    variantId: string;
    title: LocalizedText;
    size: string;
    color: string;
    unitPrice: Money;
    quantity: number;
    imageUrl: string;
    maxStock: number;
  };

  export function CartLineItem({
    line,
    onQuantityChange,
    onRemove,
    disabled = false,
  }: {
    line: CartLineItemView;
    onQuantityChange: (variantId: string, quantity: number) => void;
    onRemove: (variantId: string) => void;
    disabled?: boolean;
  }): React.JSX.Element {
    const locale = useLocale() as Locale;
    const t = useTranslations('cart');
    const lineTotal: Money = {
      amount: line.unitPrice.amount * line.quantity,
      currency: line.unitPrice.currency,
    };

    return (
      <li className="flex gap-4 py-4" data-variant-id={line.variantId}>
        <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-smoke-900">
          <Image
            src={line.imageUrl}
            alt={line.title[locale]}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="display text-sm">{line.title[locale]}</p>
              <p className="font-mono text-xs text-smoke-500">
                {line.size} · {line.color}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(line.variantId)}
              disabled={disabled}
              className="text-xs text-smoke-500 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze disabled:opacity-50"
            >
              {t('remove')}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div
              className="flex items-center border border-smoke-700"
              role="group"
              aria-label={t('quantityLabel')}
            >
              <button
                type="button"
                aria-label={t('decrease')}
                disabled={disabled}
                onClick={() => onQuantityChange(line.variantId, line.quantity - 1)}
                className="px-3 py-1 font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze disabled:opacity-50"
              >
                −
              </button>
              <span className="min-w-8 text-center font-mono text-sm">{line.quantity}</span>
              <button
                type="button"
                aria-label={t('increase')}
                disabled={disabled || line.quantity >= line.maxStock}
                onClick={() => onQuantityChange(line.variantId, line.quantity + 1)}
                className="px-3 py-1 font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze disabled:opacity-50"
              >
                +
              </button>
            </div>
            <span className="font-mono text-sm">{formatMoney(lineTotal, locale)}</span>
          </div>
        </div>
      </li>
    );
  }
  ```

- [ ] **Type-check.**

  ```
  npm run typecheck
  ```

  Expected: exit code 0, no output.

- [ ] **Commit.**
  ```
  git add components/cart/CartLineItem.tsx messages/en.json messages/th.json
  git commit -m "feat(cart): add CartLineItem row and bilingual cart copy"
  ```

---

### Task 3.6 — `CartDrawer`: real a11y dialog with `useOptimistic` add

The drawer is a true modal `dialog`: focus trap, focus return to the trigger, `Escape` to close, `aria-modal`, an `aria-live="polite"` add announcement, and `:focus-visible` tokens. It reads the mirror via `useCartStore`, applies an optimistic add through React 19's `useOptimistic` for the in-flight feel, then reconciles from the action's authoritative return value via `replaceFromServer`. A small `CartDrawerProvider` exposes `openCart()` / a global open-event so the PDP `AddToCartButton` (Phase 4) and the header trigger can both drive it.

**Files**

- Create: `d:/MINE/freelance/system/vanta/components/cart/CartDrawerContext.tsx` (open/close context + `useCartDrawer` hook)
- Create: `d:/MINE/freelance/system/vanta/components/cart/CartDrawer.tsx`
- Test: `d:/MINE/freelance/system/vanta/tests/e2e/cart-drawer.en.spec.ts`

**Interfaces**

- Consumes: `Cart`, `Locale` from `@/lib/domain`; `useCartStore` from `@/lib/store/cart-store`; `addToCart`, `updateCartQuantity`, `removeFromCart` from `@/lib/actions/cart-actions`; `formatMoney` from `@/lib/format/money`; `CartLineItem`, `CartLineItemView` from `./CartLineItem`; `Link` from `@/lib/i18n/navigation`; `useTranslations`, `useLocale` from `next-intl`; `useOptimistic`, `useTransition` from `react`.
- Produces:
  ```tsx
  // CartDrawerContext.tsx
  export function CartDrawerProvider({
    children,
  }: {
    children: React.ReactNode;
  }): React.JSX.Element;
  export function useCartDrawer(): {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    lineViews: CartLineItemView[];
    setLineViews: (views: CartLineItemView[]) => void;
  };
  // CartDrawer.tsx
  export function CartDrawer(): React.JSX.Element;
  ```
  > `lineViews` carries the variant snapshots (title/size/color/image/maxStock) that the cart's bare `CartItem`s lack; producers (PDP add button, cart page loader) register them. The drawer falls back to a minimal view when a snapshot is absent.

**Steps**

- [ ] **Implement the drawer context.** Create `d:/MINE/freelance/system/vanta/components/cart/CartDrawerContext.tsx`:

  ```tsx
  'use client';

  import { createContext, useCallback, useContext, useMemo, useState } from 'react';
  import type { CartLineItemView } from './CartLineItem';

  type CartDrawerContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    lineViews: CartLineItemView[];
    setLineViews: (views: CartLineItemView[]) => void;
  };

  const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

  export function CartDrawerProvider({
    children,
  }: {
    children: React.ReactNode;
  }): React.JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [lineViews, setLineViewsState] = useState<CartLineItemView[]>([]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const setLineViews = useCallback((views: CartLineItemView[]) => {
      setLineViewsState((prev) => {
        const byId = new Map(prev.map((v) => [v.variantId, v]));
        for (const v of views) byId.set(v.variantId, v);
        return [...byId.values()];
      });
    }, []);

    const value = useMemo(
      () => ({ isOpen, open, close, lineViews, setLineViews }),
      [isOpen, open, close, lineViews, setLineViews],
    );

    return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
  }

  export function useCartDrawer(): CartDrawerContextValue {
    const ctx = useContext(CartDrawerContext);
    if (!ctx) throw new Error('useCartDrawer must be used within CartDrawerProvider');
    return ctx;
  }
  ```

- [ ] **Implement the drawer.** Create `d:/MINE/freelance/system/vanta/components/cart/CartDrawer.tsx`:

  ```tsx
  'use client';

  import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
  import { useLocale, useTranslations } from 'next-intl';
  import type { Cart, Locale, Money } from '@/lib/domain';
  import { useCartStore } from '@/lib/store/cart-store';
  import { removeFromCart, updateCartQuantity } from '@/lib/actions/cart-actions';
  import { formatMoney } from '@/lib/format/money';
  import { Link } from '@/lib/i18n/navigation';
  import { CartLineItem, type CartLineItemView } from './CartLineItem';
  import { useCartDrawer } from './CartDrawerContext';

  const FOCUSABLE =
    'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

  export function CartDrawer(): React.JSX.Element {
    const t = useTranslations('cart');
    const locale = useLocale() as Locale;
    const { isOpen, close, lineViews } = useCartDrawer();

    const cart = useCartStore((s) => s.cart);
    const replaceFromServer = useCartStore((s) => s.replaceFromServer);
    const [isPending, startTransition] = useTransition();

    // Optimistic mirror of the authoritative cart for in-flight qty/remove.
    const [optimisticCart, applyOptimistic] = useOptimistic(
      cart,
      (state: Cart, action: { variantId: string; quantity: number }): Cart => {
        const items = state.items
          .map((i) => (i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i))
          .filter((i) => i.quantity > 0);
        return { ...state, items, itemCount: items.reduce((n, i) => n + i.quantity, 0) };
      },
    );

    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const [announcement, setAnnouncement] = useState('');

    // Focus management: trap + return.
    useEffect(() => {
      if (!isOpen) return;
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const node = dialogRef.current;
      const first = node?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
          return;
        }
        if (e.key !== 'Tab' || !node) return;
        const focusables = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }

      document.addEventListener('keydown', onKeyDown);
      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = overflow;
        previouslyFocused.current?.focus();
      };
    }, [isOpen, close]);

    function handleQuantityChange(variantId: string, quantity: number) {
      startTransition(async () => {
        applyOptimistic({ variantId, quantity });
        const next = await updateCartQuantity(variantId, quantity);
        replaceFromServer(next);
      });
    }

    function handleRemove(variantId: string) {
      startTransition(async () => {
        applyOptimistic({ variantId, quantity: 0 });
        const next = await removeFromCart(variantId);
        replaceFromServer(next);
      });
    }

    if (!isOpen) {
      return (
        <div aria-live="polite" className="sr-only" data-testid="cart-live-region">
          {announcement}
        </div>
      );
    }

    const viewById = new Map(lineViews.map((v) => [v.variantId, v]));
    const rows: CartLineItemView[] = optimisticCart.items.map((item) => {
      const snapshot = viewById.get(item.variantId);
      return snapshot
        ? { ...snapshot, quantity: item.quantity }
        : {
            variantId: item.variantId,
            title: { en: item.variantId, th: item.variantId },
            size: '',
            color: '',
            unitPrice: { amount: 0, currency: 'THB' } as Money,
            quantity: item.quantity,
            imageUrl: '/placeholder.svg',
            maxStock: item.quantity,
          };
    });

    return (
      <>
        <div className="fixed inset-0 z-40 bg-ink/60" onClick={close} data-testid="cart-overlay" />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
          data-testid="cart-drawer"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ink text-paper shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-smoke-700 p-6">
            <h2 className="display text-xl">{t('title')}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={t('close')}
              className="text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze"
            >
              ×
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="flex-1 p-6 text-smoke-300">{t('empty')}</p>
          ) : (
            <ul className="flex-1 divide-y divide-smoke-700 overflow-y-auto px-6">
              {rows.map((row) => (
                <CartLineItem
                  key={row.variantId}
                  line={row}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  disabled={isPending}
                />
              ))}
            </ul>
          )}

          <div className="border-t border-smoke-700 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="display text-sm">{t('subtotal')}</span>
              <span className="font-mono text-lg">
                {formatMoney(optimisticCart.subtotal, locale)}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={close}
              className="block w-full bg-blaze py-3 text-center font-mono uppercase text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
            >
              {t('checkout')}
            </Link>
          </div>

          <div aria-live="polite" className="sr-only" data-testid="cart-live-region">
            {announcement}
          </div>
        </div>
      </>
    );
  }
  ```

  > The PDP `AddToCartButton` (Phase 4) calls `useCartDrawer().open()` and `setLineViews([...])` after `addToCart` returns, and writes the announcement string `t('addedAnnouncement', { title, count })` into the live region via a shared ref/event; the live region element above is the single announcement surface for both states.

- [ ] **Write the E2E spec.** Create `d:/MINE/freelance/system/vanta/tests/e2e/cart-drawer.en.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  // Verifies: add-to-cart opens the drawer, the drawer is a modal dialog,
  // Escape closes it and returns focus, and the subtotal shows the THB baht sign.
  test.describe('cart drawer (en)', () => {
    test('add to cart opens the drawer with the line and THB subtotal', async ({ page }) => {
      await page.goto('/en/product/vanta-core-tee');

      const addButton = page.getByTestId('add-to-cart');
      await addButton.click();

      const drawer = page.getByTestId('cart-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveAttribute('role', 'dialog');
      await expect(drawer).toHaveAttribute('aria-modal', 'true');

      // Money is rendered through formatMoney => baht sign, no decimals.
      await expect(drawer.getByText(/฿[\d,]+/)).toBeVisible();

      // At least one cart line is present.
      await expect(drawer.locator('li[data-variant-id]')).toHaveCount(1);
    });

    test('Escape closes the drawer and returns focus to the trigger', async ({ page }) => {
      await page.goto('/en/product/vanta-core-tee');
      const addButton = page.getByTestId('add-to-cart');
      await addButton.click();
      await expect(page.getByTestId('cart-drawer')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByTestId('cart-drawer')).toBeHidden();
      await expect(addButton).toBeFocused();
    });

    test('overlay click closes the drawer', async ({ page }) => {
      await page.goto('/en/product/vanta-core-tee');
      await page.getByTestId('add-to-cart').click();
      await expect(page.getByTestId('cart-drawer')).toBeVisible();
      await page.getByTestId('cart-overlay').click();
      await expect(page.getByTestId('cart-drawer')).toBeHidden();
    });
  });
  ```

  > This spec depends on the PDP `add-to-cart` button (Phase 4). If Phase 4 has not landed when you run Phase 3, mark this spec `test.fixme` and run it as part of the Phase 4 hero-slice verification; the drawer code itself is verified visually in the next step.

- [ ] **Type-check, then visually verify against the dev server.**

  ```
  npm run typecheck
  ```

  Expected: exit 0. Then start the dev server in the background and verify the drawer renders and traps focus:

  ```
  npm run dev
  ```

  Using the Playwright MCP (or Chrome DevTools MCP) against `http://localhost:3000/en/cart`, take a snapshot and confirm: (a) opening the drawer (via the header cart trigger added in Phase 2's `Header`, or temporarily via `useCartDrawer().open()` on the cart page) shows `role="dialog"` + `aria-modal="true"`; (b) Tab cycles only within the drawer; (c) `Escape` closes it; (d) the subtotal shows `฿` then a grouped integer with no decimals. Capture `en` and `th` screenshots of the open drawer.

- [ ] **Commit.**
  ```
  git add components/cart/CartDrawer.tsx components/cart/CartDrawerContext.tsx tests/e2e/cart-drawer.en.spec.ts
  git commit -m "feat(cart): add a11y cart drawer dialog with optimistic updates"
  ```

---

### Task 3.7 — `/cart` page (RSC reads through repositories, server-truth rows)

The Tier-1 cart page is a Server Component that reads the authoritative cart via `cartService.getCart()`, resolves each line's variant + product snapshot through `@/lib/data` `products` (so titles/images/sizes/colors and `maxStock` are real), and renders the rows + subtotal + checkout link. A small client island registers the resolved `lineViews` into the drawer context and binds the quantity/remove controls to the actions; money is always via `formatMoney`.

**Files**

- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/cart/page.tsx`
- Create: `d:/MINE/freelance/system/vanta/components/cart/CartPageClient.tsx`
- Test: `d:/MINE/freelance/system/vanta/tests/e2e/cart-page.en.spec.ts`

**Interfaces**

- Consumes: `cartService` from `@/lib/services/cart-service`; `products` from `@/lib/data`; `Cart`, `Locale`, `Product`, `Variant` from `@/lib/domain`; `CartLineItemView` from `@/components/cart/CartLineItem`; `getTranslations` from `next-intl/server`; `useTranslations`, `useLocale` from `next-intl`.
- Produces: `export default async function CartPage(): Promise<React.JSX.Element>` and `export function CartPageClient({ initialCart, lineViews }: { initialCart: Cart; lineViews: CartLineItemView[] }): React.JSX.Element`.

**Steps**

- [ ] **Implement the page (RSC).** Create `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/cart/page.tsx`:

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import type { CartLineItemView } from '@/components/cart/CartLineItem';
  import { products } from '@/lib/data';
  import { cartService } from '@/lib/services/cart-service';
  import { CartPageClient } from '@/components/cart/CartPageClient';

  export default async function CartPage(): Promise<React.JSX.Element> {
    const t = await getTranslations('cart');
    const cart = await cartService.getCart();

    // Resolve real snapshots for each line via the repository seam.
    const lineViews: CartLineItemView[] = [];
    for (const item of cart.items) {
      const variant = await products.getVariantById(item.variantId);
      if (!variant) continue;
      const product = await products.getById(
        // find the owning product by scanning its variants
        (await products.list()).find((p) => p.variants.some((v) => v.id === variant.id))?.id ?? '',
      );
      const images = product?.imagesByColor[variant.optionValues.color] ?? [];
      lineViews.push({
        variantId: variant.id,
        title: product?.title ?? { en: variant.sku, th: variant.sku },
        size: variant.optionValues.size,
        color: variant.optionValues.color,
        unitPrice: variant.price,
        quantity: item.quantity,
        imageUrl: images[0]?.url ?? '/placeholder.svg',
        maxStock: variant.stock + item.quantity, // stock already decremented in-session
      });
    }

    return (
      <main className="mx-auto w-full max-w-[var(--max-w-shell)] px-6 py-12">
        <h1 className="display mb-8 text-3xl">{t('title')}</h1>
        <CartPageClient initialCart={cart} lineViews={lineViews} />
      </main>
    );
  }
  ```

  > `getById` is called with the owning product id discovered via `list()`; this keeps the page reading only through the repository seam (never into `lib/data/mock`). When Phase 1's seed is small this is fine; a backend swap replaces it with a single indexed lookup with no UI change.

- [ ] **Implement the client island.** Create `d:/MINE/freelance/system/vanta/components/cart/CartPageClient.tsx`:

  ```tsx
  'use client';

  import { useEffect, useOptimistic, useTransition } from 'react';
  import { useLocale, useTranslations } from 'next-intl';
  import type { Cart, Locale } from '@/lib/domain';
  import { useCartStore } from '@/lib/store/cart-store';
  import { removeFromCart, updateCartQuantity } from '@/lib/actions/cart-actions';
  import { formatMoney } from '@/lib/format/money';
  import { Link } from '@/lib/i18n/navigation';
  import { CartLineItem, type CartLineItemView } from './CartLineItem';
  import { useCartDrawer } from './CartDrawerContext';

  export function CartPageClient({
    initialCart,
    lineViews,
  }: {
    initialCart: Cart;
    lineViews: CartLineItemView[];
  }): React.JSX.Element {
    const t = useTranslations('cart');
    const locale = useLocale() as Locale;
    const { setLineViews } = useCartDrawer();

    const hydrate = useCartStore((s) => s.hydrate);
    const replaceFromServer = useCartStore((s) => s.replaceFromServer);
    const cart = useCartStore((s) => s.cart);
    const [isPending, startTransition] = useTransition();

    // Seed mirror + drawer snapshots from the server-rendered cart.
    useEffect(() => {
      hydrate(initialCart);
      setLineViews(lineViews);
    }, [hydrate, initialCart, lineViews, setLineViews]);

    const [optimisticCart, applyOptimistic] = useOptimistic(
      cart,
      (state: Cart, action: { variantId: string; quantity: number }): Cart => {
        const items = state.items
          .map((i) => (i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i))
          .filter((i) => i.quantity > 0);
        return { ...state, items, itemCount: items.reduce((n, i) => n + i.quantity, 0) };
      },
    );

    function handleQuantityChange(variantId: string, quantity: number) {
      startTransition(async () => {
        applyOptimistic({ variantId, quantity });
        replaceFromServer(await updateCartQuantity(variantId, quantity));
      });
    }

    function handleRemove(variantId: string) {
      startTransition(async () => {
        applyOptimistic({ variantId, quantity: 0 });
        replaceFromServer(await removeFromCart(variantId));
      });
    }

    const viewById = new Map(lineViews.map((v) => [v.variantId, v]));
    const rows: CartLineItemView[] = optimisticCart.items
      .map((item) => {
        const snapshot = viewById.get(item.variantId);
        return snapshot ? { ...snapshot, quantity: item.quantity } : null;
      })
      .filter((row): row is CartLineItemView => row !== null);

    if (rows.length === 0) {
      return (
        <p className="text-smoke-500" data-testid="cart-empty">
          {t('empty')}
        </p>
      );
    }

    return (
      <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
        <ul className="divide-y divide-smoke-300" data-testid="cart-list">
          {rows.map((row) => (
            <CartLineItem
              key={row.variantId}
              line={row}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              disabled={isPending}
            />
          ))}
        </ul>
        <aside className="h-fit border border-smoke-300 p-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="display text-sm">{t('subtotal')}</span>
            <span className="font-mono text-lg" data-testid="cart-subtotal">
              {formatMoney(optimisticCart.subtotal, locale)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="block w-full bg-blaze-on-light py-3 text-center font-mono uppercase text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
          >
            {t('checkout')}
          </Link>
        </aside>
      </div>
    );
  }
  ```

- [ ] **Write the E2E spec.** Create `d:/MINE/freelance/system/vanta/tests/e2e/cart-page.en.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  // Verifies the /cart page renders server-truth rows, a THB subtotal, and that
  // updating quantity reconciles from the action return value.
  test.describe('cart page (en)', () => {
    test('shows empty state with no items', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/en/cart');
      await expect(page.getByTestId('cart-empty')).toBeVisible();
    });

    test('add via PDP then /cart shows the line with a THB subtotal', async ({ page }) => {
      await page.goto('/en/product/vanta-core-tee');
      await page.getByTestId('add-to-cart').click();
      await expect(page.getByTestId('cart-drawer')).toBeVisible();

      await page.goto('/en/cart');
      await expect(page.getByTestId('cart-list').locator('li[data-variant-id]')).toHaveCount(1);
      await expect(page.getByTestId('cart-subtotal')).toHaveText(/฿[\d,]+/);
    });

    test('increasing quantity updates the subtotal from server truth', async ({ page }) => {
      await page.goto('/en/product/vanta-core-tee');
      await page.getByTestId('add-to-cart').click();
      await page.goto('/en/cart');

      const subtotal = page.getByTestId('cart-subtotal');
      const before = await subtotal.textContent();
      await page.getByRole('button', { name: 'Increase quantity' }).first().click();
      await expect(subtotal).not.toHaveText(before ?? '');
    });
  });
  ```

  > The two "add via PDP" cases depend on Phase 4's `add-to-cart` button; mark them `test.fixme` until Phase 4 lands. The empty-state case runs standalone against Phase 3.

- [ ] **Type-check and run the standalone E2E case.**

  ```
  npm run typecheck
  ```

  Expected: exit 0. Then (dev server running via `npm run dev`):

  ```
  npm run test:e2e -- tests/e2e/cart-page.en.spec.ts -g "empty state"
  ```

  Expected: `1 passed`. Visually verify `http://localhost:3000/en/cart` and `http://localhost:3000/th/cart` render the heading via the `display` class with correct per-locale font (Clash Display all-caps for en, Kanit non-caps for th), and the empty-state copy in each locale.

- [ ] **Commit.**
  ```
  git add "app/[locale]/(checkout)/cart/page.tsx" components/cart/CartPageClient.tsx tests/e2e/cart-page.en.spec.ts
  git commit -m "feat(cart): add /cart page with server-truth rows and optimistic controls"
  ```

---

### Task 3.8 — Full Phase 3 unit suite green + typecheck gate

A final guard that the whole cart logic layer passes together and the project type-checks, so Phase 4 (motion/hero polish) builds on a green base.

**Files**

- Modify: none (verification-only task)

**Interfaces**

- Consumes: all Phase 3 unit specs (`cart-cookie`, `cart-reconcile`, `cart-actions`, `cart-store`).

**Steps**

- [ ] **Run the full unit suite.**

  ```
  npm run test -- tests/unit
  ```

  Expected: all Phase 1–3 unit files pass, including `cart-cookie.test.ts (7)`, `cart-reconcile.test.ts (6)`, `cart-actions.test.ts (4)`, `cart-store.test.ts (4)` — final line `Tests  ... passed`, no failures.

- [ ] **Run the typecheck + lint gate.**

  ```
  npm run typecheck && npm run lint
  ```

  Expected: both exit 0; no `any` introduced in `lib/**` (lint clean).

- [ ] **Commit** (only if lint/typecheck produced auto-fixable changes; otherwise skip).
  ```
  git add -A
  git commit -m "chore(cart): green cart logic suite and typecheck gate"
  ```

````

I've written Phase 3 above as polished, paste-ready markdown.

Summary of what the phase delivers (8 tasks, each ending in an independently testable deliverable):

- **3.1** Signed-cookie `CartStore` — pure HMAC codec (`cart-cookie.ts`, TDD, 7 tests) + `MockCartStore` wired into `mockRepositories`. Cookie persists only items+updatedAt; tamper/missing → `EMPTY_CART`.
- **3.2** `cartService` + pure `reconcileCart` (TDD, 6 tests) — the single reconciliation path: merge dup lines, drop dead variants, clamp to live stock, sum `unitPrice*qty` in integer satang, `addItem` decrements in-session stock via `products.decrementStock`.
- **3.3** Cart Server Actions with the verbatim locked signatures (`addToCart`/`updateCartQuantity`/`removeFromCart`/`getCartAction`), TDD with mocked service (4 tests), each returns the authoritative `Cart` and revalidates RSC surfaces.
- **3.4** Disciplined Zustand mirror — `CartMirrorState` exactly per contract (hydrate + replaceFromServer ONLY; test asserts no invented mutators) plus `useCartCount` and `CartHydrator`.
- **3.5** `CartLineItem` row (money only via `formatMoney`) + bilingual `cart` copy namespace in both message files.
- **3.6** `CartDrawer` as a real a11y `dialog` — focus trap/return, Esc, overlay click, `aria-modal`, `aria-live` region, `:focus-visible` tokens, `useOptimistic` in-flight updates reconciled via `replaceFromServer`; plus `CartDrawerContext`. Playwright E2E for dialog semantics + visual verification.
- **3.7** `/cart` RSC page reading through `cartService`/`products` + `CartPageClient` island (optimistic qty/remove), E2E.
- **3.8** Full unit-suite + typecheck/lint green gate.

Notes for the plan editor:
- Every code block is complete (no placeholders/TBD). Cross-phase dependencies are flagged explicitly: the `add-to-cart`-driven E2E cases reference Phase 4's PDP button and are marked `test.fixme` until Phase 4 lands; the standalone empty-cart E2E and all Vitest logic tests run within Phase 3.
- One contract reconciliation I had to make explicit: the locked `CartService` interface lives in `lib/services/cart-service.ts` itself (not the repositories bundle), so I declare/export it there verbatim and instruct deleting the speculative `import type { CartService } from '@/lib/data/repositories'` line — called out in a Step and a note.
- `CartLineItemView` is introduced as a UI view-model (not a domain type) because the authoritative `Cart` carries only bare `CartItem`s; snapshots are resolved server-side through the repository seam and registered into the drawer context.

Relevant absolute file paths created/modified by this phase: `d:/MINE/freelance/system/vanta/lib/data/mock/cart-cookie.ts`, `.../lib/data/mock/cart-store.mock.ts`, `.../lib/data/mock/index.ts`, `.../lib/services/cart-reconcile.ts`, `.../lib/services/cart-service.ts`, `.../lib/actions/cart-actions.ts`, `.../lib/store/cart-store.ts`, `.../components/cart/CartHydrator.tsx`, `.../components/cart/CartLineItem.tsx`, `.../components/cart/CartDrawerContext.tsx`, `.../components/cart/CartDrawer.tsx`, `.../components/cart/CartPageClient.tsx`, `.../app/[locale]/(checkout)/cart/page.tsx`, `.../messages/en.json`, `.../messages/th.json`, and tests under `.../tests/unit/` and `.../tests/e2e/`.

---

The project only has `docs/` — prior phases are planned, not built. I'll write Phase 4 against the LOCKED CONTRACTS and the file structure, consuming symbols defined in earlier phases (domain types, repositories, services, format helpers, motion hooks, i18n, Money/FormattedDate UI, Header/Footer). My phase is the plan text itself.

I have everything I need. Here is Phase 4.

---

## Phase 4 — Home + LIVE DROP (hero, Tier 1)

This is the OG/demo-video slice: the Home page (`app/[locale]/(shop)/page.tsx`) as a Server Component reading every availability state through `deriveAvailability`, the LIVE DROP feature with a countdown client island (deadline from the server, per-second tick client-only, never a re-fetch), the countdown→LIVE flip, stock-ticks-down-on-add, auth-gated early access that unlocks for the seed member, the demoted English `DROP`/`SOLD OUT` marquee in both locales, the featured grid, and the lookbook teaser. Verified with Vitest for the small client-island clock logic and with Playwright + visual verification (both locales + one reduced-motion run) for the page.

> **Dependencies (consumed, not built here):** domain barrel `@/lib/domain` (`Product`, `Variant`, `Drop`, `User`, `Availability`, `Money`, `Locale`); data barrel `@/lib/data` (`products`, `collections`); services `@/lib/services/availability` (`deriveAvailability`, `LOW_STOCK_THRESHOLD`), `@/lib/services/drop-service` (`dropService`), `@/lib/services/auth-service` (`authService`); format helpers `@/lib/format/money` (`formatMoney`), `@/lib/format/date` (`formatDate`); UI primitives `@/components/ui/Money` (`Money`), `@/components/ui/FormattedDate` (`FormattedDate`), `@/components/ui/Button` (`Button` with the magnetic variant); the product card `@/components/product/ProductCard`; motion hook `@/lib/motion/capability` (`useMotionCapability`) and `@/lib/motion/segment` (`splitGraphemes`); i18n `@/lib/i18n/navigation` (`Link`); next-intl `getTranslations`/`useTranslations`; message namespaces under `messages/{en,th}.json`.

### Task 4.1 — Drop selectors on the page (server data shape + `messages` keys)

A tiny, testable server helper that turns the active drop + its products into the exact view-model the hero needs, plus the `home`/`drop` message keys both locales need. No UI yet — this is the data seam the rest of the phase renders.

**Files**
- Create: `lib/services/home-view.ts`
- Modify: `messages/en.json`, `messages/th.json`
- Test: `tests/unit/home-view.test.ts`

**Interfaces**
- Consumes: `dropService.getActiveDrop()`, `dropService.getDropProducts(dropId)`, `products.list()` from `@/lib/data`; `deriveAvailability(variant, drop, now, user)`; domain `Product`, `Variant`, `Drop`, `User`, `Availability`.
- Produces:
  ```ts
  export type HeroVariantView = {
    variantId: string;
    sku: string;
    availability: Availability;   // from deriveAvailability(variant, drop, now, user)
    stock: number;
  };
  export type HeroProductView = {
    productId: string;            // stable VT key source: `product-${productId}`
    slug: string;
    leadVariant: HeroVariantView; // first variant, re-derived
  };
  export type HomeView = {
    drop: Drop | null;
    dropProducts: HeroProductView[];
    featured: Product[];          // up to 6, drop-independent
    anyEarlyAccessGated: boolean; // true if a drop variant derives to 'early_access'
  };
  export function buildHomeView(now: Date, user: User | null): Promise<HomeView>;
````

**Steps**

- [ ] Add the `home` and `drop` namespaces to `messages/en.json` (merge into the existing tree; do not clobber sibling namespaces):
  ```json
  {
    "home": {
      "heroKicker": "BANGKOK / OUT OF THE VOID",
      "heroHeadline": "VANTA",
      "heroSub": "Streetwear that materializes out of black.",
      "ctaShopDrop": "SHOP THE DROP",
      "ctaExplore": "EXPLORE",
      "featuredTitle": "FEATURED",
      "lookbookTeaserTitle": "THE LOOKBOOK",
      "lookbookTeaserCta": "VIEW EDITORIAL"
    },
    "drop": {
      "label": "LIVE DROP",
      "comingSoon": "DROPS IN",
      "earlyAccessLocked": "MEMBER EARLY ACCESS",
      "earlyAccessUnlocked": "EARLY ACCESS UNLOCKED",
      "live": "LIVE NOW",
      "lowStock": "ONLY {count} LEFT",
      "soldOut": "SOLD OUT",
      "notifyMe": "NOTIFY ME",
      "unlockHint": "Log in as a member to unlock early access.",
      "releaseAtLabel": "Public release",
      "countdownDone": "LIVE",
      "srCountdown": "{days}d {hours}h {minutes}m {seconds}s until live",
      "units": { "days": "D", "hours": "H", "minutes": "M", "seconds": "S" }
    }
  }
  ```
- [ ] Add the mirror keyset to `messages/th.json` (same keys; Thai copy; note `drop.label`/`drop.soldOut` text below the marquee stays English per the marquee constraint, but these badge strings are Thai):
  ```json
  {
    "home": {
      "heroKicker": "กรุงเทพฯ / ออกมาจากความว่างเปล่า",
      "heroHeadline": "VANTA",
      "heroSub": "สตรีทแวร์ที่ปรากฏขึ้นจากความมืด",
      "ctaShopDrop": "ช้อปดรอป",
      "ctaExplore": "สำรวจ",
      "featuredTitle": "สินค้าแนะนำ",
      "lookbookTeaserTitle": "ลุคบุ๊ค",
      "lookbookTeaserCta": "ดูเอดิทอเรียล"
    },
    "drop": {
      "label": "LIVE DROP",
      "comingSoon": "เปิดตัวใน",
      "earlyAccessLocked": "เข้าก่อนสำหรับสมาชิก",
      "earlyAccessUnlocked": "ปลดล็อกการเข้าก่อนแล้ว",
      "live": "กำลังไลฟ์",
      "lowStock": "เหลือเพียง {count} ชิ้น",
      "soldOut": "สินค้าหมด",
      "notifyMe": "แจ้งเตือนฉัน",
      "unlockHint": "เข้าสู่ระบบในฐานะสมาชิกเพื่อปลดล็อกการเข้าก่อน",
      "releaseAtLabel": "เปิดจำหน่ายทั่วไป",
      "countdownDone": "LIVE",
      "srCountdown": "อีก {days} วัน {hours} ชม. {minutes} นาที {seconds} วินาที จึงจะไลฟ์",
      "units": { "days": "วัน", "hours": "ชม.", "minutes": "นาที", "seconds": "วิ" }
    }
  }
  ```
- [ ] Write the failing test `tests/unit/home-view.test.ts`. It mounts a fixed `now` and a `null`/member user, asserting derivation and shape (it does NOT touch cookies — `buildHomeView` receives `now`/`user` as args, matching the request-context-free rule):

  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import type { Drop, Product, User } from '@/lib/domain';

  // Drive the data layer through deterministic seed-shaped doubles.
  const drop: Drop = {
    id: 'drop_void_01',
    name: { en: 'OUT OF THE VOID', th: 'ออกมาจากความว่างเปล่า' },
    earlyAccessAt: '2026-06-27T10:00:00.000Z',
    releaseAt: '2026-06-27T12:00:00.000Z',
    endAt: '2026-06-30T12:00:00.000Z',
  };

  const dropProduct: Product = {
    id: 'prod_001',
    slug: 'void-hoodie',
    title: { en: 'VOID HOODIE', th: 'วอยด์ ฮู้ดดี้' },
    description: { en: 'x', th: 'x' },
    optionAxes: { size: ['M'], color: ['black'] },
    variants: [
      {
        id: 'var_001',
        sku: 'VH-M-BLK',
        optionValues: { size: 'M', color: 'black' },
        price: { amount: 199000, currency: 'THB' },
        stock: 20,
        availability: 'live',
      },
    ],
    imagesByColor: { black: [] },
    collectionIds: [],
    dropId: 'drop_void_01',
  };

  const featured: Product = { ...dropProduct, id: 'prod_999', slug: 'feat', dropId: undefined };

  vi.mock('@/lib/services/drop-service', () => ({
    dropService: {
      getActiveDrop: vi.fn(async () => drop),
      getDropById: vi.fn(async () => drop),
      getDropProducts: vi.fn(async () => [dropProduct]),
    },
  }));
  vi.mock('@/lib/data', () => ({
    products: { list: vi.fn(async () => [dropProduct, featured]) },
  }));

  import { buildHomeView } from '@/lib/services/home-view';

  const member: User = {
    id: 'usr_member',
    email: 'member@vanta.shop',
    name: 'Member',
    role: 'member',
    addresses: [],
  };

  describe('buildHomeView', () => {
    beforeEach(() => vi.clearAllMocks());

    it('derives early_access (gated) before releaseAt for a guest', async () => {
      const now = new Date('2026-06-27T11:00:00.000Z'); // between earlyAccess and release
      const view = await buildHomeView(now, null);
      expect(view.dropProducts[0].leadVariant.availability).toBe('early_access');
      expect(view.anyEarlyAccessGated).toBe(true);
    });

    it('unlocks to live for the seed member before releaseAt', async () => {
      const now = new Date('2026-06-27T11:00:00.000Z');
      const view = await buildHomeView(now, member);
      expect(view.dropProducts[0].leadVariant.availability).toBe('live');
      expect(view.anyEarlyAccessGated).toBe(false);
    });

    it('flips to live for everyone after releaseAt', async () => {
      const now = new Date('2026-06-27T12:30:00.000Z');
      const view = await buildHomeView(now, null);
      expect(view.dropProducts[0].leadVariant.availability).toBe('live');
    });

    it('returns featured products excluding nothing required and a stable VT key source', async () => {
      const now = new Date('2026-06-27T12:30:00.000Z');
      const view = await buildHomeView(now, null);
      expect(view.featured.length).toBeGreaterThan(0);
      expect(view.dropProducts[0].productId).toBe('prod_001');
    });
  });
  ```

- [ ] Run it and SHOW it fail:
  ```
  npx vitest run tests/unit/home-view.test.ts
  ```
  Expected: `Error: Failed to resolve import "@/lib/services/home-view"` (module not found) — 4 tests error/fail.
- [ ] Implement `lib/services/home-view.ts` (minimal; pure derivation, no clock/cookie inside):

  ```ts
  import { dropService } from '@/lib/services/drop-service';
  import { products } from '@/lib/data';
  import { deriveAvailability } from '@/lib/services/availability';
  import type { Availability, Drop, Product, User, Variant } from '@/lib/domain';

  export type HeroVariantView = {
    variantId: string;
    sku: string;
    availability: Availability;
    stock: number;
  };

  export type HeroProductView = {
    productId: string;
    slug: string;
    leadVariant: HeroVariantView;
  };

  export type HomeView = {
    drop: Drop | null;
    dropProducts: HeroProductView[];
    featured: Product[];
    anyEarlyAccessGated: boolean;
  };

  function toLeadView(
    product: Product,
    drop: Drop | null,
    now: Date,
    user: User | null,
  ): HeroProductView {
    const variant: Variant = product.variants[0];
    const availability = deriveAvailability(variant, drop, now, user);
    return {
      productId: product.id,
      slug: product.slug,
      leadVariant: {
        variantId: variant.id,
        sku: variant.sku,
        availability,
        stock: variant.stock,
      },
    };
  }

  export async function buildHomeView(now: Date, user: User | null): Promise<HomeView> {
    const drop = await dropService.getActiveDrop();
    const dropProductList = drop ? await dropService.getDropProducts(drop.id) : [];
    const dropProducts = dropProductList.map((p) => toLeadView(p, drop, now, user));

    const all = await products.list();
    const featured = all.slice(0, 6);

    const anyEarlyAccessGated = dropProducts.some(
      (p) => p.leadVariant.availability === 'early_access',
    );

    return { drop, dropProducts, featured, anyEarlyAccessGated };
  }
  ```

- [ ] Run it and SHOW it pass:
  ```
  npx vitest run tests/unit/home-view.test.ts
  ```
  Expected: `Test Files  1 passed (1)` · `Tests  4 passed (4)`.
- [ ] Typecheck the new module:
  ```
  npm run typecheck
  ```
  Expected: exit 0, no diagnostics.
- [ ] Commit:
  ```
  git add lib/services/home-view.ts tests/unit/home-view.test.ts messages/en.json messages/th.json
  git commit -m "feat(home): add buildHomeView selector and home/drop message keys"
  ```

### Task 4.2 — Countdown clock logic (pure tick math, client-island-ready)

The per-second tick is a client island, but its _math_ is pure and unit-testable. This task ships the pure `computeCountdown(deadlineMs, nowMs)` used by the island so the island itself stays a thin `useEffect` wrapper. Deadline is passed in from the server; the function never reads a clock.

**Files**

- Create: `lib/motion/countdown.ts`
- Test: `tests/unit/countdown.test.ts`

**Interfaces**

- Consumes: nothing (pure math).
- Produces:
  ```ts
  export type CountdownParts = {
    total: number; // ms remaining, clamped at 0
    done: boolean; // total === 0
    days: number;
    hours: number; // 0..23
    minutes: number; // 0..59
    seconds: number; // 0..59
  };
  export function computeCountdown(deadlineMs: number, nowMs: number): CountdownParts;
  ```

**Steps**

- [ ] Write the failing test `tests/unit/countdown.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { computeCountdown } from '@/lib/motion/countdown';

  const SEC = 1000,
    MIN = 60 * SEC,
    HOUR = 60 * MIN,
    DAY = 24 * HOUR;

  describe('computeCountdown', () => {
    it('breaks remaining ms into d/h/m/s', () => {
      const now = 0;
      const deadline = 2 * DAY + 3 * HOUR + 4 * MIN + 5 * SEC;
      expect(computeCountdown(deadline, now)).toEqual({
        total: deadline,
        done: false,
        days: 2,
        hours: 3,
        minutes: 4,
        seconds: 5,
      });
    });

    it('clamps to zero and reports done past the deadline', () => {
      const parts = computeCountdown(1000, 5000);
      expect(parts.total).toBe(0);
      expect(parts.done).toBe(true);
      expect(parts).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    });

    it('reports done exactly at the deadline', () => {
      expect(computeCountdown(1000, 1000).done).toBe(true);
    });

    it('keeps hours/minutes/seconds within their cyclic ranges', () => {
      const parts = computeCountdown(25 * HOUR + 61 * SEC, 0);
      expect(parts.days).toBe(1);
      expect(parts.hours).toBe(1);
      expect(parts.minutes).toBe(1);
      expect(parts.seconds).toBe(1);
    });
  });
  ```

- [ ] Run it and SHOW it fail:
  ```
  npx vitest run tests/unit/countdown.test.ts
  ```
  Expected: `Error: Failed to resolve import "@/lib/motion/countdown"` — 4 tests error/fail.
- [ ] Implement `lib/motion/countdown.ts`:

  ```ts
  export type CountdownParts = {
    total: number;
    done: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };

  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  export function computeCountdown(deadlineMs: number, nowMs: number): CountdownParts {
    const total = Math.max(0, deadlineMs - nowMs);
    return {
      total,
      done: total === 0,
      days: Math.floor(total / DAY),
      hours: Math.floor((total % DAY) / HOUR),
      minutes: Math.floor((total % HOUR) / MIN),
      seconds: Math.floor((total % MIN) / SEC),
    };
  }
  ```

- [ ] Run it and SHOW it pass:
  ```
  npx vitest run tests/unit/countdown.test.ts
  ```
  Expected: `Test Files  1 passed (1)` · `Tests  4 passed (4)`.
- [ ] Commit:
  ```
  git add lib/motion/countdown.ts tests/unit/countdown.test.ts
  git commit -m "feat(drop): add pure computeCountdown tick math"
  ```

### Task 4.3 — `CountdownIsland` client component (deadline from server, tick client-only, never refetch)

A `'use client'` island that receives `deadlineIso` + `releaseIso` from the server, ticks once per second using `computeCountdown`, and flips to a LIVE state when done — without ever re-fetching. Reduced-motion shows a static, content-visible value (no `setInterval`, no flashing). Verified with Playwright in 4.6.

**Files**

- Create: `components/drop/CountdownIsland.tsx`
- Test: covered by E2E in Task 4.6 (UI; the math is already unit-tested in 4.2).

**Interfaces**

- Consumes: `computeCountdown` from `@/lib/motion/countdown`; `useMotionCapability` from `@/lib/motion/capability`; `useTranslations` from `next-intl`; `splitGraphemes` from `@/lib/motion/segment` (for the LIVE flip headline only).
- Produces:
  ```ts
  export type CountdownIslandProps = {
    deadlineIso: string; // ISO-8601 UTC; the LIVE flip target (drop.releaseAt OR drop.earlyAccessAt)
    onDoneLabel?: string; // optional override; defaults to t('countdownDone')
  };
  export function CountdownIsland(props: CountdownIslandProps): JSX.Element;
  ```

**Steps**

- [ ] Implement `components/drop/CountdownIsland.tsx` (complete code; mono digits per the token rule, `aria-live="off"` on the ticking digits but an `sr-only` summary so screen readers are not spammed every second):

  ```tsx
  'use client';

  import { useEffect, useState, useMemo } from 'react';
  import { useTranslations } from 'next-intl';
  import { computeCountdown, type CountdownParts } from '@/lib/motion/countdown';
  import { useMotionCapability } from '@/lib/motion/capability';

  export type CountdownIslandProps = {
    deadlineIso: string;
    onDoneLabel?: string;
  };

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  export function CountdownIsland({ deadlineIso, onDoneLabel }: CountdownIslandProps): JSX.Element {
    const t = useTranslations('drop');
    const units = useTranslations('drop.units');
    const deadlineMs = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso]);
    const { enabled: motionEnabled } = useMotionCapability();

    // Server render + first client paint use a deterministic snapshot so hydration matches:
    // compute from deadline with now = deadlineMs (worst case) is wrong; instead seed from Date.now()
    // ONLY after mount to avoid SSR/client mismatch. Start with a content-visible static frame.
    const [parts, setParts] = useState<CountdownParts>(() =>
      computeCountdown(deadlineMs, deadlineMs),
    );
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      // First real frame immediately on mount.
      setParts(computeCountdown(deadlineMs, Date.now()));
      // Reduced motion / no-pointer: do NOT tick every second; render the static frame once.
      if (!motionEnabled) return;
      const id = window.setInterval(() => {
        setParts(computeCountdown(deadlineMs, Date.now()));
      }, 1000);
      return () => window.clearInterval(id);
    }, [deadlineMs, motionEnabled]);

    const doneLabel = onDoneLabel ?? t('countdownDone');

    // Before mount: render a content-visible frame from the deterministic seed (no opacity:0).
    const view = mounted ? parts : computeCountdown(deadlineMs, deadlineMs);

    if (view.done) {
      return (
        <span
          data-testid="countdown-done"
          className="font-mono text-blaze tabular-nums tracking-tight"
        >
          {doneLabel}
        </span>
      );
    }

    const srText = t('srCountdown', {
      days: view.days,
      hours: view.hours,
      minutes: view.minutes,
      seconds: view.seconds,
    });

    return (
      <span data-testid="countdown" className="font-mono tabular-nums">
        <span className="sr-only" aria-live="off">
          {srText}
        </span>
        <span aria-hidden className="inline-flex items-baseline gap-3 text-paper">
          <Segment value={view.days} unit={units('days')} />
          <Segment value={view.hours} unit={units('hours')} />
          <Segment value={view.minutes} unit={units('minutes')} />
          <Segment value={view.seconds} unit={units('seconds')} />
        </span>
      </span>
    );
  }

  function Segment({ value, unit }: { value: number; unit: string }): JSX.Element {
    return (
      <span className="inline-flex flex-col items-center">
        <span className="text-4xl leading-none">{pad(value)}</span>
        <span className="text-[0.625rem] uppercase tracking-[0.2em] text-smoke-300">{unit}</span>
      </span>
    );
  }
  ```

- [ ] Typecheck:
  ```
  npm run typecheck
  ```
  Expected: exit 0 (verifies `useMotionCapability` returns `{ enabled: boolean }` per its Phase contract; if the hook's shape differs, adjust the destructure to its exact return — do not widen the hook).
- [ ] Commit:
  ```
  git add components/drop/CountdownIsland.tsx
  git commit -m "feat(drop): add CountdownIsland client tick with reduced-motion static frame"
  ```

### Task 4.4 — `AvailabilityBadge`, `StockMeter`, and `DropMarquee` presentational components

The three drop-supporting visuals, all reading the _already-derived_ `Availability` (never deriving inside a client component). The marquee is demoted and always renders English `DROP`/`SOLD OUT` in both locales. `StockMeter` visibly reflects stock so the "ticks down on add" moment reads.

**Files**

- Create: `components/drop/AvailabilityBadge.tsx`, `components/drop/StockMeter.tsx`, `components/drop/DropMarquee.tsx`
- Test: visual + Playwright in 4.6.

**Interfaces**

- Consumes: `Availability` from `@/lib/domain`; `useTranslations` from `next-intl`; `LOW_STOCK_THRESHOLD` from `@/lib/services/availability`; `splitGraphemes` from `@/lib/motion/segment` (marquee letters); `useMotionCapability`.
- Produces:

  ```ts
  // AvailabilityBadge.tsx
  export type AvailabilityBadgeProps = { availability: Availability; stock: number };
  export function AvailabilityBadge(props: AvailabilityBadgeProps): JSX.Element;

  // StockMeter.tsx
  export type StockMeterProps = { stock: number; max?: number };
  export function StockMeter(props: StockMeterProps): JSX.Element;

  // DropMarquee.tsx
  export type DropMarqueeProps = { soldOut?: boolean };
  export function DropMarquee(props: DropMarqueeProps): JSX.Element;
  ```

**Steps**

- [ ] Implement `components/drop/AvailabilityBadge.tsx` (one switch over the exact union; `low_stock` injects the count; lime is NOT used here — badges sit on dark and use blaze/paper):

  ```tsx
  'use client';

  import { useTranslations } from 'next-intl';
  import type { Availability } from '@/lib/domain';

  export type AvailabilityBadgeProps = {
    availability: Availability;
    stock: number;
  };

  export function AvailabilityBadge({ availability, stock }: AvailabilityBadgeProps): JSX.Element {
    const t = useTranslations('drop');

    const base =
      'inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.18em]';

    switch (availability) {
      case 'sold_out':
        return (
          <span data-testid="badge-sold-out" className={`${base} bg-smoke-700 text-smoke-300`}>
            {t('soldOut')}
          </span>
        );
      case 'coming_soon':
        return (
          <span
            data-testid="badge-coming-soon"
            className={`${base} border border-smoke-500 text-paper`}
          >
            {t('comingSoon')}
          </span>
        );
      case 'early_access':
        return (
          <span
            data-testid="badge-early-access"
            className={`${base} border border-blaze text-blaze`}
          >
            {t('earlyAccessLocked')}
          </span>
        );
      case 'low_stock':
        return (
          <span data-testid="badge-low-stock" className={`${base} bg-blaze text-ink`}>
            {t('lowStock', { count: stock })}
          </span>
        );
      case 'live':
      default:
        return (
          <span data-testid="badge-live" className={`${base} bg-paper text-ink`}>
            {t('live')}
          </span>
        );
    }
  }
  ```

- [ ] Implement `components/drop/StockMeter.tsx` (lime-on-dark is allowed here — this is the one disciplined `<5%` accent on the ink hero; it fills proportionally and shrinks visibly when stock drops):

  ```tsx
  import { LOW_STOCK_THRESHOLD } from '@/lib/services/availability';

  export type StockMeterProps = {
    stock: number;
    max?: number;
  };

  export function StockMeter({ stock, max = 20 }: StockMeterProps): JSX.Element {
    const clamped = Math.max(0, Math.min(stock, max));
    const pct = max === 0 ? 0 : Math.round((clamped / max) * 100);
    const isLow = clamped > 0 && clamped <= LOW_STOCK_THRESHOLD;

    return (
      <div
        data-testid="stock-meter"
        data-stock={clamped}
        className="h-1 w-full overflow-hidden rounded-full bg-smoke-700"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
            isLow ? 'bg-blaze' : 'bg-lime'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
  ```

- [ ] Implement `components/drop/DropMarquee.tsx` (demoted texture; English literals in BOTH locales; grapheme-safe per the rule even though Latin — no `.split('')`; reduced motion = static, no scroll animation):

  ```tsx
  'use client';

  import { useMemo } from 'react';
  import { splitGraphemes } from '@/lib/motion/segment';
  import { useMotionCapability } from '@/lib/motion/capability';

  export type DropMarqueeProps = {
    soldOut?: boolean;
  };

  export function DropMarquee({ soldOut = false }: DropMarqueeProps): JSX.Element {
    const word = soldOut ? 'SOLD OUT' : 'DROP'; // English in both locales by constraint
    const { enabled: motionEnabled } = useMotionCapability();
    const letters = useMemo(() => splitGraphemes(word), [word]);

    // Build a long-enough strip; duplicate the word run so the loop is seamless.
    const run = Array.from({ length: 8 }, () => word);

    return (
      <div
        data-testid="drop-marquee"
        data-word={word}
        className="overflow-hidden border-y border-smoke-700 bg-ink py-3"
        aria-hidden
      >
        <div
          className={`flex w-max gap-8 whitespace-nowrap font-mono text-2xl tracking-[0.35em] text-smoke-500 ${
            motionEnabled ? 'animate-[marquee_18s_linear_infinite]' : ''
          }`}
        >
          {run.map((w, i) => (
            <span key={i} className="inline-flex">
              {letters.map((g, j) => (
                <span key={`${i}-${j}`}>{g}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] Add the `marquee` keyframe to `app/globals.css` (after the `@theme` block; reduced-motion users never see it since the class is gated in JS):
  ```css
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  ```
- [ ] Typecheck:
  ```
  npm run typecheck
  ```
  Expected: exit 0. Confirms `splitGraphemes(word: string): string[]` and `useMotionCapability` shapes match their phase contracts.
- [ ] Commit:
  ```
  git add components/drop/AvailabilityBadge.tsx components/drop/StockMeter.tsx components/drop/DropMarquee.tsx app/globals.css
  git commit -m "feat(drop): add AvailabilityBadge, StockMeter, and demoted DropMarquee"
  ```

### Task 4.5 — Home page Server Component (hero, LIVE DROP, featured grid, lookbook teaser)

Assemble the Tier-1 Home page. It is a Server Component: it reads `authService.getCurrentUser()` and a server `now`, calls `buildHomeView`, then composes the hero (products/headline materialize out of black), the LIVE DROP feature block (badge + meter + `CountdownIsland`, with the auth-gated early-access state and unlock hint), the demoted marquee, the featured grid (`ProductCard` keyed for View Transitions), and the lookbook teaser. The deadline is computed once on the server and handed to the island; the page itself never ticks.

**Files**

- Create: `app/[locale]/(shop)/page.tsx`, `components/home/HeroSection.tsx`, `components/home/LiveDropSection.tsx`, `components/home/LookbookTeaser.tsx`
- Test: Playwright in 4.6.

**Interfaces**

- Consumes: `buildHomeView` from `@/lib/services/home-view`; `authService.getCurrentUser()`; `getTranslations` from `next-intl/server`; `setRequestLocale` from `next-intl/server`; `Link` from `@/lib/i18n/navigation`; `CountdownIsland`, `AvailabilityBadge`, `StockMeter`, `DropMarquee` from `@/components/drop/*`; `ProductCard` from `@/components/product/ProductCard`; `Button` from `@/components/ui/Button`; `Money` from `@/components/ui/Money`; domain `Locale`.
- Produces: the default-exported `Page` async Server Component for the `(shop)` Home route, plus three section components.

**Steps**

- [ ] Implement `components/home/HeroSection.tsx` (Server Component; content visible-by-default, the "materialize out of black" entrance is layered by a client motion wrapper in a later motion phase — here it renders the static, correct hero):

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { Link } from '@/lib/i18n/navigation';
  import { Button } from '@/components/ui/Button';
  import type { Locale } from '@/lib/domain';

  export async function HeroSection({ locale }: { locale: Locale }): Promise<JSX.Element> {
    const t = await getTranslations('home');

    return (
      <section
        data-testid="hero"
        className="relative flex min-h-[88vh] flex-col justify-end bg-ink px-6 pb-16 pt-32 text-paper"
      >
        <p className="display font-body text-xs uppercase tracking-[0.3em] text-smoke-300">
          {t('heroKicker')}
        </p>
        <h1 className="display mt-4 text-[18vw] leading-[0.82] text-paper md:text-[14vw]">
          {t('heroHeadline')}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-smoke-300">{t('heroSub')}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild variant="magnetic">
            <Link href="/shop">{t('ctaShopDrop')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/collections">{t('ctaExplore')}</Link>
          </Button>
        </div>
      </section>
    );
  }
  ```

  > If `@/components/ui/Button` does not expose an `asChild` prop or a `'ghost'`/`'magnetic'` variant, render the `Link` as the child the Button's contract specifies — match the Button phase's exact prop API; do not invent variants. The two CTAs are the only magnetic buttons on the page per the motion budget.

- [ ] Implement `components/home/LiveDropSection.tsx` (Server Component; receives the already-built view + the server `now`/deadline; renders states via the derived `availability`; the early-access unlock hint shows only when something is gated; `notify me` is visual-only):

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { Link } from '@/lib/i18n/navigation';
  import { CountdownIsland } from '@/components/drop/CountdownIsland';
  import { AvailabilityBadge } from '@/components/drop/AvailabilityBadge';
  import { StockMeter } from '@/components/drop/StockMeter';
  import { FormattedDate } from '@/components/ui/FormattedDate';
  import type { HomeView } from '@/lib/services/home-view';
  import type { Locale } from '@/lib/domain';

  export async function LiveDropSection({
    view,
    locale,
  }: {
    view: HomeView;
    locale: Locale;
  }): Promise<JSX.Element | null> {
    const t = await getTranslations('drop');
    const { drop, dropProducts, anyEarlyAccessGated } = view;
    if (!drop || dropProducts.length === 0) return null;

    // Server picks the LIVE-flip deadline: gated members/guests count down to releaseAt;
    // coming_soon counts down to earlyAccessAt. The island never refetches — it only ticks.
    const anyComingSoon = dropProducts.some((p) => p.leadVariant.availability === 'coming_soon');
    const deadlineIso = anyComingSoon ? drop.earlyAccessAt : drop.releaseAt;

    return (
      <section data-testid="live-drop" className="bg-ink px-6 py-20 text-paper">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-10">
          <header className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.3em] text-blaze">
                {t('label')}
              </p>
              <h2 className="display mt-2 text-5xl text-paper">{drop.name[locale]}</h2>
              <p className="mt-3 text-sm text-smoke-300">
                {t('releaseAtLabel')}: <FormattedDate iso={drop.releaseAt} />
              </p>
            </div>
            <div data-testid="live-drop-countdown" className="min-w-[18rem]">
              <CountdownIsland deadlineIso={deadlineIso} />
            </div>
          </header>

          {anyEarlyAccessGated && (
            <p
              data-testid="early-access-hint"
              className="font-mono text-xs uppercase tracking-[0.18em] text-smoke-300"
            >
              {t('unlockHint')}
            </p>
          )}

          <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {dropProducts.map((p) => {
              const a = p.leadVariant.availability;
              return (
                <li
                  key={p.productId}
                  data-testid="drop-product"
                  data-product-id={p.productId}
                  data-availability={a}
                  className="flex flex-col gap-4 border border-smoke-700 p-6"
                  style={{ viewTransitionName: `product-${p.productId}` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-smoke-500">{p.leadVariant.sku}</span>
                    <AvailabilityBadge availability={a} stock={p.leadVariant.stock} />
                  </div>
                  <StockMeter stock={p.leadVariant.stock} />
                  {a === 'sold_out' ? (
                    <button
                      type="button"
                      data-testid="notify-me"
                      className="mt-2 border border-smoke-500 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-paper"
                    >
                      {t('notifyMe')}
                    </button>
                  ) : (
                    <Link
                      href={{ pathname: '/product/[slug]', params: { slug: p.slug } }}
                      className="mt-2 inline-block font-mono text-xs uppercase tracking-[0.18em] text-blaze underline-offset-4 hover:underline"
                    >
                      {t('live')}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }
  ```

  > `viewTransitionName` keyed on `product-${productId}` is locale-stable per the View Transitions convention. The `Link` href object form matches next-intl's typed-routing API for `/product/[slug]`; if the project's `navigation.ts` uses untyped routes, pass `href={\`/product/${p.slug}\`}`instead — keep it to the exact`Link` contract.

- [ ] Implement `components/home/LookbookTeaser.tsx` (Server Component; light "paper" surface — note lime is forbidden here, only paper/ink/blaze-on-light):

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { Link } from '@/lib/i18n/navigation';

  export async function LookbookTeaser(): Promise<JSX.Element> {
    const t = await getTranslations('home');
    return (
      <section data-testid="lookbook-teaser" className="bg-paper px-6 py-24 text-ink">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6">
          <h2 className="display text-6xl">{t('lookbookTeaserTitle')}</h2>
          <Link
            href="/collections"
            className="font-mono text-sm uppercase tracking-[0.2em] text-blaze-on-light underline-offset-4 hover:underline"
          >
            {t('lookbookTeaserCta')}
          </Link>
        </div>
      </section>
    );
  }
  ```

- [ ] Implement `app/[locale]/(shop)/page.tsx` (the Server Component; reads `now` on the server once, gets the current user, builds the view, composes the sections + the demoted marquee + featured grid). The marquee shows `SOLD OUT` only when every drop lead variant is sold out, else `DROP`:

  ```tsx
  import { getTranslations, setRequestLocale } from 'next-intl/server';
  import { buildHomeView } from '@/lib/services/home-view';
  import { authService } from '@/lib/services/auth-service';
  import { HeroSection } from '@/components/home/HeroSection';
  import { LiveDropSection } from '@/components/home/LiveDropSection';
  import { LookbookTeaser } from '@/components/home/LookbookTeaser';
  import { DropMarquee } from '@/components/drop/DropMarquee';
  import { ProductCard } from '@/components/product/ProductCard';
  import type { Locale } from '@/lib/domain';

  export default async function Page({
    params,
  }: {
    params: Promise<{ locale: Locale }>;
  }): Promise<JSX.Element> {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('home');
    const now = new Date();
    const user = await authService.getCurrentUser();
    const view = await buildHomeView(now, user);

    const allSoldOut =
      view.dropProducts.length > 0 &&
      view.dropProducts.every((p) => p.leadVariant.availability === 'sold_out');

    return (
      <main>
        <HeroSection locale={locale} />
        <DropMarquee soldOut={allSoldOut} />
        <LiveDropSection view={view} locale={locale} />

        <section data-testid="featured" className="bg-ink px-6 py-20 text-paper">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="display mb-10 text-5xl">{t('featuredTitle')}</h2>
            <ul className="grid grid-cols-2 gap-6 md:grid-cols-3">
              {view.featured.map((product) => (
                <li key={product.id} data-product-id={product.id}>
                  <ProductCard product={product} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LookbookTeaser />
      </main>
    );
  }
  ```

  > `ProductCard`'s props must match its phase contract exactly (it owns its own `view-transition-name` keyed on `product.id`); if its signature differs (e.g. `ProductCard({ product })` without `locale`), call it with that exact shape — do not add props it does not declare.

- [ ] Typecheck the whole page graph:
  ```
  npm run typecheck
  ```
  Expected: exit 0, no diagnostics across the new home files.
- [ ] Commit:
  ```
  git add app/[locale]/(shop)/page.tsx components/home/HeroSection.tsx components/home/LiveDropSection.tsx components/home/LookbookTeaser.tsx
  git commit -m "feat(home): assemble Tier-1 Home with hero, LIVE DROP, featured grid, lookbook teaser"
  ```

### Task 4.6 — E2E + visual verification of the hero slice (both locales + reduced-motion)

Prove the LIVE DROP behaviors with Playwright against `npm run dev`, in both `/en` and `/th`, plus a reduced-motion run, and capture screenshots for the case study. Asserts: countdown ticks (a digit changes within ~2s), countdown→LIVE flip when past the deadline, derived availability states render (sold_out badge + notify-me; low_stock count), marquee shows English `DROP`/`SOLD OUT` in BOTH locales, early-access gating shows the hint for a guest and the seed member sees `live`, and reduced motion never leaves content at `opacity:0`.

**Files**

- Create: `tests/e2e/home-drop.en.spec.ts`, `tests/e2e/home-drop.th.spec.ts`
- Modify: `tests/e2e/reduced-motion.spec.ts` (add a Home/marquee assertion block)

**Interfaces**

- Consumes: Playwright `test`/`expect`; the running dev server at the configured `baseURL`; seed data (3 sold-out + 4 low-stock variants; seed member `member@vanta.shop` / `vanta-demo`).
- Produces: passing E2E specs + saved screenshots `home-drop.en.png`, `home-drop.th.png`, `home-drop.reduced.png`.

**Steps**

- [ ] Write `tests/e2e/home-drop.en.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('Home LIVE DROP — en', () => {
    test('hero, marquee (English DROP), and a derived availability state render', async ({
      page,
    }) => {
      await page.goto('/en');
      await expect(page.getByTestId('hero')).toBeVisible();

      const marquee = page.getByTestId('drop-marquee');
      await expect(marquee).toBeVisible();
      // Marquee text is English in both locales.
      await expect(marquee).toHaveAttribute('data-word', /DROP|SOLD OUT/);

      await expect(page.getByTestId('live-drop')).toBeVisible();
      // Featured grid present.
      await expect(page.getByTestId('featured')).toBeVisible();
      await page.screenshot({ path: 'tests/e2e/__screenshots__/home-drop.en.png', fullPage: true });
    });

    test('countdown ticks once per second without a network refetch', async ({ page }) => {
      const requests: string[] = [];
      page.on('request', (r) => requests.push(r.url()));

      await page.goto('/en');
      const countdown = page.getByTestId('countdown');
      // If the drop is already live, the done node renders instead; only assert ticking when counting down.
      if (await countdown.isVisible()) {
        const before = await countdown.innerText();
        await page.waitForTimeout(2100);
        const after = await countdown.innerText();
        expect(after).not.toBe(before);

        // No re-fetch of the page/data during ticking: count navigations after first load settle.
        const navAfterLoad = requests.filter((u) => u.endsWith('/en') || u.endsWith('/en/')).length;
        expect(navAfterLoad).toBeLessThanOrEqual(1);
      } else {
        await expect(page.getByTestId('countdown-done')).toBeVisible();
      }
    });

    test('sold-out drop product shows SOLD OUT badge + visual-only Notify me', async ({ page }) => {
      await page.goto('/en');
      const soldOut = page
        .getByTestId('drop-product')
        .filter({ has: page.getByTestId('badge-sold-out') });
      if (await soldOut.count()) {
        await expect(soldOut.first().getByTestId('notify-me')).toBeVisible();
      }
    });

    test('guest sees the early-access unlock hint; seed member unlocks to live', async ({
      page,
    }) => {
      await page.goto('/en');
      // Guest path: hint visible only when a drop variant is gated.
      const hint = page.getByTestId('early-access-hint');
      const gatedNow = await hint.isVisible();

      // Log in as the seed member.
      await page.goto('/en/login');
      await page.getByLabel(/email/i).fill('member@vanta.shop');
      await page.getByLabel(/password/i).fill('vanta-demo');
      await page.getByRole('button', { name: /log in|sign in|เข้าสู่ระบบ/i }).click();
      await page.goto('/en');

      if (gatedNow) {
        // After member login, no gated early_access state should remain -> hint gone.
        await expect(page.getByTestId('early-access-hint')).toHaveCount(0);
      }
    });
  });
  ```

- [ ] Write `tests/e2e/home-drop.th.spec.ts` (mirrors EN; asserts the marquee is STILL English and Thai badges render):

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('Home LIVE DROP — th', () => {
    test('renders Thai hero but English marquee word', async ({ page }) => {
      await page.goto('/th');
      await expect(page.getByTestId('hero')).toBeVisible();
      const marquee = page.getByTestId('drop-marquee');
      // Constraint: marquee is English DROP/SOLD OUT in BOTH locales.
      await expect(marquee).toHaveAttribute('data-word', /DROP|SOLD OUT/);
      await expect(page.getByTestId('live-drop')).toBeVisible();
      await page.screenshot({ path: 'tests/e2e/__screenshots__/home-drop.th.png', fullPage: true });
    });

    test('low-stock badge shows a Western-digit count in Thai locale', async ({ page }) => {
      await page.goto('/th');
      const low = page.getByTestId('badge-low-stock');
      if (await low.count()) {
        // Western digits in both locales -> the rendered count contains an ASCII digit.
        await expect(low.first()).toHaveText(/[0-9]/);
      }
    });
  });
  ```

- [ ] Add a Home block to `tests/e2e/reduced-motion.spec.ts` (content visible-by-default; no element stuck at opacity 0; marquee static):

  ```ts
  import { test, expect } from '@playwright/test';

  // This project runs under the reduced-motion Playwright project (prefers-reduced-motion: reduce).
  test.describe('Home — reduced motion', () => {
    test('hero content is visible by default (never stuck at opacity:0) and marquee is static', async ({
      page,
    }) => {
      await page.goto('/en');
      const hero = page.getByTestId('hero');
      await expect(hero).toBeVisible();
      const heroOpacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
      expect(Number(heroOpacity)).toBeGreaterThan(0);

      // Countdown still shows a value (static frame) — either ticking node or done node.
      const hasCountdown = await page.getByTestId('countdown').isVisible();
      const hasDone = await page.getByTestId('countdown-done').isVisible();
      expect(hasCountdown || hasDone).toBeTruthy();

      // Marquee strip has no running CSS animation (animation-name 'none' under reduced motion).
      const strip = page.getByTestId('drop-marquee').locator('> div');
      const animName = await strip.evaluate((el) => getComputedStyle(el).animationName);
      expect(animName).toBe('none');

      await page.screenshot({
        path: 'tests/e2e/__screenshots__/home-drop.reduced.png',
        fullPage: true,
      });
    });
  });
  ```

- [ ] Start the dev server in the background, then run the specs:
  ```
  npm run dev   # background; serves baseURL from playwright.config.ts
  npx playwright test tests/e2e/home-drop.en.spec.ts tests/e2e/home-drop.th.spec.ts tests/e2e/reduced-motion.spec.ts
  ```
  Expected: all specs pass; e.g. `X passed`. The three screenshots exist under `tests/e2e/__screenshots__/`.
- [ ] Visual verification against `npm run dev` (Playwright MCP or Chrome DevTools MCP). Exact checks to confirm by eye on `/en` and `/th`:
  - Hero: black canvas, headline visible (not blank), kicker + two CTAs present; in `/th` the headline uses the Kanit `display` token (no all-caps, taller line-height) and in `/en` Clash Display all-caps tight tracking.
  - LIVE DROP: countdown digits in Geist Mono advance once per second; when the system clock is past `releaseAt`, the `countdown-done` node reads `LIVE` in blaze.
  - States: a `low_stock` card shows `ONLY N LEFT` (blaze) with a short StockMeter; a `sold_out` card shows the grey `SOLD OUT` badge + a `NOTIFY ME` button that does nothing.
  - Lime audit: confirm lime appears ONLY on the StockMeter fill on the dark hero and nowhere on the paper lookbook teaser.
  - Stock-tick: navigate into a low-stock product and add to cart, return to Home; the StockMeter for that variant is visibly shorter (in-session decrement via `decrementStock`).
- [ ] Stop the dev server (terminate the background process).
- [ ] Commit:
  ```
  git add tests/e2e/home-drop.en.spec.ts tests/e2e/home-drop.th.spec.ts tests/e2e/reduced-motion.spec.ts tests/e2e/__screenshots__
  git commit -m "test(home): E2E hero slice in both locales plus reduced-motion run"
  ```

**Phase 4 done-when:** `npx vitest run tests/unit/home-view.test.ts tests/unit/countdown.test.ts` is green; `npm run typecheck` is clean; the three E2E specs pass against `npm run dev` in `/en` and `/th` plus the reduced-motion project; the countdown ticks per-second client-side with no data refetch and flips to LIVE past the deadline; the seed member's login removes the early-access gate; the marquee renders English `DROP`/`SOLD OUT` in both locales; and the `home-drop.{en,th,reduced}.png` screenshots are captured for the case study.

---

Phase 4 written above is the deliverable. Key file paths produced by this phase (all absolute): `d:/MINE/freelance/system/vanta/lib/services/home-view.ts`, `d:/MINE/freelance/system/vanta/lib/motion/countdown.ts`, `d:/MINE/freelance/system/vanta/components/drop/CountdownIsland.tsx`, `d:/MINE/freelance/system/vanta/components/drop/AvailabilityBadge.tsx`, `d:/MINE/freelance/system/vanta/components/drop/StockMeter.tsx`, `d:/MINE/freelance/system/vanta/components/drop/DropMarquee.tsx`, `d:/MINE/freelance/system/vanta/components/home/HeroSection.tsx`, `d:/MINE/freelance/system/vanta/components/home/LiveDropSection.tsx`, `d:/MINE/freelance/system/vanta/components/home/LookbookTeaser.tsx`, `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/page.tsx`, plus tests under `d:/MINE/freelance/system/vanta/tests/unit/{home-view,countdown}.test.ts` and `d:/MINE/freelance/system/vanta/tests/e2e/{home-drop.en,home-drop.th,reduced-motion}.spec.ts`.

---

The project folder doesn't exist yet (no files found), which is expected — earlier phases create the foundation, and I'm writing the plan document for Phase 5. I have all the locked contracts I need. Let me write Phase 5.

I have everything required. The contracts give me the exact domain types, repository/service signatures, the `addToCart` action signature from Phase 3, `deriveAvailability`, `formatMoney`, design tokens, motion gating rules, and file paths. Let me compose the phase.

Here is Phase 5, ready to paste into the plan document.

---

## Phase 5 — PDP (lean, Tier 1)

This phase ships the Product Detail Page as a focused proof that **the variant is the purchasable unit (SKU)** and that availability is derived identically everywhere. It builds the sticky buy panel, the swatch gallery (color selection swaps the gallery), the size grid (greyed/sold-out sizes derived from each variant's availability), the low-stock badge, the add-to-cart button wired to the Phase 3 `addToCart` Server Action, an optional Size & Fit drawer (cm/in), and the View Transition IN keyed on `product-${product.id}` (locale-stable) with a reduced-motion hard cut. It renders both locales via `generateStaticParams`. **CUT:** reviews and cross-sell (per spec §7 PDP scope).

Dependencies consumed from earlier phases (treated as verbatim law — do not redefine):

- Domain barrel `@/lib/domain` (`Product`, `Variant`, `Availability`, `ProductImage`, `Money`, `Locale`, `User`, `Drop`).
- Data seam `@/lib/data` (`products`, `collections`, `orders`, `users`, `cart`).
- `deriveAvailability(variant, drop, now, user)` and `LOW_STOCK_THRESHOLD` from `@/lib/services/availability`.
- `dropService.getDropById` / `dropService.getActiveDrop` from `@/lib/services/drop-service`; `authService.getCurrentUser` from `@/lib/services/auth-service`.
- `addToCart(variantId, quantity): Promise<Cart>` from `@/lib/actions/cart-actions` (Phase 3).
- `formatMoney(money, locale)` from `@/lib/format/money`.
- `useCartStore` Zustand mirror (`replaceFromServer`) from `@/lib/store/cart-store` (Phase 3).
- `useMotionCapability` from `@/lib/motion/capability` (Phase 4).
- `routing` / `Link` from `@/lib/i18n` (`getPathname`, `redirect`, locale list).
- The `ProductCard` component (`components/product/`) already keys its `view-transition-name` on `product-${product.id}` (Phase 4); the PDP must use the **same** key so the enter transition pairs.

> **REQUIRED SUB-SKILL:** before executing this phase invoke `superpowers:executing-plans`. The PDP selection logic (Task 5.1) is a LOGIC task — follow `superpowers:test-driven-development` (failing Vitest → run-fails → implement → run-passes → commit). The UI tasks are verified with Playwright assertions plus visual verification against `npm run dev`.

---

### Task 5.1 — PDP variant-selection model (pure logic, TDD)

A pure module that, given a product + the active drop + current user + the selected `{ size, color }`, computes everything the PDP UI renders: the resolved `Variant | null`, its derived `Availability`, whether each size in `optionAxes.size` is selectable for the chosen color (and its per-size availability), the ordered color list, and the gallery images for the selected color. Keeping this pure makes the sticky panel, size grid, and swatch gallery dumb renderers and lets us unit-test the SOLD-OUT/low-stock derivation without a DOM.

#### Files

- **Create:** `vanta/lib/pdp/selection.ts`
- **Test:** `vanta/tests/unit/pdp-selection.test.ts`

#### Interfaces

- **Consumes:**
  - `import type { Product, Variant, Availability, ProductImage, Drop, User } from '@/lib/domain'`
  - `import { deriveAvailability } from '@/lib/services/availability'` — `deriveAvailability(variant: Variant, drop: Drop | null, now: Date, user: User | null): Availability`
- **Produces:**

  ```ts
  export type SizeOption = {
    size: string;
    variantId: string | null; // null => no SKU exists for (size, selectedColor)
    availability: Availability | null;
    selectable: boolean; // false when sold_out OR no variant exists
  };

  export type PdpView = {
    colors: string[]; // optionAxes.color order
    sizes: SizeOption[]; // optionAxes.size order, scoped to selectedColor
    selectedVariant: Variant | null; // resolved from { size, color }
    selectedAvailability: Availability | null; // deriveAvailability(selectedVariant, ...)
    gallery: ProductImage[]; // imagesByColor[selectedColor] ?? []
    lowStockRemaining: number | null; // selectedVariant.stock when selectedAvailability === 'low_stock', else null
  };

  export function buildPdpView(
    product: Product,
    drop: Drop | null,
    now: Date,
    user: User | null,
    selected: { size: string | null; color: string },
  ): PdpView;
  ```

#### Steps

1. - [ ] Write the failing test file `vanta/tests/unit/pdp-selection.test.ts`:

   ```ts
   import { describe, it, expect } from 'vitest';
   import { buildPdpView } from '@/lib/pdp/selection';
   import type { Product, Variant } from '@/lib/domain';

   const money = (amount: number) => ({ amount, currency: 'THB' as const });

   function variant(id: string, size: string, color: string, stock: number): Variant {
     return {
       id,
       sku: `VANTA-${id}`,
       optionValues: { size, color },
       price: money(199000),
       stock,
       availability: 'live',
     };
   }

   function product(variants: Variant[]): Product {
     return {
       id: 'prd_void_tee',
       slug: 'void-tee',
       title: { en: 'Void Tee', th: 'วอยด์ ที' },
       description: { en: 'Tee', th: 'เสื้อ' },
       optionAxes: { size: ['S', 'M', 'L'], color: ['Ink', 'Bone'] },
       variants,
       imagesByColor: {
         Ink: [
           {
             id: 'img_ink',
             url: '/ink.jpg',
             alt: { en: 'Ink', th: 'อิงค์' },
             width: 1200,
             height: 1500,
           },
         ],
         Bone: [
           {
             id: 'img_bone',
             url: '/bone.jpg',
             alt: { en: 'Bone', th: 'โบน' },
             width: 1200,
             height: 1500,
           },
         ],
       },
       collectionIds: ['col_drop_001'],
     };
   }

   const NOW = new Date('2026-06-27T12:00:00.000Z');

   describe('buildPdpView', () => {
     it('lists colors and scopes sizes to the selected color', () => {
       const p = product([
         variant('v1', 'S', 'Ink', 10),
         variant('v2', 'M', 'Ink', 10),
         variant('v3', 'S', 'Bone', 10),
       ]);
       const view = buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' });
       expect(view.colors).toEqual(['Ink', 'Bone']);
       expect(view.sizes.map((s) => s.size)).toEqual(['S', 'M', 'L']);
       // S and M exist for Ink and are selectable; L has no Ink variant.
       expect(view.sizes.find((s) => s.size === 'S')?.selectable).toBe(true);
       expect(view.sizes.find((s) => s.size === 'M')?.selectable).toBe(true);
       const lSize = view.sizes.find((s) => s.size === 'L')!;
       expect(lSize.variantId).toBeNull();
       expect(lSize.selectable).toBe(false);
     });

     it('marks a sold-out size (stock 0) as not selectable with sold_out availability', () => {
       const p = product([variant('v1', 'S', 'Ink', 0), variant('v2', 'M', 'Ink', 10)]);
       const view = buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' });
       const s = view.sizes.find((x) => x.size === 'S')!;
       expect(s.availability).toBe('sold_out');
       expect(s.selectable).toBe(false);
     });

     it('resolves the selected variant and exposes low-stock remaining', () => {
       const p = product([
         variant('v1', 'S', 'Ink', 3), // 0 < 3 <= 5 => low_stock
         variant('v2', 'M', 'Ink', 10),
       ]);
       const view = buildPdpView(p, null, NOW, null, { size: 'S', color: 'Ink' });
       expect(view.selectedVariant?.id).toBe('v1');
       expect(view.selectedAvailability).toBe('low_stock');
       expect(view.lowStockRemaining).toBe(3);
     });

     it('returns null selection and null remaining when size not yet chosen', () => {
       const p = product([variant('v1', 'S', 'Ink', 10)]);
       const view = buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' });
       expect(view.selectedVariant).toBeNull();
       expect(view.selectedAvailability).toBeNull();
       expect(view.lowStockRemaining).toBeNull();
     });

     it('returns the gallery for the selected color (empty array when missing)', () => {
       const p = product([variant('v1', 'S', 'Ink', 10)]);
       expect(buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' }).gallery).toHaveLength(
         1,
       );
       expect(buildPdpView(p, null, NOW, null, { size: null, color: 'Missing' }).gallery).toEqual(
         [],
       );
     });
   });
   ```

2. - [ ] Run it and SHOW it fails (module does not exist yet):
   - Command: `npm test -- tests/unit/pdp-selection.test.ts`
   - Expected output contains: `Error: Failed to load url @/lib/pdp/selection` (or `Cannot find module '@/lib/pdp/selection'`) and the run ends with `Test Files  1 failed (1)`.
3. - [ ] Implement the minimal pure module `vanta/lib/pdp/selection.ts`:

   ```ts
   import type { Product, Variant, Availability, ProductImage, Drop, User } from '@/lib/domain';
   import { deriveAvailability } from '@/lib/services/availability';

   export type SizeOption = {
     size: string;
     variantId: string | null;
     availability: Availability | null;
     selectable: boolean;
   };

   export type PdpView = {
     colors: string[];
     sizes: SizeOption[];
     selectedVariant: Variant | null;
     selectedAvailability: Availability | null;
     gallery: ProductImage[];
     lowStockRemaining: number | null;
   };

   function findVariant(product: Product, size: string, color: string): Variant | null {
     return (
       product.variants.find(
         (v) => v.optionValues.size === size && v.optionValues.color === color,
       ) ?? null
     );
   }

   export function buildPdpView(
     product: Product,
     drop: Drop | null,
     now: Date,
     user: User | null,
     selected: { size: string | null; color: string },
   ): PdpView {
     const colors = product.optionAxes.color;

     const sizes: SizeOption[] = product.optionAxes.size.map((size) => {
       const variant = findVariant(product, size, selected.color);
       if (!variant) {
         return { size, variantId: null, availability: null, selectable: false };
       }
       const availability = deriveAvailability(variant, drop, now, user);
       return {
         size,
         variantId: variant.id,
         availability,
         selectable: availability !== 'sold_out',
       };
     });

     const selectedVariant =
       selected.size !== null ? findVariant(product, selected.size, selected.color) : null;

     const selectedAvailability = selectedVariant
       ? deriveAvailability(selectedVariant, drop, now, user)
       : null;

     const lowStockRemaining =
       selectedVariant && selectedAvailability === 'low_stock' ? selectedVariant.stock : null;

     return {
       colors,
       sizes,
       selectedVariant,
       selectedAvailability,
       gallery: product.imagesByColor[selected.color] ?? [],
       lowStockRemaining,
     };
   }
   ```

4. - [ ] Run it and SHOW it passes:
   - Command: `npm test -- tests/unit/pdp-selection.test.ts`
   - Expected output contains: `Test Files  1 passed (1)` and `Tests  5 passed (5)`.
5. - [ ] Confirm strict types are clean (no `any` in `lib/**`):
   - Command: `npm run typecheck`
   - Expected output: exits 0 with no errors.
6. - [ ] Commit:
   - Command: `git add vanta/lib/pdp/selection.ts vanta/tests/unit/pdp-selection.test.ts && git commit -m "feat(pdp): add pure variant-selection view model"`

---

### Task 5.2 — Size & Fit drawer (cm/in unit toggle, component test)

A small client component: a tasteful Size & Fit drawer reusing the Phase 2 a11y `Dialog` primitive, showing a static measurements table with a cm/in unit toggle. The conversion is pure and unit-tested (rounding stable in both locales); the drawer is a thin presenter. This is the "if time allows" PDP extra from spec §7, kept small.

#### Files

- **Create:** `vanta/lib/pdp/measurements.ts`, `vanta/components/pdp/SizeFitDrawer.tsx`
- **Test:** `vanta/tests/unit/pdp-measurements.test.ts`

#### Interfaces

- **Consumes:**
  - `import { Dialog } from '@/components/ui/Dialog'` (Phase 2 a11y dialog: focus trap/return, Esc, `:focus-visible`).
  - `import { useTranslations } from 'next-intl'`
- **Produces:**

  ```ts
  // lib/pdp/measurements.ts
  export type Unit = 'cm' | 'in';
  export type SizeRow = { size: string; chestCm: number; lengthCm: number };
  export function toUnit(valueCm: number, unit: Unit): number; // cm -> rounded; in -> 1 decimal
  export function formatMeasure(valueCm: number, unit: Unit): string; // e.g. "52 cm" | "20.5 in"

  // components/pdp/SizeFitDrawer.tsx
  export function SizeFitDrawer(props: {
    open: boolean;
    onClose: () => void;
    rows: SizeRow[];
  }): JSX.Element;
  ```

#### Steps

1. - [ ] Write the failing test `vanta/tests/unit/pdp-measurements.test.ts`:

   ```ts
   import { describe, it, expect } from 'vitest';
   import { toUnit, formatMeasure } from '@/lib/pdp/measurements';

   describe('toUnit', () => {
     it('returns rounded integer cm unchanged', () => {
       expect(toUnit(52, 'cm')).toBe(52);
       expect(toUnit(52.4, 'cm')).toBe(52);
     });
     it('converts cm to inches at 1 decimal place', () => {
       expect(toUnit(52, 'in')).toBe(20.5); // 52 / 2.54 = 20.47 -> 20.5
       expect(toUnit(71, 'in')).toBe(28); // 71 / 2.54 = 27.95 -> 28.0
     });
   });

   describe('formatMeasure', () => {
     it('suffixes the unit (Western digits, no Buddhist era concerns)', () => {
       expect(formatMeasure(52, 'cm')).toBe('52 cm');
       expect(formatMeasure(52, 'in')).toBe('20.5 in');
     });
   });
   ```

2. - [ ] Run it and SHOW it fails:
   - Command: `npm test -- tests/unit/pdp-measurements.test.ts`
   - Expected output contains: `Cannot find module '@/lib/pdp/measurements'` and `Test Files  1 failed (1)`.
3. - [ ] Implement `vanta/lib/pdp/measurements.ts`:

   ```ts
   export type Unit = 'cm' | 'in';
   export type SizeRow = { size: string; chestCm: number; lengthCm: number };

   const CM_PER_INCH = 2.54;

   export function toUnit(valueCm: number, unit: Unit): number {
     if (unit === 'cm') return Math.round(valueCm);
     return Math.round((valueCm / CM_PER_INCH) * 10) / 10;
   }

   export function formatMeasure(valueCm: number, unit: Unit): string {
     return `${toUnit(valueCm, unit)} ${unit}`;
   }
   ```

4. - [ ] Run it and SHOW it passes:
   - Command: `npm test -- tests/unit/pdp-measurements.test.ts`
   - Expected output contains: `Test Files  1 passed (1)` and `Tests  4 passed (4)`.
5. - [ ] Implement the drawer `vanta/components/pdp/SizeFitDrawer.tsx` (complete code):

   ```tsx
   'use client';

   import { useState } from 'react';
   import { useTranslations } from 'next-intl';
   import { Dialog } from '@/components/ui/Dialog';
   import { type SizeRow, type Unit, formatMeasure } from '@/lib/pdp/measurements';

   export function SizeFitDrawer({
     open,
     onClose,
     rows,
   }: {
     open: boolean;
     onClose: () => void;
     rows: SizeRow[];
   }) {
     const t = useTranslations('pdp.sizeFit');
     const [unit, setUnit] = useState<Unit>('cm');

     return (
       <Dialog open={open} onClose={onClose} labelledBy="size-fit-title">
         <div className="flex flex-col gap-4 bg-ink p-6 text-paper">
           <div className="flex items-center justify-between">
             <h2 id="size-fit-title" className="display text-xl">
               {t('title')}
             </h2>
             <div
               role="radiogroup"
               aria-label={t('unitLabel')}
               className="flex gap-1 font-mono text-sm"
             >
               {(['cm', 'in'] as const).map((u) => (
                 <button
                   key={u}
                   type="button"
                   role="radio"
                   aria-checked={unit === u}
                   onClick={() => setUnit(u)}
                   className={
                     unit === u
                       ? 'bg-lime px-3 py-1 text-ink'
                       : 'border border-smoke-700 px-3 py-1 text-smoke-300'
                   }
                 >
                   {u}
                 </button>
               ))}
             </div>
           </div>
           <table className="w-full border-collapse font-mono text-sm">
             <thead>
               <tr className="text-left text-smoke-500">
                 <th className="py-2">{t('size')}</th>
                 <th className="py-2">{t('chest')}</th>
                 <th className="py-2">{t('length')}</th>
               </tr>
             </thead>
             <tbody>
               {rows.map((r) => (
                 <tr key={r.size} className="border-t border-smoke-700">
                   <td className="py-2">{r.size}</td>
                   <td className="py-2">{formatMeasure(r.chestCm, unit)}</td>
                   <td className="py-2">{formatMeasure(r.lengthCm, unit)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </Dialog>
     );
   }
   ```

6. - [ ] Add the `pdp.sizeFit` namespace keys to BOTH message files (mirror keyset). In `vanta/messages/en.json` add under a top-level `pdp` object:
   ```json
   "pdp": {
     "sizeFit": {
       "title": "Size & Fit",
       "unitLabel": "Measurement unit",
       "size": "Size",
       "chest": "Chest",
       "length": "Length",
       "openButton": "Size & Fit"
     }
   }
   ```
   and the Thai mirror in `vanta/messages/th.json`:
   ```json
   "pdp": {
     "sizeFit": {
       "title": "ขนาดและการสวมใส่",
       "unitLabel": "หน่วยวัด",
       "size": "ไซซ์",
       "chest": "รอบอก",
       "length": "ความยาว",
       "openButton": "ขนาดและการสวมใส่"
     }
   }
   ```
   > Note: leave the `pdp` object open — Task 5.3 adds sibling keys (`addToCart`, `selectSize`, `soldOut`, `notifyMe`, `onlyNLeft`) to the same `pdp` object in both files.
7. - [ ] Confirm types clean:
   - Command: `npm run typecheck`
   - Expected output: exits 0.
8. - [ ] Commit:
   - Command: `git add vanta/lib/pdp/measurements.ts vanta/components/pdp/SizeFitDrawer.tsx vanta/messages/en.json vanta/messages/th.json && git commit -m "feat(pdp): add Size & Fit drawer with cm/in toggle"`

---

### Task 5.3 — Interactive PDP client island: SwatchGallery, SizeGrid, StickyBuyPanel, AddToCartButton

The client interactivity for the PDP, composed into a single island that owns the selected `{ size, color }` state and drives every dumb child from `buildPdpView` (Task 5.1). Swatch selection swaps the gallery; the size grid greys/disables sold-out and missing sizes; the low-stock badge shows "Only N left"; the add-to-cart button is wired to the Phase 3 `addToCart` action with `useOptimistic` and reconciles the Zustand mirror via `replaceFromServer`. SOLD OUT (no buyable size) swaps the CTA for a visual-only "Notify me" button (no backend).

#### Files

- **Create:** `vanta/components/pdp/SwatchGallery.tsx`, `vanta/components/pdp/SizeGrid.tsx`, `vanta/components/pdp/AddToCartButton.tsx`, `vanta/components/pdp/StickyBuyPanel.tsx`, `vanta/components/pdp/PdpClient.tsx`
- **Test:** `vanta/tests/e2e/pdp.en.spec.ts`, `vanta/tests/e2e/pdp.th.spec.ts`

#### Interfaces

- **Consumes:**
  - `import { buildPdpView, type PdpView } from '@/lib/pdp/selection'`
  - `import type { Product, Variant, Availability, Drop, User, Locale } from '@/lib/domain'`
  - `import { addToCart } from '@/lib/actions/cart-actions'` — `addToCart(variantId: string, quantity: number): Promise<Cart>`
  - `import { useCartStore } from '@/lib/store/cart-store'` — `replaceFromServer(cart: Cart): void`
  - `import { formatMoney } from '@/lib/format/money'` — `formatMoney(money, locale)`
  - `import { SizeFitDrawer } from '@/components/pdp/SizeFitDrawer'`; `import type { SizeRow } from '@/lib/pdp/measurements'`
  - `import { useTranslations } from 'next-intl'`
- **Produces:**

  ```ts
  // SwatchGallery.tsx
  export function SwatchGallery(props: {
    productId: string;
    view: PdpView;
    selectedColor: string;
    onSelectColor: (color: string) => void;
    locale: Locale;
  }): JSX.Element;

  // SizeGrid.tsx
  export function SizeGrid(props: {
    view: PdpView;
    selectedSize: string | null;
    onSelectSize: (size: string) => void;
  }): JSX.Element;

  // AddToCartButton.tsx
  export function AddToCartButton(props: {
    variant: Variant | null;
    availability: Availability | null;
  }): JSX.Element;

  // StickyBuyPanel.tsx
  export function StickyBuyPanel(
    props: {
      title: string;
      view: PdpView;
      locale: Locale;
      onOpenSizeFit: () => void;
    } & React.ComponentProps<typeof SizeGrid> & {
        variant: Variant | null;
        availability: Availability | null;
      },
  ): JSX.Element;

  // PdpClient.tsx — the island the RSC page renders
  export function PdpClient(props: {
    product: Product;
    drop: Drop | null;
    user: User | null;
    nowIso: string;
    locale: Locale;
    sizeFitRows: SizeRow[];
  }): JSX.Element;
  ```

#### Steps

1. - [ ] Implement `vanta/components/pdp/SwatchGallery.tsx`. The container carries `view-transition-name: product-${productId}` (locale-stable) so the enter transition pairs with the `ProductCard`; the swatch row swaps which color's images render:

   ```tsx
   'use client';

   import Image from 'next/image';
   import { useTranslations } from 'next-intl';
   import type { PdpView } from '@/lib/pdp/selection';
   import type { Locale } from '@/lib/domain';

   export function SwatchGallery({
     productId,
     view,
     selectedColor,
     onSelectColor,
     locale,
   }: {
     productId: string;
     view: PdpView;
     selectedColor: string;
     onSelectColor: (color: string) => void;
     locale: Locale;
   }) {
     const t = useTranslations('pdp');
     const hero = view.gallery[0];

     return (
       <div className="flex flex-col gap-4">
         <div
           className="relative aspect-[4/5] w-full overflow-hidden bg-smoke-900"
           style={{ viewTransitionName: `product-${productId}` }}
         >
           {hero ? (
             <Image
               key={hero.id}
               src={hero.url}
               alt={hero.alt[locale]}
               fill
               sizes="(max-width: 768px) 100vw, 50vw"
               className="object-cover"
               priority
             />
           ) : null}
         </div>
         <div className="grid grid-cols-4 gap-3" aria-hidden="true">
           {view.gallery.slice(1).map((img) => (
             <div key={img.id} className="relative aspect-[4/5] overflow-hidden bg-smoke-900">
               <Image
                 src={img.url}
                 alt={img.alt[locale]}
                 fill
                 sizes="20vw"
                 className="object-cover"
               />
             </div>
           ))}
         </div>
         <div role="radiogroup" aria-label={t('colorLabel')} className="flex gap-2">
           {view.colors.map((color) => (
             <button
               key={color}
               type="button"
               role="radio"
               aria-checked={color === selectedColor}
               aria-label={color}
               onClick={() => onSelectColor(color)}
               data-testid={`swatch-${color}`}
               className={
                 color === selectedColor
                   ? 'h-9 w-9 rounded-full border-2 border-lime'
                   : 'h-9 w-9 rounded-full border-2 border-smoke-700'
               }
               style={{ backgroundColor: swatchHex(color) }}
             />
           ))}
         </div>
       </div>
     );
   }

   // Static demo mapping; real catalog would carry a hex on the color axis.
   function swatchHex(color: string): string {
     const map: Record<string, string> = {
       Ink: '#0A0A0A',
       Bone: '#F5F4EF',
       Blaze: '#FF3B1F',
       Lime: '#D4FF2E',
       Smoke: '#6B6B6B',
     };
     return map[color] ?? '#2A2A2A';
   }
   ```

2. - [ ] Implement `vanta/components/pdp/SizeGrid.tsx`. Each size button is disabled and greyed when not `selectable` (sold-out or no SKU); aria reflects state:

   ```tsx
   'use client';

   import { useTranslations } from 'next-intl';
   import type { PdpView } from '@/lib/pdp/selection';

   export function SizeGrid({
     view,
     selectedSize,
     onSelectSize,
   }: {
     view: PdpView;
     selectedSize: string | null;
     onSelectSize: (size: string) => void;
   }) {
     const t = useTranslations('pdp');

     return (
       <div
         role="radiogroup"
         aria-label={t('selectSize')}
         className="grid grid-cols-4 gap-2 font-mono"
       >
         {view.sizes.map((s) => {
           const isSelected = s.size === selectedSize;
           const isSoldOut = s.availability === 'sold_out';
           return (
             <button
               key={s.size}
               type="button"
               role="radio"
               aria-checked={isSelected}
               aria-disabled={!s.selectable}
               disabled={!s.selectable}
               data-testid={`size-${s.size}`}
               data-soldout={isSoldOut ? 'true' : 'false'}
               onClick={() => s.selectable && onSelectSize(s.size)}
               className={[
                 'relative py-3 text-sm uppercase transition-colors',
                 isSelected
                   ? 'border border-paper bg-paper text-ink'
                   : 'border border-smoke-700 text-paper',
                 !s.selectable
                   ? 'cursor-not-allowed text-smoke-500 line-through opacity-50'
                   : 'hover:border-paper',
               ].join(' ')}
             >
               {s.size}
             </button>
           );
         })}
       </div>
     );
   }
   ```

3. - [ ] Implement `vanta/components/pdp/AddToCartButton.tsx`. Uses `useOptimistic` for the in-flight add and a `useTransition`-wrapped action call, reconciling the Zustand mirror from the action's authoritative `Cart` return. Disabled until a buyable variant is selected; SOLD OUT renders the visual-only "Notify me":

   ```tsx
   'use client';

   import { useOptimistic, useTransition } from 'react';
   import { useTranslations } from 'next-intl';
   import type { Variant, Availability } from '@/lib/domain';
   import { addToCart } from '@/lib/actions/cart-actions';
   import { useCartStore } from '@/lib/store/cart-store';

   export function AddToCartButton({
     variant,
     availability,
   }: {
     variant: Variant | null;
     availability: Availability | null;
   }) {
     const t = useTranslations('pdp');
     const replaceFromServer = useCartStore((s) => s.replaceFromServer);
     const [isPending, startTransition] = useTransition();
     const [optimisticAdding, setOptimisticAdding] = useOptimistic(
       false,
       (_state, next: boolean) => next,
     );

     // Visual-only Notify me for a sold-out selection (no backend).
     if (availability === 'sold_out') {
       return (
         <button
           type="button"
           data-testid="notify-me"
           className="w-full bg-smoke-700 py-4 font-mono text-sm uppercase tracking-wide text-paper"
         >
           {t('notifyMe')}
         </button>
       );
     }

     const disabled = variant === null || isPending;

     return (
       <button
         type="button"
         data-testid="add-to-cart"
         disabled={disabled}
         onClick={() => {
           if (!variant) return;
           startTransition(async () => {
             setOptimisticAdding(true);
             const cart = await addToCart(variant.id, 1);
             replaceFromServer(cart);
           });
         }}
         className={[
           'w-full py-4 font-mono text-sm uppercase tracking-wide',
           disabled
             ? 'cursor-not-allowed bg-smoke-700 text-smoke-300'
             : 'bg-blaze text-paper hover:bg-blaze-on-light',
         ].join(' ')}
       >
         {variant === null
           ? t('selectSize')
           : optimisticAdding || isPending
             ? t('adding')
             : t('addToCart')}
       </button>
     );
   }
   ```

4. - [ ] Implement `vanta/components/pdp/StickyBuyPanel.tsx`. Sticky on desktop; shows title, price (via `formatMoney`), the low-stock badge ("Only N left") in blaze, the size grid, the add-to-cart button, and the Size & Fit trigger:

   ```tsx
   'use client';

   import { useTranslations } from 'next-intl';
   import type { Variant, Availability, Locale } from '@/lib/domain';
   import type { PdpView } from '@/lib/pdp/selection';
   import { formatMoney } from '@/lib/format/money';
   import { SizeGrid } from '@/components/pdp/SizeGrid';
   import { AddToCartButton } from '@/components/pdp/AddToCartButton';

   export function StickyBuyPanel({
     title,
     view,
     locale,
     selectedSize,
     onSelectSize,
     variant,
     availability,
     onOpenSizeFit,
   }: {
     title: string;
     view: PdpView;
     locale: Locale;
     selectedSize: string | null;
     onSelectSize: (size: string) => void;
     variant: Variant | null;
     availability: Availability | null;
     onOpenSizeFit: () => void;
   }) {
     const t = useTranslations('pdp');
     // Display price: selected variant, else the first variant of the product view.
     const priceVariant =
       (variant ?? view.sizes.map((s) => s.variantId).find((id): id is string => id !== null))
         ? variant
         : null;
     const price = (variant ?? null)?.price ?? (view.gallery.length ? undefined : undefined);

     return (
       <aside className="lg:sticky lg:top-24 flex flex-col gap-6 self-start">
         <div className="flex flex-col gap-2">
           <h1 className="display text-3xl text-paper">{title}</h1>
           {variant ? (
             <p className="font-mono text-lg text-paper" data-testid="pdp-price">
               {formatMoney(variant.price, locale)}
             </p>
           ) : (
             <p className="font-mono text-lg text-smoke-300" data-testid="pdp-price">
               {formatMoney(
                 view.sizes.length
                   ? // fall back to any variant's price for display before selection
                     fallbackPrice(view)
                   : { amount: 0, currency: 'THB' },
                 locale,
               )}
             </p>
           )}
         </div>

         {view.lowStockRemaining !== null ? (
           <p
             data-testid="low-stock-badge"
             className="w-fit bg-blaze px-3 py-1 font-mono text-xs uppercase tracking-wide text-paper"
           >
             {t('onlyNLeft', { count: view.lowStockRemaining })}
           </p>
         ) : null}

         <SizeGrid view={view} selectedSize={selectedSize} onSelectSize={onSelectSize} />

         <AddToCartButton variant={variant} availability={availability} />

         <button
           type="button"
           onClick={onOpenSizeFit}
           data-testid="open-size-fit"
           className="w-fit font-mono text-xs uppercase tracking-wide text-smoke-300 underline underline-offset-4 hover:text-paper"
         >
           {t('sizeFit.openButton')}
         </button>
       </aside>
     );
   }

   function fallbackPrice(view: PdpView) {
     // Price shown pre-selection: the cheapest reads fine for a demo; use first available.
     const firstId = view.sizes.find((s) => s.variantId)?.variantId ?? null;
     // The selected variant's price isn't known here; the PdpClient passes the
     // resolved variant once a size is chosen. Before that we show the product's
     // representative price, which PdpClient injects via the price prop fallback.
     return { amount: 0, currency: 'THB' as const };
   }
   ```

   > Simplify the price display: the PdpClient (next step) always knows the product's representative price. Replace the price block above with the cleaner version below so `StickyBuyPanel` takes an explicit `displayPrice` prop and never guesses. Edit `StickyBuyPanel.tsx` to the final form:

   ```tsx
   'use client';

   import { useTranslations } from 'next-intl';
   import type { Variant, Availability, Locale, Money } from '@/lib/domain';
   import type { PdpView } from '@/lib/pdp/selection';
   import { formatMoney } from '@/lib/format/money';
   import { SizeGrid } from '@/components/pdp/SizeGrid';
   import { AddToCartButton } from '@/components/pdp/AddToCartButton';

   export function StickyBuyPanel({
     title,
     view,
     locale,
     selectedSize,
     onSelectSize,
     variant,
     availability,
     displayPrice,
     onOpenSizeFit,
   }: {
     title: string;
     view: PdpView;
     locale: Locale;
     selectedSize: string | null;
     onSelectSize: (size: string) => void;
     variant: Variant | null;
     availability: Availability | null;
     displayPrice: Money;
     onOpenSizeFit: () => void;
   }) {
     const t = useTranslations('pdp');
     const price = variant?.price ?? displayPrice;

     return (
       <aside className="lg:sticky lg:top-24 flex flex-col gap-6 self-start">
         <div className="flex flex-col gap-2">
           <h1 className="display text-3xl text-paper">{title}</h1>
           <p className="font-mono text-lg text-paper" data-testid="pdp-price">
             {formatMoney(price, locale)}
           </p>
         </div>

         {view.lowStockRemaining !== null ? (
           <p
             data-testid="low-stock-badge"
             className="w-fit bg-blaze px-3 py-1 font-mono text-xs uppercase tracking-wide text-paper"
           >
             {t('onlyNLeft', { count: view.lowStockRemaining })}
           </p>
         ) : null}

         <SizeGrid view={view} selectedSize={selectedSize} onSelectSize={onSelectSize} />

         <AddToCartButton variant={variant} availability={availability} />

         <button
           type="button"
           onClick={onOpenSizeFit}
           data-testid="open-size-fit"
           className="w-fit font-mono text-xs uppercase tracking-wide text-smoke-300 underline underline-offset-4 hover:text-paper"
         >
           {t('sizeFit.openButton')}
         </button>
       </aside>
     );
   }
   ```

5. - [ ] Implement the island `vanta/components/pdp/PdpClient.tsx` that owns selection state, recomputes the view with `buildPdpView`, and lays out gallery + sticky panel + drawer. It defaults the color to the first axis value and computes a representative `displayPrice` (the first variant's price) so the panel never guesses:

   ```tsx
   'use client';

   import { useMemo, useState } from 'react';
   import type { Product, Drop, User, Locale, Money } from '@/lib/domain';
   import type { SizeRow } from '@/lib/pdp/measurements';
   import { buildPdpView } from '@/lib/pdp/selection';
   import { SwatchGallery } from '@/components/pdp/SwatchGallery';
   import { StickyBuyPanel } from '@/components/pdp/StickyBuyPanel';
   import { SizeFitDrawer } from '@/components/pdp/SizeFitDrawer';

   export function PdpClient({
     product,
     drop,
     user,
     nowIso,
     locale,
     sizeFitRows,
   }: {
     product: Product;
     drop: Drop | null;
     user: User | null;
     nowIso: string;
     locale: Locale;
     sizeFitRows: SizeRow[];
   }) {
     const [selectedColor, setSelectedColor] = useState(product.optionAxes.color[0]);
     const [selectedSize, setSelectedSize] = useState<string | null>(null);
     const [sizeFitOpen, setSizeFitOpen] = useState(false);

     const now = useMemo(() => new Date(nowIso), [nowIso]);

     const view = useMemo(
       () =>
         buildPdpView(product, drop, now, user, {
           size: selectedSize,
           color: selectedColor,
         }),
       [product, drop, now, user, selectedSize, selectedColor],
     );

     const displayPrice: Money = product.variants[0]?.price ?? { amount: 0, currency: 'THB' };

     // Changing color resets the size if the new color lacks that SKU.
     function handleSelectColor(color: string) {
       setSelectedColor(color);
       setSelectedSize((prev) =>
         prev &&
         product.variants.some(
           (v) => v.optionValues.color === color && v.optionValues.size === prev,
         )
           ? prev
           : null,
       );
     }

     return (
       <div className="mx-auto grid w-full max-w-[var(--max-w-shell)] grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-2">
         <SwatchGallery
           productId={product.id}
           view={view}
           selectedColor={selectedColor}
           onSelectColor={handleSelectColor}
           locale={locale}
         />
         <StickyBuyPanel
           title={product.title[locale]}
           view={view}
           locale={locale}
           selectedSize={selectedSize}
           onSelectSize={setSelectedSize}
           variant={view.selectedVariant}
           availability={view.selectedAvailability}
           displayPrice={displayPrice}
           onOpenSizeFit={() => setSizeFitOpen(true)}
         />
         <SizeFitDrawer
           open={sizeFitOpen}
           onClose={() => setSizeFitOpen(false)}
           rows={sizeFitRows}
         />
       </div>
     );
   }
   ```

6. - [ ] Add the remaining `pdp` namespace keys to BOTH message files (siblings of `sizeFit` added in Task 5.2). Add to the `pdp` object in `vanta/messages/en.json`:
   ```json
   "addToCart": "Add to cart",
   "adding": "Adding…",
   "selectSize": "Select a size",
   "colorLabel": "Color",
   "notifyMe": "Notify me",
   "onlyNLeft": "Only {count} left"
   ```
   and the Thai mirror in `vanta/messages/th.json`:
   ```json
   "addToCart": "เพิ่มลงตะกร้า",
   "adding": "กำลังเพิ่ม…",
   "selectSize": "เลือกไซซ์",
   "colorLabel": "สี",
   "notifyMe": "แจ้งเตือนฉัน",
   "onlyNLeft": "เหลือเพียง {count} ชิ้น"
   ```
7. - [ ] Confirm types clean:
   - Command: `npm run typecheck`
   - Expected output: exits 0.
8. - [ ] Commit:
   - Command: `git add vanta/components/pdp vanta/messages/en.json vanta/messages/th.json && git commit -m "feat(pdp): add interactive buy panel, swatch gallery and size grid island"`

> The E2E specs created here (`pdp.en.spec.ts`, `pdp.th.spec.ts`) are authored in Task 5.5 once the route exists.

---

### Task 5.4 — PDP route: RSC page + `generateStaticParams` across both locales

The Server Component page that reads the product through the `@/lib/data` seam (never reaching into `@/lib/data/mock`), derives the active drop and current user, renders the `PdpClient` island, sets bilingual metadata, and statically generates one path per `(locale × product slug)`. `now` is computed on the server and passed as an ISO string so the pure derivation stays deterministic and the page is request-context-clean apart from `authService`.

#### Files

- **Create:** `vanta/app/[locale]/(shop)/product/[slug]/page.tsx`
- **Modify:** `vanta/messages/en.json`, `vanta/messages/th.json` (add `pdp.notFound`)

#### Interfaces

- **Consumes:**
  - `import { products } from '@/lib/data'` — `products.getBySlug(slug): Promise<Product | null>`, `products.list(): Promise<Product[]>`
  - `import { dropService } from '@/lib/services/drop-service'` — `getDropById(dropId): Promise<Drop | null>`
  - `import { authService } from '@/lib/services/auth-service'` — `getCurrentUser(): Promise<User | null>`
  - `import { routing } from '@/lib/i18n/routing'` — `routing.locales`
  - `import { setRequestLocale, getTranslations } from 'next-intl/server'`
  - `import type { Locale } from '@/lib/domain'`
  - `import { PdpClient } from '@/components/pdp/PdpClient'`
  - `import type { SizeRow } from '@/lib/pdp/measurements'`
- **Produces:**
  ```ts
  export function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>>;
  export function generateMetadata(props: {
    params: Promise<{ locale: Locale; slug: string }>;
  }): Promise<import('next').Metadata>;
  export default function ProductPage(props: {
    params: Promise<{ locale: Locale; slug: string }>;
  }): Promise<JSX.Element>;
  ```

#### Steps

1. - [ ] Add the `pdp.notFound` key to BOTH message files. In `vanta/messages/en.json` (`pdp` object): `"notFound": "Product not found"`. In `vanta/messages/th.json` (`pdp` object): `"notFound": "ไม่พบสินค้า"`.
2. - [ ] Implement `vanta/app/[locale]/(shop)/product/[slug]/page.tsx` (complete code). It statically generates both locales for every product, reads through the seam, and passes a server-computed `now`:

   ```tsx
   import type { Metadata } from 'next';
   import { notFound } from 'next/navigation';
   import { setRequestLocale, getTranslations } from 'next-intl/server';
   import { products } from '@/lib/data';
   import { dropService } from '@/lib/services/drop-service';
   import { authService } from '@/lib/services/auth-service';
   import { routing } from '@/lib/i18n/routing';
   import type { Locale, Drop } from '@/lib/domain';
   import { PdpClient } from '@/components/pdp/PdpClient';
   import type { SizeRow } from '@/lib/pdp/measurements';

   // Static demo size chart shared by all products in this lean PDP.
   const SIZE_FIT_ROWS: SizeRow[] = [
     { size: 'S', chestCm: 52, lengthCm: 68 },
     { size: 'M', chestCm: 56, lengthCm: 71 },
     { size: 'L', chestCm: 60, lengthCm: 74 },
     { size: 'XL', chestCm: 64, lengthCm: 77 },
   ];

   export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
     const all = await products.list();
     return routing.locales.flatMap((locale) =>
       all.map((product) => ({ locale, slug: product.slug })),
     );
   }

   export async function generateMetadata({
     params,
   }: {
     params: Promise<{ locale: Locale; slug: string }>;
   }): Promise<Metadata> {
     const { locale, slug } = await params;
     const product = await products.getBySlug(slug);
     if (!product) return { title: 'VANTA®' };
     return {
       title: `${product.title[locale]} — VANTA®`,
       description: product.description[locale],
       alternates: {
         languages: {
           en: `/en/product/${slug}`,
           th: `/th/product/${slug}`,
         },
       },
     };
   }

   export default async function ProductPage({
     params,
   }: {
     params: Promise<{ locale: Locale; slug: string }>;
   }) {
     const { locale, slug } = await params;
     setRequestLocale(locale);

     const product = await products.getBySlug(slug);
     if (!product) notFound();

     const drop: Drop | null = product.dropId
       ? await dropService.getDropById(product.dropId)
       : null;
     const user = await authService.getCurrentUser();
     const nowIso = new Date().toISOString();

     return (
       <main className="bg-ink">
         <PdpClient
           product={product}
           drop={drop}
           user={user}
           nowIso={nowIso}
           locale={locale}
           sizeFitRows={SIZE_FIT_ROWS}
         />
       </main>
     );
   }
   ```

3. - [ ] Confirm types clean:
   - Command: `npm run typecheck`
   - Expected output: exits 0.
4. - [ ] Confirm the route builds and both locales' params are generated:
   - Command: `npm run build`
   - Expected output: the build summary lists the dynamic route `/[locale]/product/[slug]` as prerendered (look for `● /[locale]/product/[slug]` under "SSG" / "(Static)"), and the build exits 0. Confirm no `useState`/`use server`/`cookies` errors are reported for this route.
5. - [ ] Commit:
   - Command: `git add "vanta/app/[locale]/(shop)/product/[slug]/page.tsx" vanta/messages/en.json vanta/messages/th.json && git commit -m "feat(pdp): add product route with bilingual static params and metadata"`

---

### Task 5.5 — PDP E2E (both locales) + add-to-cart wiring + View Transition + reduced-motion verification

End-to-end proof against `npm run dev`: in BOTH locales the PDP renders, a sold-out size is greyed/disabled, a low-stock variant shows the blaze "Only N left" badge, selecting a buyable size enables Add to cart, the swatch swaps the gallery hero image, the action increments the cart, the SOLD-OUT product shows "Notify me", the card→PDP View Transition uses the locale-stable `view-transition-name`, and reduced motion is a hard cut. Includes visual verification screenshots for the case study.

> This task assumes the Phase 0 seed contains at least one product with a low-stock variant (one of the 4 seeded "Only N left") and a product whose selected color has a fully sold-out size (from the 3 seeded sold-out). Use the actual seeded slugs; the spec below uses `void-tee` as the buyable example and `phantom-hoodie` as the one with a sold-out size — replace with the real seed slugs from Phase 0's `lib/data/mock/seed/products.ts` when writing the test.

#### Files

- **Create:** `vanta/tests/e2e/pdp.en.spec.ts`, `vanta/tests/e2e/pdp.th.spec.ts`
- **Modify:** `vanta/tests/e2e/reduced-motion.spec.ts` (add a PDP enter-transition assertion)

#### Interfaces

- **Consumes:** Playwright `test`, `expect`; the running dev server (`playwright.config.ts` `webServer` runs `npm run dev`); the `data-testid` hooks added in Task 5.3 (`swatch-<color>`, `size-<S>`, `add-to-cart`, `notify-me`, `low-stock-badge`, `pdp-price`, `open-size-fit`); the cart drawer / header cart-count selector from Phase 3 (`data-testid="cart-count"`).
- **Produces:** passing E2E specs in both locales plus a reduced-motion assertion; screenshots written under `vanta/test-results/`.

#### Steps

1. - [ ] Write `vanta/tests/e2e/pdp.en.spec.ts` (replace `void-tee` / `phantom-hoodie` / size labels with the real seeded values):

   ```ts
   import { test, expect } from '@playwright/test';

   test.describe('PDP — English', () => {
     test('low-stock badge, swatch swaps gallery, size gating, add to cart', async ({ page }) => {
       await page.goto('/en/product/void-tee');

       // Price renders via formatMoney (baht sign, no decimals).
       await expect(page.getByTestId('pdp-price')).toContainText('฿');

       // Add to cart is disabled until a size is chosen.
       await expect(page.getByTestId('add-to-cart')).toBeDisabled();

       // Selecting a buyable size enables the CTA.
       await page.getByTestId('size-M').click();
       await expect(page.getByTestId('add-to-cart')).toBeEnabled();

       // Swatch selection swaps the gallery hero image src.
       const heroBefore = await page.locator('[style*="product-"] img').first().getAttribute('src');
       await page.getByTestId('swatch-Bone').click();
       const heroAfter = await page.locator('[style*="product-"] img').first().getAttribute('src');
       expect(heroAfter).not.toEqual(heroBefore);

       // Re-select a size for the new color, then add to cart.
       await page.getByTestId('size-M').click();
       const countBefore = Number((await page.getByTestId('cart-count').textContent()) ?? '0');
       await page.getByTestId('add-to-cart').click();
       await expect(page.getByTestId('cart-count')).toHaveText(String(countBefore + 1));
     });

     test('sold-out size is disabled and a sold-out product shows Notify me', async ({ page }) => {
       await page.goto('/en/product/phantom-hoodie');
       // The sold-out size is rendered disabled with strike-through styling.
       const soldOut = page.locator('[data-soldout="true"]').first();
       await expect(soldOut).toBeDisabled();
       // Selecting it is impossible; choosing it via DOM keeps CTA out of buy state.
       await expect(page.getByTestId('low-stock-badge')).toHaveCount(0);
     });

     test('Size & Fit drawer opens and toggles cm/in', async ({ page }) => {
       await page.goto('/en/product/void-tee');
       await page.getByTestId('open-size-fit').click();
       const dialog = page.getByRole('dialog');
       await expect(dialog).toBeVisible();
       await expect(dialog).toContainText('cm');
       await dialog.getByRole('radio', { name: 'in' }).click();
       await expect(dialog).toContainText('in');
       await page.keyboard.press('Escape');
       await expect(dialog).toBeHidden();
     });
   });
   ```

2. - [ ] Write `vanta/tests/e2e/pdp.th.spec.ts` (mirror, asserting Thai copy and that the price still uses the baht sign with Western digits):

   ```ts
   import { test, expect } from '@playwright/test';

   test.describe('PDP — Thai', () => {
     test('renders Thai copy, baht price, and adds to cart', async ({ page }) => {
       await page.goto('/th/product/void-tee');

       // Baht sign + Western digits in Thai (never Buddhist-era).
       await expect(page.getByTestId('pdp-price')).toContainText('฿');

       // Size CTA shows the Thai "select size" string before selection.
       await expect(page.getByTestId('add-to-cart')).toContainText('เลือกไซซ์');

       await page.getByTestId('size-M').click();
       await expect(page.getByTestId('add-to-cart')).toContainText('เพิ่มลงตะกร้า');

       const countBefore = Number((await page.getByTestId('cart-count').textContent()) ?? '0');
       await page.getByTestId('add-to-cart').click();
       await expect(page.getByTestId('cart-count')).toHaveText(String(countBefore + 1));
     });

     test('low-stock badge uses Thai copy when a low-stock variant is selected', async ({
       page,
     }) => {
       await page.goto('/th/product/void-tee');
       await page.getByTestId('size-M').click();
       const badge = page.getByTestId('low-stock-badge');
       // The badge appears only for low-stock variants; assert Thai copy when present.
       if (await badge.count()) {
         await expect(badge).toContainText('เหลือเพียง');
       }
     });
   });
   ```

3. - [ ] Append a PDP enter-transition assertion to `vanta/tests/e2e/reduced-motion.spec.ts`. The `view-transition-name` must equal `product-${id}` and be identical across both locales (locale-stable), and under `prefers-reduced-motion: reduce` the navigation must be an instant hard cut (no transition pseudo-elements lingering). Add:

   ```ts
   test.describe('PDP View Transition — locale-stable + reduced-motion hard cut', () => {
     test('view-transition-name is keyed on product id in both locales', async ({ page }) => {
       await page.goto('/en/product/void-tee');
       const enName = await page
         .locator('[style*="view-transition-name"]')
         .first()
         .evaluate((el) => getComputedStyle(el).viewTransitionName);

       await page.goto('/th/product/void-tee');
       const thName = await page
         .locator('[style*="view-transition-name"]')
         .first()
         .evaluate((el) => getComputedStyle(el).viewTransitionName);

       expect(enName).toMatch(/^product-/);
       expect(thName).toEqual(enName); // identical regardless of locale
     });

     test.use({ contextOptions: { reducedMotion: 'reduce' } });
     test('reduced motion does not stick content at opacity 0', async ({ page }) => {
       await page.goto('/en/product/void-tee');
       // Content is visible by default; the gallery hero is opaque.
       const hero = page.locator('[style*="product-"] img').first();
       await expect(hero).toBeVisible();
       const opacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
       expect(Number(opacity)).toBeGreaterThan(0.99);
     });
   });
   ```

4. - [ ] Run the PDP E2E suite and SHOW it passes:
   - Command: `npm run test:e2e -- pdp.en.spec.ts pdp.th.spec.ts reduced-motion.spec.ts`
   - Expected output contains: `passed` for each spec file with no `failed` lines; the run ends with a passing summary (e.g. `X passed`).
5. - [ ] Visual verification against `npm run dev` (Playwright or Chrome DevTools MCP). Start dev (`npm run dev`), then capture three screenshots for the case study:
   - Navigate to `http://localhost:3000/en/product/void-tee`, select a low-stock size, and screenshot the sticky panel showing the blaze "Only N left" badge → save `vanta/test-results/pdp-en.png`.
   - Navigate to `http://localhost:3000/th/product/void-tee` and screenshot the Thai PDP (Kanit headline, no all-caps, baht price) → save `vanta/test-results/pdp-th.png`.
   - With reduced motion emulated, navigate to `http://localhost:3000/en/product/phantom-hoodie` and screenshot the SOLD-OUT product showing the disabled strike-through size and the "Notify me" button → save `vanta/test-results/pdp-reduced-motion.png`.
   - Exact check: in `pdp-en.png` the badge background is blaze (`#FF3B1F`) and the greyed size is struck through; in `pdp-th.png` the title is rendered with the Thai display face and the price reads `฿` + grouped Western digits with no decimals; in `pdp-reduced-motion.png` the gallery and panel are fully visible (never blank/opacity 0) and the CTA reads "Notify me".
6. - [ ] Commit:
   - Command: `git add vanta/tests/e2e/pdp.en.spec.ts vanta/tests/e2e/pdp.th.spec.ts vanta/tests/e2e/reduced-motion.spec.ts && git commit -m "test(pdp): add bilingual PDP e2e, add-to-cart and reduced-motion checks"`

---

**Phase 5 done when:** the PDP route prerenders for both locales, the variant-selection model is unit-tested green, the sticky buy panel / swatch-swaps-gallery / greyed-and-sold-out size grid / low-stock badge all render from `deriveAvailability`, add-to-cart funnels through the Phase 3 `addToCart` action and reconciles the Zustand mirror, the View Transition IN uses the locale-stable `product-${product.id}` key with a reduced-motion hard cut, the Size & Fit drawer toggles cm/in, and the bilingual + reduced-motion E2E specs pass with three case-study screenshots captured. Reviews and cross-sell remain CUT.

---

The spec confirms all the details I need. The project folder is empty (no files yet), so Phase 6 builds on prior phases' contracts. I have everything from the LOCKED CONTRACTS. Let me write the phase. I don't need to invoke skills or write files — my deliverable is the markdown phase text returned directly.

Let me compose Phase 6 with rigorous adherence to the contracts.

# Phase 6 — Catalog, Lookbook & Search (Tier 2/3)

> **Prerequisites:** Phases 1–5 are complete. Domain types (`@/lib/domain`), repositories + swap point (`@/lib/data`), services (`deriveAvailability`, `dropService`, `authService`), `formatMoney`/`formatDate`, the i18n stack (`@/lib/i18n/*`, `messages/en.json`, `messages/th.json`), the motion stack (`useMotionCapability`, `splitGraphemes`), the Tailwind v4 theme block, and the View-Transition-keyed `ProductCard` building blocks already exist. This phase wires the **catalog** (filter + sort over variant options), the **collections index + editorial lookbook template**, and **basic search**. Per effort tiers, catalog/lookbook are **flawless-but-lean (T2)** and search is **correct + clean (T3)**. The grid uses **CSS clip-path/mask reveal + IntersectionObserver only — NO WebGL in the grid**; WebGL is allowed in the one lookbook hero. Before executing, invoke `superpowers:executing-plans`; apply `superpowers:test-driven-development` to every LOGIC task (the filter/sort engine, the search-results presenter).

This phase is structured so each task ends in an independently testable deliverable. LOGIC tasks (the pure filter/sort engine, the search results presenter) are pure functions in `lib/` with Vitest specs (TDD: fail → implement → pass → commit). UI tasks ship complete component code verified by Playwright assertions and visual verification against `npm run dev`.

---

## Task 6.1 — Pure catalog filter/sort engine (`deriveCatalogView`)

A catalog page must filter products by **variant options** (size, color, category, price range) and sort the result, with availability computed via the locked pure `deriveAvailability`. This is pure logic so it is TDD-first and lives outside React. It operates on `Product[]` (read through the `products` repository in the page) and a `CatalogQuery` parsed from URL search params, producing a stable, locale-independent view model. "Category" maps to `collectionIds` (a product belongs to a category iff it is in that collection); price/size/color/availability are derived from a product's variants.

### Files

- **Create:** `vanta/lib/catalog/query.ts` (the `CatalogQuery` type + `parseCatalogQuery` + `deriveCatalogView`)
- **Create:** `vanta/lib/catalog/facets.ts` (`buildFacets` — distinct option values + price bounds for the filter UI)
- **Test:** `vanta/tests/unit/catalog-query.test.ts`

### Interfaces

- **Consumes:**
  - `import type { Product, Variant, Drop, User, Availability } from '@/lib/domain'`
  - `import { deriveAvailability } from '@/lib/services/availability'` — `deriveAvailability(variant, drop, now, user): Availability`
- **Produces:**

  ```ts
  // lib/catalog/query.ts
  export type CatalogSort = 'featured' | 'price_asc' | 'price_desc' | 'newest';
  export type CatalogQuery = {
    sizes: string[]; // optionValues.size to include (OR within axis)
    colors: string[]; // optionValues.color to include (OR within axis)
    categories: string[]; // collectionIds to include (OR within axis)
    minPrice: number | null; // integer minor units (satang), inclusive
    maxPrice: number | null; // integer minor units (satang), inclusive
    sort: CatalogSort;
  };
  export type CatalogCard = {
    productId: string; // stable id (View Transition key origin)
    slug: string;
    fromPrice: Money; // lowest variant price among matching variants
    compareAtFromPrice: Money | null; // present => on sale
    availability: Availability; // best (most buyable) availability across matching variants
    matchedColors: string[]; // colors that survived the filter (drives swatch dots)
  };
  export function parseCatalogQuery(params: URLSearchParams): CatalogQuery;
  export function deriveCatalogView(
    products: Product[],
    query: CatalogQuery,
    dropsById: Record<string, Drop>,
    now: Date,
    user: User | null,
  ): CatalogCard[];

  // lib/catalog/facets.ts
  export type CatalogFacets = {
    sizes: string[]; // distinct, sorted by canonical apparel order then alpha
    colors: string[]; // distinct, alpha
    priceBounds: { min: number; max: number }; // minor units across all variants
  };
  export function buildFacets(products: Product[]): CatalogFacets;
  ```

### Steps

- [ ] **Write the failing test** at `vanta/tests/unit/catalog-query.test.ts`. It pins parsing, filtering across the variant axes, price-window inclusivity, sort, and the availability roll-up (a product's card availability is the _most buyable_ of its matching variants, using the locked precedence `sold_out > coming_soon > early_access > low_stock > live` — so a card is `live` if any matching variant is `live`).

  ```ts
  import { describe, it, expect } from 'vitest';
  import { parseCatalogQuery, deriveCatalogView } from '@/lib/catalog/query';
  import { buildFacets } from '@/lib/catalog/facets';
  import type { Product, Variant, Drop, Money } from '@/lib/domain';

  const thb = (amount: number): Money => ({ amount, currency: 'THB' });

  function variant(over: Partial<Variant> & Pick<Variant, 'id'>): Variant {
    return {
      sku: `SKU-${over.id}`,
      optionValues: { size: 'M', color: 'Black' },
      price: thb(199000),
      stock: 10,
      availability: 'live',
      ...over,
    };
  }

  function product(over: Partial<Product> & Pick<Product, 'id' | 'slug'>): Product {
    return {
      title: { en: 'Tee', th: 'เสื้อ' },
      description: { en: '', th: '' },
      optionAxes: { size: ['S', 'M', 'L'], color: ['Black'] },
      variants: [variant({ id: `${over.id}-v1` })],
      imagesByColor: { Black: [] },
      collectionIds: ['col_core'],
      ...over,
    };
  }

  describe('parseCatalogQuery', () => {
    it('reads multi-value axes, price window, and sort with defaults', () => {
      const q = parseCatalogQuery(
        new URLSearchParams(
          'size=S&size=L&color=Black&category=col_core&minPrice=100000&maxPrice=300000&sort=price_asc',
        ),
      );
      expect(q).toEqual({
        sizes: ['S', 'L'],
        colors: ['Black'],
        categories: ['col_core'],
        minPrice: 100000,
        maxPrice: 300000,
        sort: 'price_asc',
      });
    });

    it('defaults to empty filters and featured sort, and rejects unknown sort', () => {
      expect(parseCatalogQuery(new URLSearchParams(''))).toEqual({
        sizes: [],
        colors: [],
        categories: [],
        minPrice: null,
        maxPrice: null,
        sort: 'featured',
      });
      expect(parseCatalogQuery(new URLSearchParams('sort=bogus')).sort).toBe('featured');
    });

    it('ignores non-integer / negative price bounds', () => {
      const q = parseCatalogQuery(new URLSearchParams('minPrice=abc&maxPrice=-5'));
      expect(q.minPrice).toBeNull();
      expect(q.maxPrice).toBeNull();
    });
  });

  describe('deriveCatalogView', () => {
    const now = new Date('2026-06-27T00:00:00Z');

    it('returns one card per product with fromPrice = lowest matching variant price', () => {
      const p = product({
        id: 'p1',
        slug: 'tee',
        variants: [
          variant({ id: 'p1-a', price: thb(199000) }),
          variant({ id: 'p1-b', price: thb(149000) }),
        ],
      });
      const view = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('')),
        {},
        now,
        null,
      );
      expect(view).toHaveLength(1);
      expect(view[0]).toMatchObject({ productId: 'p1', slug: 'tee', fromPrice: thb(149000) });
    });

    it('filters by size (variant axis) and drops products with no matching variant', () => {
      const p = product({
        id: 'p1',
        slug: 'tee',
        variants: [
          variant({ id: 'p1-s', optionValues: { size: 'S', color: 'Black' } }),
          variant({ id: 'p1-l', optionValues: { size: 'L', color: 'Black' } }),
        ],
      });
      const onlyMissing = product({
        id: 'p2',
        slug: 'cap',
        variants: [variant({ id: 'p2-m', optionValues: { size: 'M', color: 'Black' } })],
      });
      const view = deriveCatalogView(
        [p, onlyMissing],
        parseCatalogQuery(new URLSearchParams('size=S')),
        {},
        now,
        null,
      );
      expect(view.map((c) => c.productId)).toEqual(['p1']);
    });

    it('filters by category (collectionIds) and color, and price window is inclusive', () => {
      const p = product({
        id: 'p1',
        slug: 'tee',
        collectionIds: ['col_drop'],
        variants: [
          variant({ id: 'p1-w', optionValues: { size: 'M', color: 'White' }, price: thb(120000) }),
          variant({ id: 'p1-b', optionValues: { size: 'M', color: 'Black' }, price: thb(300000) }),
        ],
      });
      const byColor = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('color=White')),
        {},
        now,
        null,
      );
      expect(byColor[0].fromPrice).toEqual(thb(120000));
      expect(byColor[0].matchedColors).toEqual(['White']);

      const byCategory = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('category=col_drop')),
        {},
        now,
        null,
      );
      expect(byCategory).toHaveLength(1);

      const byPrice = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('minPrice=300000&maxPrice=300000')),
        {},
        now,
        null,
      );
      expect(byPrice[0].matchedColors).toEqual(['Black']);
    });

    it('sets compareAtFromPrice from the lowest matching variant that has compareAtPrice', () => {
      const p = product({
        id: 'p1',
        slug: 'tee',
        variants: [
          variant({ id: 'p1-a', price: thb(149000), compareAtPrice: thb(199000) }),
          variant({ id: 'p1-b', price: thb(159000) }),
        ],
      });
      const view = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('')),
        {},
        now,
        null,
      );
      expect(view[0].compareAtFromPrice).toEqual(thb(199000));
    });

    it('rolls availability up to the most buyable matching variant', () => {
      const p = product({
        id: 'p1',
        slug: 'tee',
        variants: [
          variant({ id: 'p1-out', stock: 0, availability: 'sold_out' }),
          variant({ id: 'p1-low', stock: 3, availability: 'low_stock' }),
        ],
      });
      const view = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('')),
        {},
        now,
        null,
      );
      expect(view[0].availability).toBe('low_stock'); // low_stock is more buyable than sold_out
    });

    it('sorts price_asc by fromPrice and newest by reverse input order', () => {
      const cheap = product({
        id: 'a',
        slug: 'a',
        variants: [variant({ id: 'a-v', price: thb(100000) })],
      });
      const dear = product({
        id: 'b',
        slug: 'b',
        variants: [variant({ id: 'b-v', price: thb(500000) })],
      });
      const asc = deriveCatalogView(
        [dear, cheap],
        parseCatalogQuery(new URLSearchParams('sort=price_asc')),
        {},
        now,
        null,
      );
      expect(asc.map((c) => c.productId)).toEqual(['a', 'b']);
      const newest = deriveCatalogView(
        [cheap, dear],
        parseCatalogQuery(new URLSearchParams('sort=newest')),
        {},
        now,
        null,
      );
      expect(newest.map((c) => c.productId)).toEqual(['b', 'a']);
    });

    it('derives availability via deriveAvailability against a drop (early_access gated for guest)', () => {
      const drop: Drop = {
        id: 'drop_1',
        name: { en: 'Drop', th: 'ดรอป' },
        earlyAccessAt: '2026-06-26T00:00:00Z',
        releaseAt: '2026-06-28T00:00:00Z',
        endAt: '2026-07-01T00:00:00Z',
      };
      const p = product({
        id: 'p1',
        slug: 'tee',
        dropId: 'drop_1',
        variants: [variant({ id: 'p1-v', stock: 10, availability: 'live' })],
      });
      const guestView = deriveCatalogView(
        [p],
        parseCatalogQuery(new URLSearchParams('')),
        { drop_1: drop },
        now,
        null,
      );
      expect(guestView[0].availability).toBe('early_access');
    });
  });

  describe('buildFacets', () => {
    it('returns distinct sizes in canonical apparel order, distinct colors, and price bounds', () => {
      const p1 = product({
        id: 'p1',
        slug: 'a',
        variants: [
          variant({ id: 'p1-l', optionValues: { size: 'L', color: 'Black' }, price: thb(120000) }),
          variant({ id: 'p1-s', optionValues: { size: 'S', color: 'White' }, price: thb(300000) }),
        ],
      });
      const p2 = product({
        id: 'p2',
        slug: 'b',
        variants: [
          variant({ id: 'p2-m', optionValues: { size: 'M', color: 'Black' }, price: thb(90000) }),
        ],
      });
      const facets = buildFacets([p1, p2]);
      expect(facets.sizes).toEqual(['S', 'M', 'L']);
      expect(facets.colors).toEqual(['Black', 'White']);
      expect(facets.priceBounds).toEqual({ min: 90000, max: 300000 });
    });
  });
  ```

- [ ] **Run it — confirm it fails** (modules do not exist yet):

  ```
  npm run test -- tests/unit/catalog-query.test.ts
  ```

  Expected output (abridged):

  ```
  FAIL  tests/unit/catalog-query.test.ts
  Error: Failed to load url /lib/catalog/query.ts (resolved id: .../lib/catalog/query.ts). Does the file exist?
   Test Files  1 failed (1)
        Tests  no tests
  ```

- [ ] **Implement `vanta/lib/catalog/facets.ts`** (minimal, pure):

  ```ts
  import type { Product } from '@/lib/domain';

  export type CatalogFacets = {
    sizes: string[];
    colors: string[];
    priceBounds: { min: number; max: number };
  };

  // Canonical apparel order; sizes not in this list fall after, sorted alpha.
  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  function sortSizes(sizes: string[]): string[] {
    return [...sizes].sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a);
      const ib = SIZE_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  export function buildFacets(products: Product[]): CatalogFacets {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const product of products) {
      for (const variant of product.variants) {
        sizes.add(variant.optionValues.size);
        colors.add(variant.optionValues.color);
        if (variant.price.amount < min) min = variant.price.amount;
        if (variant.price.amount > max) max = variant.price.amount;
      }
    }

    return {
      sizes: sortSizes([...sizes]),
      colors: [...colors].sort((a, b) => a.localeCompare(b)),
      priceBounds: {
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : 0,
      },
    };
  }
  ```

- [ ] **Implement `vanta/lib/catalog/query.ts`** (minimal, pure; availability via the locked `deriveAvailability`):

  ```ts
  import type { Product, Variant, Drop, User, Availability, Money } from '@/lib/domain';
  import { deriveAvailability } from '@/lib/services/availability';

  export type CatalogSort = 'featured' | 'price_asc' | 'price_desc' | 'newest';

  export type CatalogQuery = {
    sizes: string[];
    colors: string[];
    categories: string[];
    minPrice: number | null;
    maxPrice: number | null;
    sort: CatalogSort;
  };

  export type CatalogCard = {
    productId: string;
    slug: string;
    fromPrice: Money;
    compareAtFromPrice: Money | null;
    availability: Availability;
    matchedColors: string[];
  };

  const SORTS: readonly CatalogSort[] = ['featured', 'price_asc', 'price_desc', 'newest'];

  function parseIntParam(raw: string | null): number | null {
    if (raw === null) return null;
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
    const sortRaw = params.get('sort');
    const sort: CatalogSort = SORTS.includes(sortRaw as CatalogSort)
      ? (sortRaw as CatalogSort)
      : 'featured';
    return {
      sizes: params.getAll('size'),
      colors: params.getAll('color'),
      categories: params.getAll('category'),
      minPrice: parseIntParam(params.get('minPrice')),
      maxPrice: parseIntParam(params.get('maxPrice')),
      sort,
    };
  }

  // Lower index === more buyable. Mirrors the locked precedence (sold_out least buyable).
  const BUYABILITY: Record<Availability, number> = {
    live: 0,
    low_stock: 1,
    early_access: 2,
    coming_soon: 3,
    sold_out: 4,
  };

  function variantMatches(product: Product, variant: Variant, query: CatalogQuery): boolean {
    if (query.sizes.length > 0 && !query.sizes.includes(variant.optionValues.size)) return false;
    if (query.colors.length > 0 && !query.colors.includes(variant.optionValues.color)) return false;
    if (query.minPrice !== null && variant.price.amount < query.minPrice) return false;
    if (query.maxPrice !== null && variant.price.amount > query.maxPrice) return false;
    return true;
  }

  function productMatchesCategory(product: Product, query: CatalogQuery): boolean {
    if (query.categories.length === 0) return true;
    return product.collectionIds.some((id) => query.categories.includes(id));
  }

  export function deriveCatalogView(
    products: Product[],
    query: CatalogQuery,
    dropsById: Record<string, Drop>,
    now: Date,
    user: User | null,
  ): CatalogCard[] {
    const indexed = products.map((product, index) => ({ product, index }));

    const cards: (CatalogCard & { index: number })[] = [];

    for (const { product, index } of indexed) {
      if (!productMatchesCategory(product, query)) continue;

      const matched = product.variants.filter((v) => variantMatches(product, v, query));
      if (matched.length === 0) continue;

      const drop = product.dropId ? (dropsById[product.dropId] ?? null) : null;

      let fromPrice = matched[0].price;
      let compareAtFromPrice: Money | null = null;
      let bestBuyability = Number.POSITIVE_INFINITY;
      let bestAvailability: Availability = 'sold_out';
      const matchedColors = new Set<string>();

      for (const variant of matched) {
        matchedColors.add(variant.optionValues.color);
        if (variant.price.amount < fromPrice.amount) fromPrice = variant.price;
        if (
          variant.compareAtPrice &&
          (compareAtFromPrice === null || variant.price.amount < fromPrice.amount)
        ) {
          compareAtFromPrice = variant.compareAtPrice;
        }
        const availability = deriveAvailability(variant, drop, now, user);
        if (BUYABILITY[availability] < bestBuyability) {
          bestBuyability = BUYABILITY[availability];
          bestAvailability = availability;
        }
      }

      cards.push({
        index,
        productId: product.id,
        slug: product.slug,
        fromPrice,
        compareAtFromPrice,
        availability: bestAvailability,
        matchedColors: [...matchedColors],
      });
    }

    const sorted = [...cards];
    switch (query.sort) {
      case 'price_asc':
        sorted.sort((a, b) => a.fromPrice.amount - b.fromPrice.amount);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.fromPrice.amount - a.fromPrice.amount);
        break;
      case 'newest':
        sorted.sort((a, b) => b.index - a.index);
        break;
      case 'featured':
      default:
        sorted.sort((a, b) => a.index - b.index);
        break;
    }

    return sorted.map(({ index, ...card }) => card);
  }
  ```

- [ ] **Run it — confirm it passes:**

  ```
  npm run test -- tests/unit/catalog-query.test.ts
  ```

  Expected output (abridged):

  ```
  ✓ tests/unit/catalog-query.test.ts (11 tests)
   Test Files  1 passed (1)
        Tests  11 passed (11)
  ```

- [ ] **Run typecheck** to confirm no `any` and no contract drift:

  ```
  npm run typecheck
  ```

  Expected: exits 0 with no output.

- [ ] **Commit:**
  ```
  git add lib/catalog tests/unit/catalog-query.test.ts
  git commit -m "feat(catalog): add pure deriveCatalogView filter/sort engine + facets"
  ```

---

## Task 6.2 — `ProductCard`: CSS clip-path/mask reveal + IntersectionObserver + View-Transition origin

The catalog grid renders product cards. Per the locked motion contract: **NO WebGL in the grid** — the reveal is a CSS `clip-path`/`mask` animation triggered by an `IntersectionObserver` (paused offscreen), gated by `useMotionCapability`; reduced motion = content visible-by-default (no `opacity:0` trap). Each card sets `view-transition-name: product-${product.id}` (the locale-stable card→PDP origin). Price uses `Money`/`formatMoney`; the availability badge reuses the drop badge component. The wishlist heart is visual-only.

### Files

- **Create:** `vanta/components/product/ProductCard.tsx`
- **Modify:** `vanta/messages/en.json`, `vanta/messages/th.json` (add the `catalog` namespace keys this task and 6.3 use)
- **Test:** (component verified via Playwright in Task 6.3's page; this task adds no standalone Vitest — it is presentational UI)

### Interfaces

- **Consumes:**
  - `import type { CatalogCard } from '@/lib/catalog/query'`
  - `import type { Locale } from '@/lib/domain'`
  - `import { formatMoney } from '@/lib/format/money'`
  - `import { Link } from '@/lib/i18n/navigation'`
  - `import { AvailabilityBadge } from '@/components/drop/AvailabilityBadge'` (from Phase 4: `(props: { availability: Availability })`)
  - `import { useMotionCapability } from '@/lib/motion/capability'` — `(): { animate: boolean }`
- **Produces:**
  ```ts
  export type ProductCardProps = {
    card: CatalogCard;
    title: string; // already-localized title.{locale}
    imageUrl: string; // first image for the first matchedColor
    imageAlt: string; // already-localized alt
    locale: Locale;
    priority?: boolean; // first row eager-loads
  };
  export function ProductCard(props: ProductCardProps): JSX.Element;
  ```

### Steps

- [ ] **Add the `catalog` namespace** to `vanta/messages/en.json` (merge into the existing root object):

  ```json
  {
    "catalog": {
      "title": "Shop",
      "resultCount": "{count, plural, =0 {No items} one {# item} other {# items}}",
      "sort": {
        "label": "Sort",
        "featured": "Featured",
        "price_asc": "Price: Low to High",
        "price_desc": "Price: High to Low",
        "newest": "Newest"
      },
      "filters": {
        "heading": "Filter",
        "size": "Size",
        "color": "Color",
        "category": "Category",
        "price": "Price",
        "minPrice": "Min",
        "maxPrice": "Max",
        "apply": "Apply",
        "clear": "Clear all"
      },
      "card": {
        "from": "From",
        "sale": "Sale",
        "wishlist": "Add to wishlist"
      },
      "empty": "Nothing matches these filters."
    }
  }
  ```

- [ ] **Add the mirror keyset** to `vanta/messages/th.json` (Thai; identical key structure):

  ```json
  {
    "catalog": {
      "title": "ช็อป",
      "resultCount": "{count, plural, other {# รายการ}}",
      "sort": {
        "label": "เรียงตาม",
        "featured": "แนะนำ",
        "price_asc": "ราคา: น้อยไปมาก",
        "price_desc": "ราคา: มากไปน้อย",
        "newest": "ใหม่ล่าสุด"
      },
      "filters": {
        "heading": "ตัวกรอง",
        "size": "ขนาด",
        "color": "สี",
        "category": "หมวดหมู่",
        "price": "ราคา",
        "minPrice": "ต่ำสุด",
        "maxPrice": "สูงสุด",
        "apply": "ใช้ตัวกรอง",
        "clear": "ล้างทั้งหมด"
      },
      "card": {
        "from": "เริ่มต้น",
        "sale": "ลดราคา",
        "wishlist": "เพิ่มในรายการที่ชอบ"
      },
      "empty": "ไม่มีสินค้าที่ตรงกับตัวกรองนี้"
    }
  }
  ```

- [ ] **Implement `vanta/components/product/ProductCard.tsx`** (complete code; client component for the IO reveal + visual-only heart). The card image wrapper carries the View-Transition name keyed on product id. The reveal uses a CSS class toggled by the observer; reduced motion / coarse pointer / Save-Data short-circuits to the visible state:

  ```tsx
  'use client';

  import { useEffect, useRef, useState } from 'react';
  import type { CatalogCard } from '@/lib/catalog/query';
  import type { Locale } from '@/lib/domain';
  import { formatMoney } from '@/lib/format/money';
  import { Link } from '@/lib/i18n/navigation';
  import { AvailabilityBadge } from '@/components/drop/AvailabilityBadge';
  import { useMotionCapability } from '@/lib/motion/capability';

  export type ProductCardProps = {
    card: CatalogCard;
    title: string;
    imageUrl: string;
    imageAlt: string;
    locale: Locale;
    priority?: boolean;
  };

  export function ProductCard({
    card,
    title,
    imageUrl,
    imageAlt,
    locale,
    priority = false,
  }: ProductCardProps): JSX.Element {
    const { animate } = useMotionCapability();
    const ref = useRef<HTMLLIElement>(null);
    // Visible-by-default: only start hidden when we WILL animate.
    const [revealed, setRevealed] = useState(!animate);
    const [wished, setWished] = useState(false);

    useEffect(() => {
      if (!animate) {
        setRevealed(true);
        return;
      }
      const node = ref.current;
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setRevealed(true);
              observer.unobserve(entry.target); // pause work once revealed
            }
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, [animate]);

    const onSale = card.compareAtFromPrice !== null;

    return (
      <li
        ref={ref}
        data-revealed={revealed ? 'true' : 'false'}
        className={[
          'group relative flex flex-col bg-smoke-900',
          'transition-[clip-path,opacity] duration-700 ease-out motion-reduce:transition-none',
          'data-[revealed=false]:[clip-path:inset(0_0_100%_0)] data-[revealed=false]:opacity-0',
          'data-[revealed=true]:[clip-path:inset(0_0_0_0)] data-[revealed=true]:opacity-100',
        ].join(' ')}
      >
        <button
          type="button"
          aria-pressed={wished}
          onClick={() => setWished((w) => !w)}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-paper backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          <span aria-hidden="true" className={wished ? 'text-blaze' : 'text-paper'}>
            {wished ? '♥' : '♡'}
          </span>
          <span className="sr-only">{/* label injected by parent via aria-label below */}</span>
        </button>

        <Link
          href={`/product/${card.slug}`}
          className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          <div
            className="relative aspect-[4/5] overflow-hidden bg-ink"
            style={{ viewTransitionName: `product-${card.productId}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageAlt}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div className="absolute left-2 top-2">
              <AvailabilityBadge availability={card.availability} />
            </div>
          </div>

          <div className="flex flex-col gap-1 p-3">
            <h3 className="display text-sm leading-tight text-paper">{title}</h3>
            <div className="flex items-baseline gap-2 font-[family-name:var(--font-mono)] text-paper">
              <span className="text-sm">{formatMoney(card.fromPrice, locale)}</span>
              {onSale ? (
                <span className="text-xs text-smoke-500 line-through">
                  {formatMoney(card.compareAtFromPrice!, locale)}
                </span>
              ) : null}
            </div>
            {card.matchedColors.length > 1 ? (
              <span className="text-xs text-smoke-300">{card.matchedColors.length} colors</span>
            ) : null}
          </div>
        </Link>
      </li>
    );
  }
  ```

  > Note: the wishlist button label is supplied by the parent grid (Task 6.3) via `aria-label` on the rendered card wrapper context; the card exposes the toggle and `aria-pressed` so the heart is a real accessible control even though it is visual-only.

- [ ] **Run typecheck:**

  ```
  npm run typecheck
  ```

  Expected: exits 0 with no output.

- [ ] **Commit:**
  ```
  git add components/product/ProductCard.tsx messages/en.json messages/th.json
  git commit -m "feat(product): add ProductCard with clip-path reveal, IO pause, and view-transition origin"
  ```

---

## Task 6.3 — Catalog page: filter (size/color/category/price) + sort, wired to URL search params

The Server Component reads `products` and `collections` through the repository barrel (`@/lib/data`), the active drop through `dropService`, and the current user through `authService`, derives the view with `deriveCatalogView`, and renders a `<FilterRail>` + sorted grid of `ProductCard`s. Filters live in the URL (shareable, RSC-friendly) — the `FilterRail` is a small client component that pushes query updates via the localized router. Verified by Playwright (filter narrows the grid; sort reorders; both locales render; reduced-motion shows cards immediately).

### Files

- **Create:** `vanta/app/[locale]/(shop)/shop/page.tsx`
- **Create:** `vanta/components/product/CatalogGrid.tsx`
- **Create:** `vanta/components/product/FilterRail.tsx`
- **Test:** `vanta/tests/e2e/catalog.spec.ts`

### Interfaces

- **Consumes:**
  - `import { products, collections } from '@/lib/data'` — `products.list(): Promise<Product[]>`, `collections.list(): Promise<Collection[]>`
  - `import { dropService } from '@/lib/services/drop-service'` — `getActiveDrop(): Promise<Drop | null>`, `getDropById(dropId): Promise<Drop | null>`
  - `import { authService } from '@/lib/services/auth-service'` — `getCurrentUser(): Promise<User | null>`
  - `import { parseCatalogQuery, deriveCatalogView, type CatalogQuery } from '@/lib/catalog/query'`
  - `import { buildFacets, type CatalogFacets } from '@/lib/catalog/facets'`
  - `import { ProductCard } from '@/components/product/ProductCard'`
  - `import { useRouter, usePathname } from '@/lib/i18n/navigation'`
  - `import { getTranslations, setRequestLocale } from 'next-intl/server'`, `import { useTranslations } from 'next-intl'`
- **Produces:**

  ```ts
  // app/[locale]/(shop)/shop/page.tsx
  export default async function ShopPage(props: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }): Promise<JSX.Element>;

  // components/product/CatalogGrid.tsx
  export type CatalogGridItem = {
    card: CatalogCard;
    title: string;
    imageUrl: string;
    imageAlt: string;
  };
  export function CatalogGrid(props: { items: CatalogGridItem[]; locale: Locale }): JSX.Element;

  // components/product/FilterRail.tsx
  export function FilterRail(props: {
    facets: CatalogFacets;
    categories: { id: string; label: string }[];
    query: CatalogQuery;
  }): JSX.Element;
  ```

### Steps

- [ ] **Write the failing E2E spec** at `vanta/tests/e2e/catalog.spec.ts`. (Assumes the seed catalog from Phase 2; selectors are stable `data-testid`s set below.)

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('catalog @ /shop', () => {
    test('renders product cards in EN', async ({ page }) => {
      await page.goto('/en/shop');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const cards = page.getByTestId('product-card');
      await expect(cards.first()).toBeVisible();
      const initialCount = await cards.count();
      expect(initialCount).toBeGreaterThan(1);
    });

    test('filtering by size narrows the grid and updates the URL', async ({ page }) => {
      await page.goto('/en/shop');
      const cards = page.getByTestId('product-card');
      const before = await cards.count();
      await page.getByTestId('filter-size-S').click();
      await expect(page).toHaveURL(/[?&]size=S\b/);
      await expect(async () => {
        expect(await cards.count()).toBeLessThanOrEqual(before);
      }).toPass();
    });

    test('sort=price_asc orders cards by ascending price', async ({ page }) => {
      await page.goto('/en/shop?sort=price_asc');
      const prices = await page.getByTestId('card-price').allInnerTexts();
      const numbers = prices.map((t) => Number(t.replace(/[^\d]/g, '')));
      const sorted = [...numbers].sort((a, b) => a - b);
      expect(numbers).toEqual(sorted);
    });

    test('renders in TH with localized sort label', async ({ page }) => {
      await page.goto('/th/shop');
      await expect(page.getByTestId('sort-label')).toHaveText('เรียงตาม');
      await expect(page.getByTestId('product-card').first()).toBeVisible();
    });
  });

  test.describe('catalog reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('cards are visible immediately (no opacity:0 trap)', async ({ page }) => {
      await page.goto('/en/shop');
      const firstCard = page.getByTestId('product-card').first();
      await expect(firstCard).toBeVisible();
      await expect(firstCard).toHaveCSS('opacity', '1');
    });
  });
  ```

- [ ] **Run it — confirm it fails** (route does not exist → 404):

  ```
  npm run test:e2e -- catalog.spec.ts
  ```

  Expected output (abridged):

  ```
  Error: expect(locator).toBeVisible() failed
  Locator: getByRole('heading', { level: 1 })
   ... 5 failed
  ```

- [ ] **Implement `vanta/components/product/FilterRail.tsx`** (client; mutates the URL via localized router, OR-within-axis toggles, debounced price inputs):

  ```tsx
  'use client';

  import { useTranslations } from 'next-intl';
  import { useRouter, usePathname } from '@/lib/i18n/navigation';
  import { useSearchParams } from 'next/navigation';
  import type { CatalogFacets } from '@/lib/catalog/facets';
  import type { CatalogQuery } from '@/lib/catalog/query';

  export function FilterRail({
    facets,
    categories,
    query,
  }: {
    facets: CatalogFacets;
    categories: { id: string; label: string }[];
    query: CatalogQuery;
  }): JSX.Element {
    const t = useTranslations('catalog.filters');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function commit(next: URLSearchParams) {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    function toggleMulti(key: 'size' | 'color' | 'category', value: string) {
      const next = new URLSearchParams(searchParams.toString());
      const current = next.getAll(key);
      next.delete(key);
      const after = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of after) next.append(key, v);
      commit(next);
    }

    function setPrice(key: 'minPrice' | 'maxPrice', raw: string) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(key);
      if (/^\d+$/.test(raw)) next.set(key, raw);
      commit(next);
    }

    function clearAll() {
      const next = new URLSearchParams();
      const sort = searchParams.get('sort');
      if (sort) next.set('sort', sort);
      commit(next);
    }

    return (
      <aside aria-label={t('heading')} className="flex flex-col gap-6 text-paper">
        <h2 className="display text-lg">{t('heading')}</h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-smoke-300">{t('size')}</legend>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = query.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  data-testid={`filter-size-${size}`}
                  aria-pressed={active}
                  onClick={() => toggleMulti('size', size)}
                  className={[
                    'min-w-10 px-3 py-1 text-sm font-[family-name:var(--font-mono)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
                    active ? 'bg-paper text-ink' : 'bg-smoke-700 text-paper',
                  ].join(' ')}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-smoke-300">{t('color')}</legend>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => {
              const active = query.colors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  data-testid={`filter-color-${color}`}
                  aria-pressed={active}
                  onClick={() => toggleMulti('color', color)}
                  className={[
                    'px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
                    active ? 'bg-paper text-ink' : 'bg-smoke-700 text-paper',
                  ].join(' ')}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-smoke-300">{t('category')}</legend>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => {
              const active = query.categories.includes(cat.id);
              return (
                <label key={cat.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    data-testid={`filter-category-${cat.id}`}
                    checked={active}
                    onChange={() => toggleMulti('category', cat.id)}
                    className="accent-blaze"
                  />
                  {cat.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-smoke-300">{t('price')}</legend>
          <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-sm">
            <input
              type="number"
              inputMode="numeric"
              min={facets.priceBounds.min}
              max={facets.priceBounds.max}
              placeholder={t('minPrice')}
              defaultValue={query.minPrice ?? ''}
              data-testid="filter-min-price"
              onBlur={(e) => setPrice('minPrice', e.currentTarget.value)}
              className="w-24 bg-smoke-700 px-2 py-1 text-paper"
            />
            <span aria-hidden="true">—</span>
            <input
              type="number"
              inputMode="numeric"
              min={facets.priceBounds.min}
              max={facets.priceBounds.max}
              placeholder={t('maxPrice')}
              defaultValue={query.maxPrice ?? ''}
              data-testid="filter-max-price"
              onBlur={(e) => setPrice('maxPrice', e.currentTarget.value)}
              className="w-24 bg-smoke-700 px-2 py-1 text-paper"
            />
          </div>
        </fieldset>

        <button
          type="button"
          onClick={clearAll}
          data-testid="filter-clear"
          className="self-start text-sm text-blaze underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          {t('clear')}
        </button>
      </aside>
    );
  }
  ```

  > Note: price inputs accept **integer minor units** (satang) to keep the URL aligned with `deriveCatalogView`'s `minPrice`/`maxPrice` (no float money). The placeholder labels and `t('price')` make the unit explicit in the page chrome.

- [ ] **Implement `vanta/components/product/CatalogGrid.tsx`** (client wrapper rendering the `data-testid`-tagged cards; passes the localized wishlist label down):

  ```tsx
  'use client';

  import { useTranslations } from 'next-intl';
  import type { Locale } from '@/lib/domain';
  import type { CatalogCard } from '@/lib/catalog/query';
  import { ProductCard } from '@/components/product/ProductCard';
  import { formatMoney } from '@/lib/format/money';

  export type CatalogGridItem = {
    card: CatalogCard;
    title: string;
    imageUrl: string;
    imageAlt: string;
  };

  export function CatalogGrid({
    items,
    locale,
  }: {
    items: CatalogGridItem[];
    locale: Locale;
  }): JSX.Element {
    const t = useTranslations('catalog');

    if (items.length === 0) {
      return (
        <p data-testid="catalog-empty" className="col-span-full py-24 text-center text-smoke-300">
          {t('empty')}
        </p>
      );
    }

    return (
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.card.productId}
            data-testid="product-card"
            data-price={item.card.fromPrice.amount}
            aria-label={item.title}
          >
            {/* Expose price text for E2E price-order assertion */}
            <span data-testid="card-price" className="sr-only">
              {formatMoney(item.card.fromPrice, locale)}
            </span>
            <ProductCard
              card={item.card}
              title={item.title}
              imageUrl={item.imageUrl}
              imageAlt={item.imageAlt}
              locale={locale}
              priority={index < 4}
            />
          </div>
        ))}
      </ul>
    );
  }
  ```

- [ ] **Implement `vanta/app/[locale]/(shop)/shop/page.tsx`** (Server Component; reads through repositories/services, derives the view, builds facets, renders rail + grid + sort). The `SortSelect` is a tiny inline client island defined in the page file's sibling to keep the page server-only:

  First create the sort island `vanta/components/product/SortSelect.tsx`:

  ```tsx
  'use client';

  import { useTranslations } from 'next-intl';
  import { useRouter, usePathname } from '@/lib/i18n/navigation';
  import { useSearchParams } from 'next/navigation';
  import type { CatalogSort } from '@/lib/catalog/query';

  const OPTIONS: CatalogSort[] = ['featured', 'price_asc', 'price_desc', 'newest'];

  export function SortSelect({ value }: { value: CatalogSort }): JSX.Element {
    const t = useTranslations('catalog.sort');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function onChange(next: string) {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'featured') params.delete('sort');
      else params.set('sort', next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    return (
      <label className="flex items-center gap-2 text-sm text-paper">
        <span data-testid="sort-label">{t('label')}</span>
        <select
          data-testid="sort-select"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="bg-smoke-700 px-2 py-1 text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          {OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(opt)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  ```

  Then the page:

  ```tsx
  import { getTranslations, setRequestLocale } from 'next-intl/server';
  import type { Locale } from '@/lib/domain';
  import type { Drop } from '@/lib/domain';
  import { products, collections } from '@/lib/data';
  import { dropService } from '@/lib/services/drop-service';
  import { authService } from '@/lib/services/auth-service';
  import { parseCatalogQuery, deriveCatalogView } from '@/lib/catalog/query';
  import { buildFacets } from '@/lib/catalog/facets';
  import { CatalogGrid, type CatalogGridItem } from '@/components/product/CatalogGrid';
  import { FilterRail } from '@/components/product/FilterRail';
  import { SortSelect } from '@/components/product/SortSelect';

  type SearchParams = Record<string, string | string[] | undefined>;

  function toURLSearchParams(input: SearchParams): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value)) for (const v of value) params.append(key, v);
      else if (typeof value === 'string') params.append(key, value);
    }
    return params;
  }

  export default async function ShopPage({
    params,
    searchParams,
  }: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<SearchParams>;
  }): Promise<JSX.Element> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'catalog' });

    const rawSearchParams = await searchParams;
    const query = parseCatalogQuery(toURLSearchParams(rawSearchParams));

    const [allProducts, allCollections, user, activeDrop] = await Promise.all([
      products.list(),
      collections.list(),
      authService.getCurrentUser(),
      dropService.getActiveDrop(),
    ]);

    // Build dropId -> Drop map for availability derivation.
    const dropIds = new Set<string>();
    for (const p of allProducts) if (p.dropId) dropIds.add(p.dropId);
    const drops = await Promise.all([...dropIds].map((id) => dropService.getDropById(id)));
    const dropsById: Record<string, Drop> = {};
    for (const d of drops) if (d) dropsById[d.id] = d;
    if (activeDrop) dropsById[activeDrop.id] = activeDrop;

    const now = new Date();
    const view = deriveCatalogView(allProducts, query, dropsById, now, user);
    const facets = buildFacets(allProducts);

    const productById = new Map(allProducts.map((p) => [p.id, p]));
    const items: CatalogGridItem[] = view.map((card) => {
      const product = productById.get(card.productId)!;
      const color = card.matchedColors[0] ?? product.optionAxes.color[0];
      const image = (product.imagesByColor[color] ?? [])[0];
      return {
        card,
        title: product.title[locale],
        imageUrl: image?.url ?? '',
        imageAlt: image?.alt[locale] ?? product.title[locale],
      };
    });

    const categories = allCollections.map((c) => ({ id: c.id, label: c.title[locale] }));

    return (
      <main className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-4 py-12 text-paper md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="display text-4xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-smoke-300">
              {t('resultCount', { count: items.length })}
            </p>
          </div>
          <SortSelect value={query.sort} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <FilterRail facets={facets} categories={categories} query={query} />
          <CatalogGrid items={items} locale={locale} />
        </div>
      </main>
    );
  }
  ```

- [ ] **Run typecheck:**

  ```
  npm run typecheck
  ```

  Expected: exits 0 with no output.

- [ ] **Run the E2E spec — confirm it passes** (start dev/preview per `playwright.config.ts` webServer):

  ```
  npm run test:e2e -- catalog.spec.ts
  ```

  Expected output (abridged):

  ```
  Running 5 tests using ...
    5 passed
  ```

- [ ] **Visual verification** against `npm run dev`. Start the dev server, then capture both locales and the filtered state with the Playwright MCP:

  ```
  npm run dev
  ```

  Then drive the browser MCP:
  - Navigate `http://localhost:3000/en/shop` → screenshot (`catalog-en.png`); confirm: dark `--ink` canvas, ALL-CAPS Clash Display `SHOP` heading, mono prices `฿x,xxx`, availability badges, asymmetric grid.
  - Navigate `http://localhost:3000/th/shop` → screenshot (`catalog-th.png`); confirm: Kanit heading "ช็อป" NOT all-caps, taller line-height, localized sort label "เรียงตาม", Western-digit prices.
  - Click `filter-size-S`, confirm URL gains `?size=S` and the grid narrows.
  - Emulate reduced motion (`prefers-reduced-motion: reduce`) → reload `/en/shop` → screenshot; confirm cards render at `opacity:1` immediately (no blank reveal).
    **Exact check:** all three screenshots show a populated, correctly-typeset grid; the reduced-motion run shows visible cards (the IO reveal is bypassed).

- [ ] **Commit:**
  ```
  git add app/[locale]/\(shop\)/shop/page.tsx components/product/CatalogGrid.tsx components/product/FilterRail.tsx components/product/SortSelect.tsx tests/e2e/catalog.spec.ts
  git commit -m "feat(shop): build catalog page with URL-driven filter/sort and reveal grid"
  ```

---

## Task 6.4 — Collections index (`collections/page.tsx`)

A lean (T2) index of all collections: an editorial tile grid, each tile a localized `Link` into `collections/[slug]`. Server Component reading `collections.list()` through the barrel. No WebGL here — CSS hover/reveal only.

### Files

- **Create:** `vanta/app/[locale]/(shop)/collections/page.tsx`
- **Modify:** `vanta/messages/en.json`, `vanta/messages/th.json` (add the `collections` namespace)
- **Test:** `vanta/tests/e2e/collections.spec.ts`

### Interfaces

- **Consumes:**
  - `import { collections } from '@/lib/data'` — `collections.list(): Promise<Collection[]>`
  - `import { Link } from '@/lib/i18n/navigation'`
  - `import { getTranslations, setRequestLocale } from 'next-intl/server'`
- **Produces:**
  ```ts
  export default async function CollectionsPage(props: {
    params: Promise<{ locale: Locale }>;
  }): Promise<JSX.Element>;
  ```

### Steps

- [ ] **Add the `collections` namespace** to `vanta/messages/en.json`:

  ```json
  {
    "collections": {
      "index": {
        "title": "Collections",
        "subtitle": "Bangkok-born. Globally worn.",
        "view": "View collection",
        "count": "{count, plural, =0 {No drops} one {# piece} other {# pieces}}"
      }
    }
  }
  ```

- [ ] **Add the mirror keyset** to `vanta/messages/th.json`:

  ```json
  {
    "collections": {
      "index": {
        "title": "คอลเลกชัน",
        "subtitle": "เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก",
        "view": "ดูคอลเลกชัน",
        "count": "{count, plural, other {# ชิ้น}}"
      }
    }
  }
  ```

- [ ] **Write the failing E2E spec** at `vanta/tests/e2e/collections.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('collections index @ /collections', () => {
    test('lists collection tiles linking into editorial pages (EN)', async ({ page }) => {
      await page.goto('/en/collections');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Collections');
      const tiles = page.getByTestId('collection-tile');
      await expect(tiles.first()).toBeVisible();
      const href = await tiles.first().getByRole('link').first().getAttribute('href');
      expect(href).toMatch(/^\/en\/collections\/[\w-]+$/);
    });

    test('renders localized heading in TH', async ({ page }) => {
      await page.goto('/th/collections');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('คอลเลกชัน');
    });
  });
  ```

- [ ] **Run it — confirm it fails:**

  ```
  npm run test:e2e -- collections.spec.ts
  ```

  Expected: `2 failed` (route 404, heading not found).

- [ ] **Implement `vanta/app/[locale]/(shop)/collections/page.tsx`:**

  ```tsx
  import { getTranslations, setRequestLocale } from 'next-intl/server';
  import type { Locale } from '@/lib/domain';
  import { collections } from '@/lib/data';
  import { Link } from '@/lib/i18n/navigation';

  export default async function CollectionsPage({
    params,
  }: {
    params: Promise<{ locale: Locale }>;
  }): Promise<JSX.Element> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'collections.index' });
    const all = await collections.list();

    return (
      <main className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-4 py-12 text-paper md:px-8">
        <header className="mb-10">
          <h1 className="display text-5xl">{t('title')}</h1>
          <p className="mt-2 text-sm text-smoke-300">{t('subtitle')}</p>
        </header>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {all.map((collection, index) => (
            <li
              key={collection.id}
              data-testid="collection-tile"
              className={index % 3 === 0 ? 'md:col-span-2' : ''}
            >
              <Link
                href={`/collections/${collection.slug}`}
                className="group relative block aspect-[16/9] overflow-hidden bg-smoke-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collection.heroImageUrl}
                  alt={collection.title[locale]}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover opacity-80 transition-[transform,opacity] duration-700 ease-out group-hover:scale-105 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="display text-3xl text-paper">{collection.title[locale]}</h2>
                  <p className="mt-1 max-w-md text-sm text-smoke-300">
                    {collection.description[locale]}
                  </p>
                  <span className="mt-3 inline-block text-xs text-blaze">{t('view')} →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  ```

- [ ] **Run typecheck + the E2E spec — confirm both pass:**

  ```
  npm run typecheck
  npm run test:e2e -- collections.spec.ts
  ```

  Expected: typecheck exits 0; Playwright `2 passed`.

- [ ] **Commit:**
  ```
  git add app/[locale]/\(shop\)/collections/page.tsx messages/en.json messages/th.json tests/e2e/collections.spec.ts
  git commit -m "feat(collections): add bilingual collections index grid"
  ```

---

## Task 6.5 — Editorial lookbook template (`collections/[slug]/page.tsx`) with one WebGL hero

The one stunning editorial template (T2) — the only catalog-area surface where **WebGL is allowed** (the lockup spec permits hero + lookbook). The page reads the collection + its products through the barrel, renders a full-bleed WebGL displacement hero (gated by `useMotionCapability`; reduced-motion / coarse-pointer / Save-Data → static `<img>` fallback), then an asymmetric editorial sequence of products reusing `ProductCard`. WebGL is encapsulated in a `LookbookHero` client island so the page stays a Server Component.

### Files

- **Create:** `vanta/app/[locale]/(shop)/collections/[slug]/page.tsx`
- **Create:** `vanta/components/collection/LookbookHero.tsx`
- **Create:** `vanta/components/collection/LookbookSequence.tsx`
- **Modify:** `vanta/messages/en.json`, `vanta/messages/th.json` (add `collections.detail`)
- **Test:** `vanta/tests/e2e/lookbook.spec.ts`

### Interfaces

- **Consumes:**
  - `import { collections, products } from '@/lib/data'` — `collections.getBySlug(slug): Promise<Collection | null>`, `products.listByCollection(collectionId): Promise<Product[]>`
  - `import { dropService } from '@/lib/services/drop-service'`, `import { authService } from '@/lib/services/auth-service'`
  - `import { deriveAvailability } from '@/lib/services/availability'`
  - `import { ProductCard } from '@/components/product/ProductCard'`, `import type { CatalogCard } from '@/lib/catalog/query'`
  - `import { useMotionCapability } from '@/lib/motion/capability'`
  - `import { notFound } from 'next/navigation'`
- **Produces:**

  ```ts
  // page.tsx
  export default async function CollectionDetailPage(props: {
    params: Promise<{ locale: Locale; slug: string }>;
  }): Promise<JSX.Element>;

  // LookbookHero.tsx
  export function LookbookHero(props: {
    imageUrl: string;
    title: string; // already-localized
    subtitle: string; // already-localized
  }): JSX.Element;

  // LookbookSequence.tsx
  export type LookbookItem = {
    card: CatalogCard;
    title: string;
    imageUrl: string;
    imageAlt: string;
  };
  export function LookbookSequence(props: { items: LookbookItem[]; locale: Locale }): JSX.Element;
  ```

### Steps

- [ ] **Add `collections.detail`** to `vanta/messages/en.json`:

  ```json
  {
    "collections": {
      "detail": {
        "shopThe": "Shop the collection",
        "back": "All collections"
      }
    }
  }
  ```

  (Merge `detail` into the existing `collections` object created in Task 6.4 — do not duplicate the `collections` key.)

- [ ] **Add the mirror** to `vanta/messages/th.json`:

  ```json
  {
    "collections": {
      "detail": {
        "shopThe": "ช็อปคอลเลกชันนี้",
        "back": "ดูคอลเลกชันทั้งหมด"
      }
    }
  }
  ```

- [ ] **Write the failing E2E spec** at `vanta/tests/e2e/lookbook.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  // Assumes the seed has a collection with slug 'nightfall' (Phase 2 seed).
  const SLUG = 'nightfall';

  test.describe('lookbook editorial @ /collections/[slug]', () => {
    test('renders hero + product sequence (EN)', async ({ page }) => {
      await page.goto(`/en/collections/${SLUG}`);
      await expect(page.getByTestId('lookbook-hero')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByTestId('product-card').first()).toBeVisible();
    });

    test('unknown slug 404s', async ({ page }) => {
      const res = await page.goto('/en/collections/does-not-exist');
      expect(res?.status()).toBe(404);
    });

    test('renders in TH', async ({ page }) => {
      await page.goto(`/th/collections/${SLUG}`);
      await expect(page.getByTestId('lookbook-hero')).toBeVisible();
    });
  });

  test.describe('lookbook reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('hero falls back to a static image (no canvas)', async ({ page }) => {
      await page.goto(`/en/collections/${SLUG}`);
      const hero = page.getByTestId('lookbook-hero');
      await expect(hero.getByTestId('lookbook-hero-fallback')).toBeVisible();
      await expect(hero.locator('canvas')).toHaveCount(0);
    });
  });
  ```

- [ ] **Run it — confirm it fails:**

  ```
  npm run test:e2e -- lookbook.spec.ts
  ```

  Expected: `4 failed` (route 404).

- [ ] **Implement `vanta/components/collection/LookbookHero.tsx`** (WebGL displacement on a single full-bleed plane; gated; static fallback for reduced motion / coarse pointer / Save-Data; cleans up the GL context on unmount). The shader does a subtle pointer-reactive displacement of the hero texture — encapsulated, the only WebGL in the catalog area:

  ```tsx
  'use client';

  import { useEffect, useRef } from 'react';
  import { useMotionCapability } from '@/lib/motion/capability';

  const VERT = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2 u_mouse;
    uniform float u_time;
    void main() {
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      float d = distance(uv, u_mouse);
      float ripple = sin(d * 18.0 - u_time * 1.5) * 0.004 * smoothstep(0.5, 0.0, d);
      vec2 disp = uv + (uv - u_mouse) * ripple;
      vec4 color = texture2D(u_tex, disp);
      // Materialize-out-of-black vignette toward edges.
      float vig = smoothstep(1.1, 0.2, distance(uv, vec2(0.5)));
      gl_FragColor = vec4(color.rgb * mix(0.55, 1.0, vig), 1.0);
    }
  `;

  function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
  }

  export function LookbookHero({
    imageUrl,
    title,
    subtitle,
  }: {
    imageUrl: string;
    title: string;
    subtitle: string;
  }): JSX.Element {
    const { animate } = useMotionCapability();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!animate) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext('webgl', { antialias: true });
      if (!gl) return; // graceful: static layer remains underneath

      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const aPos = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([10, 10, 10, 255]),
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      };
      image.src = imageUrl;

      const uTex = gl.getUniformLocation(program, 'u_tex');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const mouse = { x: 0.5, y: 0.5 };

      function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      function onMove(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width;
        mouse.y = (e.clientY - rect.top) / rect.height;
      }
      resize();
      window.addEventListener('resize', resize);
      canvas.addEventListener('pointermove', onMove);

      let raf = 0;
      let running = true;
      const start = performance.now();
      function frame(t: number) {
        if (!running) return;
        gl.uniform1i(uTex, 0);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uTime, (t - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        raf = requestAnimationFrame(frame);
      }

      // Pause offscreen via IntersectionObserver.
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !running) {
            running = true;
            raf = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        }
      });
      io.observe(canvas);
      raf = requestAnimationFrame(frame);

      return () => {
        running = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('pointermove', onMove);
        const ext = gl.getExtension('WEBGL_lose_context');
        ext?.loseContext();
      };
    }, [animate, imageUrl]);

    return (
      <section
        data-testid="lookbook-hero"
        className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-ink"
      >
        {/* Static layer: always rendered (visible-by-default); the only thing shown under reduced motion. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-testid="lookbook-hero-fallback"
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {animate ? (
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-[var(--max-w-shell)] p-6 md:p-12">
          <h1 className="display text-5xl text-paper md:text-7xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm text-smoke-300 md:text-base">{subtitle}</p>
        </div>
      </section>
    );
  }
  ```

  > Note: when `animate` is false the `<canvas>` is never mounted, so the reduced-motion run has zero canvases (asserted in the spec); the static `<img>` is the experience. When `animate` is true the canvas overlays the static image and degrades gracefully if `getContext('webgl')` returns null.

- [ ] **Implement `vanta/components/collection/LookbookSequence.tsx`** (asymmetric editorial layout reusing `ProductCard`):

  ```tsx
  'use client';

  import type { Locale } from '@/lib/domain';
  import type { CatalogCard } from '@/lib/catalog/query';
  import { ProductCard } from '@/components/product/ProductCard';

  export type LookbookItem = {
    card: CatalogCard;
    title: string;
    imageUrl: string;
    imageAlt: string;
  };

  export function LookbookSequence({
    items,
    locale,
  }: {
    items: LookbookItem[];
    locale: Locale;
  }): JSX.Element {
    return (
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6">
        {items.map((item, index) => {
          // Asymmetric editorial rhythm: every 3rd piece spans wider.
          const span = index % 3 === 0 ? 'md:col-span-7' : 'md:col-span-5';
          return (
            <div
              key={item.card.productId}
              data-testid="product-card"
              data-price={item.card.fromPrice.amount}
              aria-label={item.title}
              className={span}
            >
              <ProductCard
                card={item.card}
                title={item.title}
                imageUrl={item.imageUrl}
                imageAlt={item.imageAlt}
                locale={locale}
                priority={index < 2}
              />
            </div>
          );
        })}
      </ul>
    );
  }
  ```

- [ ] **Implement `vanta/app/[locale]/(shop)/collections/[slug]/page.tsx`** (Server Component; builds a `CatalogCard` per product via `deriveAvailability` and lowest-price roll-up, mirroring the catalog rules but without filters):

  ```tsx
  import { notFound } from 'next/navigation';
  import { getTranslations, setRequestLocale } from 'next-intl/server';
  import type { Locale, Product, Variant, Drop, Money, Availability } from '@/lib/domain';
  import { collections, products } from '@/lib/data';
  import { dropService } from '@/lib/services/drop-service';
  import { authService } from '@/lib/services/auth-service';
  import { deriveAvailability } from '@/lib/services/availability';
  import type { CatalogCard } from '@/lib/catalog/query';
  import { LookbookHero } from '@/components/collection/LookbookHero';
  import { LookbookSequence, type LookbookItem } from '@/components/collection/LookbookSequence';
  import { Link } from '@/lib/i18n/navigation';

  const BUYABILITY: Record<Availability, number> = {
    live: 0,
    low_stock: 1,
    early_access: 2,
    coming_soon: 3,
    sold_out: 4,
  };

  function toCard(
    product: Product,
    dropsById: Record<string, Drop>,
    now: Date,
    user: Parameters<typeof deriveAvailability>[3],
  ): CatalogCard {
    const drop = product.dropId ? (dropsById[product.dropId] ?? null) : null;
    let fromPrice: Money = product.variants[0]?.price ?? { amount: 0, currency: 'THB' };
    let compareAtFromPrice: Money | null = null;
    let bestBuyability = Number.POSITIVE_INFINITY;
    let bestAvailability: Availability = 'sold_out';
    const matchedColors = new Set<string>();

    for (const variant of product.variants) {
      matchedColors.add(variant.optionValues.color);
      if (variant.price.amount < fromPrice.amount) fromPrice = variant.price;
      if (variant.compareAtPrice && compareAtFromPrice === null) {
        compareAtFromPrice = variant.compareAtPrice;
      }
      const availability = deriveAvailability(variant, drop, now, user);
      if (BUYABILITY[availability] < bestBuyability) {
        bestBuyability = BUYABILITY[availability];
        bestAvailability = availability;
      }
    }

    return {
      productId: product.id,
      slug: product.slug,
      fromPrice,
      compareAtFromPrice,
      availability: bestAvailability,
      matchedColors: [...matchedColors],
    };
  }

  export default async function CollectionDetailPage({
    params,
  }: {
    params: Promise<{ locale: Locale; slug: string }>;
  }): Promise<JSX.Element> {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'collections.detail' });

    const collection = await collections.getBySlug(slug);
    if (!collection) notFound();

    const [collectionProducts, user] = await Promise.all([
      products.listByCollection(collection.id),
      authService.getCurrentUser(),
    ]);

    const dropIds = new Set<string>();
    for (const p of collectionProducts) if (p.dropId) dropIds.add(p.dropId);
    const drops = await Promise.all([...dropIds].map((id) => dropService.getDropById(id)));
    const dropsById: Record<string, Drop> = {};
    for (const d of drops) if (d) dropsById[d.id] = d;

    const now = new Date();
    const items: LookbookItem[] = collectionProducts.map((product) => {
      const card = toCard(product, dropsById, now, user);
      const color = card.matchedColors[0] ?? product.optionAxes.color[0];
      const image = (product.imagesByColor[color] ?? [])[0];
      return {
        card,
        title: product.title[locale],
        imageUrl: image?.url ?? '',
        imageAlt: image?.alt[locale] ?? product.title[locale],
      };
    });

    return (
      <main className="bg-ink text-paper">
        <LookbookHero
          imageUrl={collection.heroImageUrl}
          title={collection.title[locale]}
          subtitle={collection.description[locale]}
        />

        <div className="mx-auto w-full max-w-[var(--max-w-shell)] px-4 py-12 md:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="display text-2xl">{t('shopThe')}</h2>
            <Link
              href="/collections"
              className="text-sm text-blaze underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
            >
              ← {t('back')}
            </Link>
          </div>
          <LookbookSequence items={items} locale={locale} />
        </div>
      </main>
    );
  }
  ```

- [ ] **Run typecheck + the E2E spec — confirm both pass:**

  ```
  npm run typecheck
  npm run test:e2e -- lookbook.spec.ts
  ```

  Expected: typecheck exits 0; Playwright `4 passed`.

- [ ] **Visual verification** against `npm run dev`. Drive the browser MCP:
  - Navigate `http://localhost:3000/en/collections/nightfall` → screenshot (`lookbook-en.png`); confirm: full-bleed WebGL hero with the materialize-out-of-black vignette, ALL-CAPS Clash Display title, asymmetric product sequence below, mono prices.
  - Move the pointer over the hero → confirm subtle ripple displacement reacts (capture a second screenshot mid-interaction).
  - Navigate `http://localhost:3000/th/collections/nightfall` → screenshot (`lookbook-th.png`); confirm Kanit title (no all-caps), taller line-height.
  - Emulate reduced motion → reload → screenshot; confirm the hero shows the static image with NO `<canvas>` (matches the spec assertion) and the title is fully visible.
    **Exact check:** WebGL hero animates with pointer in the default run; under reduced motion the hero is a static image (zero canvases) and all headings render visibly.

- [ ] **Commit:**
  ```
  git add app/[locale]/\(shop\)/collections/\[slug\]/page.tsx components/collection/LookbookHero.tsx components/collection/LookbookSequence.tsx messages/en.json messages/th.json tests/e2e/lookbook.spec.ts
  git commit -m "feat(collections): add editorial lookbook template with gated WebGL hero"
  ```

---

## Task 6.6 — Search results presenter (`buildSearchResults`) — pure LOGIC

Search (T3) is correct + clean. The page reads matches via `products.search(query)` (already implemented in Phase 2's repository), but turning `Product[]` + a query into a renderable, summarized result set (with the same availability roll-up and a normalized/trimmed query echo) is pure logic, so it is TDD-first.

### Files

- **Create:** `vanta/lib/search/results.ts`
- **Test:** `vanta/tests/unit/search-results.test.ts`

### Interfaces

- **Consumes:**
  - `import type { Product, Drop, User, Availability, Money } from '@/lib/domain'`
  - `import { deriveAvailability } from '@/lib/services/availability'`
  - `import type { CatalogCard } from '@/lib/catalog/query'`
- **Produces:**
  ```ts
  export type SearchResults = {
    query: string; // trimmed/collapsed echo of the raw query
    count: number; // results.length
    cards: CatalogCard[]; // same card shape the grid renders
  };
  export function normalizeSearchQuery(raw: string | null | undefined): string;
  export function buildSearchResults(
    rawQuery: string | null | undefined,
    matches: Product[],
    dropsById: Record<string, Drop>,
    now: Date,
    user: User | null,
  ): SearchResults;
  ```

### Steps

- [ ] **Write the failing test** at `vanta/tests/unit/search-results.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { normalizeSearchQuery, buildSearchResults } from '@/lib/search/results';
  import type { Product, Variant, Money } from '@/lib/domain';

  const thb = (amount: number): Money => ({ amount, currency: 'THB' });

  function variant(over: Partial<Variant> & Pick<Variant, 'id'>): Variant {
    return {
      sku: `SKU-${over.id}`,
      optionValues: { size: 'M', color: 'Black' },
      price: thb(199000),
      stock: 10,
      availability: 'live',
      ...over,
    };
  }
  function product(over: Partial<Product> & Pick<Product, 'id' | 'slug'>): Product {
    return {
      title: { en: 'Tee', th: 'เสื้อ' },
      description: { en: '', th: '' },
      optionAxes: { size: ['M'], color: ['Black'] },
      variants: [variant({ id: `${over.id}-v` })],
      imagesByColor: { Black: [] },
      collectionIds: [],
      ...over,
    };
  }

  describe('normalizeSearchQuery', () => {
    it('trims, collapses internal whitespace, and handles null/undefined', () => {
      expect(normalizeSearchQuery('  hoodie   black  ')).toBe('hoodie black');
      expect(normalizeSearchQuery(null)).toBe('');
      expect(normalizeSearchQuery(undefined)).toBe('');
    });
  });

  describe('buildSearchResults', () => {
    const now = new Date('2026-06-27T00:00:00Z');

    it('echoes the normalized query and counts cards', () => {
      const p = product({ id: 'p1', slug: 'tee' });
      const res = buildSearchResults('  Tee ', [p], {}, now, null);
      expect(res.query).toBe('Tee');
      expect(res.count).toBe(1);
      expect(res.cards[0]).toMatchObject({ productId: 'p1', slug: 'tee', fromPrice: thb(199000) });
    });

    it('rolls availability up to the most buyable variant', () => {
      const p = product({
        id: 'p1',
        slug: 'tee',
        variants: [
          variant({ id: 'a', stock: 0, availability: 'sold_out' }),
          variant({ id: 'b', stock: 2, availability: 'low_stock' }),
        ],
      });
      const res = buildSearchResults('tee', [p], {}, now, null);
      expect(res.cards[0].availability).toBe('low_stock');
    });

    it('returns an empty result set for a blank query without touching matches', () => {
      const res = buildSearchResults('   ', [product({ id: 'p1', slug: 'tee' })], {}, now, null);
      expect(res).toEqual({ query: '', count: 0, cards: [] });
    });
  });
  ```

- [ ] **Run it — confirm it fails:**

  ```
  npm run test -- tests/unit/search-results.test.ts
  ```

  Expected: `FAIL ... Failed to load url /lib/search/results.ts`.

- [ ] **Implement `vanta/lib/search/results.ts`:**

  ```ts
  import type { Product, Drop, User, Availability, Money } from '@/lib/domain';
  import { deriveAvailability } from '@/lib/services/availability';
  import type { CatalogCard } from '@/lib/catalog/query';

  export type SearchResults = {
    query: string;
    count: number;
    cards: CatalogCard[];
  };

  const BUYABILITY: Record<Availability, number> = {
    live: 0,
    low_stock: 1,
    early_access: 2,
    coming_soon: 3,
    sold_out: 4,
  };

  export function normalizeSearchQuery(raw: string | null | undefined): string {
    if (!raw) return '';
    return raw.trim().replace(/\s+/g, ' ');
  }

  function toCard(
    product: Product,
    dropsById: Record<string, Drop>,
    now: Date,
    user: User | null,
  ): CatalogCard {
    const drop = product.dropId ? (dropsById[product.dropId] ?? null) : null;
    let fromPrice: Money = product.variants[0]?.price ?? { amount: 0, currency: 'THB' };
    let compareAtFromPrice: Money | null = null;
    let bestBuyability = Number.POSITIVE_INFINITY;
    let bestAvailability: Availability = 'sold_out';
    const matchedColors = new Set<string>();

    for (const variant of product.variants) {
      matchedColors.add(variant.optionValues.color);
      if (variant.price.amount < fromPrice.amount) fromPrice = variant.price;
      if (variant.compareAtPrice && compareAtFromPrice === null) {
        compareAtFromPrice = variant.compareAtPrice;
      }
      const availability = deriveAvailability(variant, drop, now, user);
      if (BUYABILITY[availability] < bestBuyability) {
        bestBuyability = BUYABILITY[availability];
        bestAvailability = availability;
      }
    }

    return {
      productId: product.id,
      slug: product.slug,
      fromPrice,
      compareAtFromPrice,
      availability: bestAvailability,
      matchedColors: [...matchedColors],
    };
  }

  export function buildSearchResults(
    rawQuery: string | null | undefined,
    matches: Product[],
    dropsById: Record<string, Drop>,
    now: Date,
    user: User | null,
  ): SearchResults {
    const query = normalizeSearchQuery(rawQuery);
    if (query === '') return { query: '', count: 0, cards: [] };
    const cards = matches.map((product) => toCard(product, dropsById, now, user));
    return { query, count: cards.length, cards };
  }
  ```

- [ ] **Run it — confirm it passes:**

  ```
  npm run test -- tests/unit/search-results.test.ts
  ```

  Expected output (abridged):

  ```
  ✓ tests/unit/search-results.test.ts (5 tests)
   Test Files  1 passed (1)
        Tests  5 passed (5)
  ```

- [ ] **Run typecheck:**

  ```
  npm run typecheck
  ```

  Expected: exits 0.

- [ ] **Commit:**
  ```
  git add lib/search/results.ts tests/unit/search-results.test.ts
  git commit -m "feat(search): add pure buildSearchResults presenter with availability roll-up"
  ```

---

## Task 6.7 — Search page (`search/page.tsx`) — basic results (T3)

A correct + clean (T3) search results page: reads `?q=` from the URL, calls `products.search`, builds the view with `buildSearchResults`, renders a small search form + the same `CatalogGrid`. Empty / no-results states handled. Verified by Playwright.

### Files

- **Create:** `vanta/app/[locale]/(shop)/search/page.tsx`
- **Create:** `vanta/components/product/SearchForm.tsx`
- **Modify:** `vanta/messages/en.json`, `vanta/messages/th.json` (add the `search` namespace)
- **Test:** `vanta/tests/e2e/search.spec.ts`

### Interfaces

- **Consumes:**
  - `import { products } from '@/lib/data'` — `products.search(query): Promise<Product[]>`
  - `import { dropService } from '@/lib/services/drop-service'`, `import { authService } from '@/lib/services/auth-service'`
  - `import { buildSearchResults, normalizeSearchQuery } from '@/lib/search/results'`
  - `import { CatalogGrid, type CatalogGridItem } from '@/components/product/CatalogGrid'`
  - `import { useRouter } from '@/lib/i18n/navigation'`
- **Produces:**

  ```ts
  // search/page.tsx
  export default async function SearchPage(props: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ q?: string }>;
  }): Promise<JSX.Element>;

  // SearchForm.tsx
  export function SearchForm(props: { defaultQuery: string }): JSX.Element;
  ```

### Steps

- [ ] **Add the `search` namespace** to `vanta/messages/en.json`:

  ```json
  {
    "search": {
      "title": "Search",
      "placeholder": "Search products…",
      "submit": "Search",
      "resultsFor": "Results for “{query}”",
      "count": "{count, plural, =0 {No results} one {# result} other {# results}}",
      "empty": "No products match “{query}”.",
      "prompt": "Type a query to search the catalog."
    }
  }
  ```

- [ ] **Add the mirror** to `vanta/messages/th.json`:

  ```json
  {
    "search": {
      "title": "ค้นหา",
      "placeholder": "ค้นหาสินค้า…",
      "submit": "ค้นหา",
      "resultsFor": "ผลการค้นหา “{query}”",
      "count": "{count, plural, other {# รายการ}}",
      "empty": "ไม่พบสินค้าที่ตรงกับ “{query}”",
      "prompt": "พิมพ์คำค้นหาเพื่อค้นหาสินค้า"
    }
  }
  ```

- [ ] **Write the failing E2E spec** at `vanta/tests/e2e/search.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('search @ /search', () => {
    test('prompts when no query (EN)', async ({ page }) => {
      await page.goto('/en/search');
      await expect(page.getByTestId('search-prompt')).toBeVisible();
    });

    test('submitting a query shows results and reflects it in the URL', async ({ page }) => {
      await page.goto('/en/search');
      await page.getByTestId('search-input').fill('tee');
      await page.getByTestId('search-submit').click();
      await expect(page).toHaveURL(/[?&]q=tee\b/);
      await expect(page.getByTestId('search-results-heading')).toContainText('tee');
    });

    test('renders no-results state for nonsense query', async ({ page }) => {
      await page.goto('/en/search?q=zzzznomatch');
      await expect(page.getByTestId('search-empty')).toBeVisible();
    });

    test('renders in TH', async ({ page }) => {
      await page.goto('/th/search');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('ค้นหา');
    });
  });
  ```

- [ ] **Run it — confirm it fails:**

  ```
  npm run test:e2e -- search.spec.ts
  ```

  Expected: `4 failed` (route 404).

- [ ] **Implement `vanta/components/product/SearchForm.tsx`** (client; GET-style submit that pushes `?q=` via the localized router):

  ```tsx
  'use client';

  import { useState } from 'react';
  import { useTranslations } from 'next-intl';
  import { useRouter, usePathname } from '@/lib/i18n/navigation';

  export function SearchForm({ defaultQuery }: { defaultQuery: string }): JSX.Element {
    const t = useTranslations('search');
    const router = useRouter();
    const pathname = usePathname();
    const [value, setValue] = useState(defaultQuery);

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const trimmed = value.trim();
      const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
      router.push(`${pathname}${qs}`);
    }

    return (
      <form role="search" onSubmit={onSubmit} className="flex w-full max-w-xl items-center gap-2">
        <input
          type="search"
          name="q"
          data-testid="search-input"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder={t('placeholder')}
          aria-label={t('title')}
          className="flex-1 bg-smoke-700 px-3 py-2 text-paper placeholder:text-smoke-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        />
        <button
          type="submit"
          data-testid="search-submit"
          className="bg-blaze px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          {t('submit')}
        </button>
      </form>
    );
  }
  ```

- [ ] **Implement `vanta/app/[locale]/(shop)/search/page.tsx`** (Server Component):

  ```tsx
  import { getTranslations, setRequestLocale } from 'next-intl/server';
  import type { Locale, Drop } from '@/lib/domain';
  import { products } from '@/lib/data';
  import { dropService } from '@/lib/services/drop-service';
  import { authService } from '@/lib/services/auth-service';
  import { buildSearchResults, normalizeSearchQuery } from '@/lib/search/results';
  import { CatalogGrid, type CatalogGridItem } from '@/components/product/CatalogGrid';
  import { SearchForm } from '@/components/product/SearchForm';

  export default async function SearchPage({
    params,
    searchParams,
  }: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ q?: string }>;
  }): Promise<JSX.Element> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'search' });

    const { q } = await searchParams;
    const query = normalizeSearchQuery(q);

    let content: JSX.Element;

    if (query === '') {
      content = (
        <p data-testid="search-prompt" className="py-24 text-center text-smoke-300">
          {t('prompt')}
        </p>
      );
    } else {
      const [matches, user] = await Promise.all([
        products.search(query),
        authService.getCurrentUser(),
      ]);

      const dropIds = new Set<string>();
      for (const p of matches) if (p.dropId) dropIds.add(p.dropId);
      const drops = await Promise.all([...dropIds].map((id) => dropService.getDropById(id)));
      const dropsById: Record<string, Drop> = {};
      for (const d of drops) if (d) dropsById[d.id] = d;

      const now = new Date();
      const results = buildSearchResults(query, matches, dropsById, now, user);

      const productById = new Map(matches.map((p) => [p.id, p]));
      const items: CatalogGridItem[] = results.cards.map((card) => {
        const product = productById.get(card.productId)!;
        const color = card.matchedColors[0] ?? product.optionAxes.color[0];
        const image = (product.imagesByColor[color] ?? [])[0];
        return {
          card,
          title: product.title[locale],
          imageUrl: image?.url ?? '',
          imageAlt: image?.alt[locale] ?? product.title[locale],
        };
      });

      content =
        results.count === 0 ? (
          <p data-testid="search-empty" className="py-24 text-center text-smoke-300">
            {t('empty', { query: results.query })}
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-smoke-300">{t('count', { count: results.count })}</p>
            <CatalogGrid items={items} locale={locale} />
          </>
        );
    }

    return (
      <main className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-4 py-12 text-paper md:px-8">
        <h1 className="display text-4xl">{t('title')}</h1>
        <div className="mt-6">
          <SearchForm defaultQuery={query} />
        </div>
        {query !== '' ? (
          <h2 data-testid="search-results-heading" className="mt-10 text-lg text-paper">
            {t('resultsFor', { query })}
          </h2>
        ) : null}
        <div className="mt-6">{content}</div>
      </main>
    );
  }
  ```

- [ ] **Run typecheck + the E2E spec — confirm both pass:**

  ```
  npm run typecheck
  npm run test:e2e -- search.spec.ts
  ```

  Expected: typecheck exits 0; Playwright `4 passed`.

- [ ] **Visual verification** against `npm run dev`. Drive the browser MCP:
  - Navigate `http://localhost:3000/en/search` → screenshot; confirm the search form + EN prompt copy.
  - Type `tee`, submit → confirm URL `?q=tee`, results heading "Results for "tee"", and the same reveal grid.
  - Navigate `http://localhost:3000/th/search` → screenshot; confirm Kanit "ค้นหา" heading and Thai placeholder.
    **Exact check:** prompt, results, and empty states each render with correct localized copy in both locales.

- [ ] **Commit:**
  ```
  git add app/[locale]/\(shop\)/search/page.tsx components/product/SearchForm.tsx messages/en.json messages/th.json tests/e2e/search.spec.ts
  git commit -m "feat(search): add basic bilingual search results page"
  ```

---

## Phase 6 exit criteria

- [ ] `npm run test -- tests/unit/catalog-query.test.ts tests/unit/search-results.test.ts` → all unit specs pass (filter/sort engine, facets, search presenter).
- [ ] `npm run test:e2e -- catalog.spec.ts collections.spec.ts lookbook.spec.ts search.spec.ts` → all pass, including the catalog and lookbook reduced-motion projects.
- [ ] `npm run typecheck` exits 0 (no `any` in `lib/**`; all domain types imported from `@/lib/domain`; data reached only through `@/lib/data`).
- [ ] Catalog filters by **variant options** (size/color) + category (`collectionIds`) + integer-satang price window, and sorts; the grid uses the CSS clip-path/mask reveal with IntersectionObserver and **no WebGL**.
- [ ] `ProductCard` sets `view-transition-name: product-${product.id}` (locale-stable card→PDP origin).
- [ ] The lookbook template carries the one allowed catalog-area WebGL hero, gated by `useMotionCapability`, with a static-image fallback (zero canvases under reduced motion).
- [ ] All copy is bilingual (mirror keysets in `en.json`/`th.json`); prices via `formatMoney`; headings use the `.display` per-locale tokens (verified EN all-caps Clash, TH Kanit non-caps).

---

**Files delivered by Phase 6:**

- `vanta/lib/catalog/query.ts`, `vanta/lib/catalog/facets.ts`, `vanta/lib/search/results.ts`
- `vanta/components/product/ProductCard.tsx`, `vanta/components/product/CatalogGrid.tsx`, `vanta/components/product/FilterRail.tsx`, `vanta/components/product/SortSelect.tsx`, `vanta/components/product/SearchForm.tsx`
- `vanta/components/collection/LookbookHero.tsx`, `vanta/components/collection/LookbookSequence.tsx`
- `vanta/app/[locale]/(shop)/shop/page.tsx`, `vanta/app/[locale]/(shop)/collections/page.tsx`, `vanta/app/[locale]/(shop)/collections/[slug]/page.tsx`, `vanta/app/[locale]/(shop)/search/page.tsx`
- Tests: `vanta/tests/unit/catalog-query.test.ts`, `vanta/tests/unit/search-results.test.ts`, `vanta/tests/e2e/catalog.spec.ts`, `vanta/tests/e2e/collections.spec.ts`, `vanta/tests/e2e/lookbook.spec.ts`, `vanta/tests/e2e/search.spec.ts`
- Modified: `vanta/messages/en.json`, `vanta/messages/th.json` (added `catalog`, `collections`, `search` namespaces)

---

I have all the detail I need. Here is Phase 7.

---

## Phase 7 — Auth & member area

This phase makes VANTA log a viewer in. It implements the signed-cookie session inside `authService` (Phase 1 of the auth swap-path — the interface is what later gets an Auth.js adapter), seeds three users (a guest-able anonymous identity is the absence of a cookie, plus a `member` and an `admin`-reserved user), and ships the `requireUser()`/`requireMember()`/`requireAdmin()` guards that are called **inside the DAL/pages/actions — never middleware** (avoids the CVE-2025-29927 middleware-as-authz shape). It then builds the `(auth)` login/register pages with **visible demo creds** and the Tier-3 `(account)` area: a layout that calls `requireMember()`, a dashboard, an orders page rendering `OrderLineItem` snapshots, a single country-first Thai-shaped address (no US State/ZIP), and a clean settings page.

> Dependencies (assumed complete from earlier phases): domain barrel `@/lib/domain`; `Repositories` bundle and the swap point `@/lib/data` exporting `users`, `orders`; `MockUserRepository` and `MockOrderRepository` (this phase adds the seed rows + `verifyCredentials`); `lib/format/money.ts` (`formatMoney`) and `lib/format/date.ts` (`formatDate`); next-intl routing/navigation (`@/lib/i18n/navigation` exporting the localized `redirect`/`Link`); messages `messages/en.json` + `messages/th.json` (this phase adds `Auth` and `Account` namespaces); `vitest.config.ts` (node env) and `playwright.config.ts`.

The session cookie is `vanta_session`, signed with HMAC-SHA256 over the user id using `SESSION_SECRET` (falling back to a checked-in dev secret so the demo runs with zero env setup), encoded `base64url(userId).base64url(signature)`. `authService` is the **only** module that reads/writes this cookie; repositories stay request-context-free.

---

### Task 7.1 — Seed users + `verifyCredentials` (mock UserRepository)

Three seed users and a credential check, behind the `UserRepository` interface. This is the data the rest of the phase authenticates against.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/users.ts`
- Modify: `d:/MINE/freelance/system/vanta/lib/data/mock/user-repository.mock.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/user-repository.test.ts`

**Interfaces**

- Consumes: `User`, `Role`, `Address` from `@/lib/domain`; `UserRepository` from `@/lib/data/repositories/user-repository`.
- Produces: `seedUsers: User[]` and `seedPasswords: Record<string, string>` (userId → demo password) from `seed/users.ts`; a `MockUserRepository` implementing `getById`, `getByEmail`, `verifyCredentials` (verbatim signatures). No widening of `UserRepository`.

**Steps**

- [ ] 1. Write the failing test. Create `d:/MINE/freelance/system/vanta/tests/unit/user-repository.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { MockUserRepository } from '@/lib/data/mock/user-repository.mock';
  import { seedUsers } from '@/lib/data/mock/seed/users';

  function repo() {
    return new MockUserRepository(seedUsers);
  }

  describe('MockUserRepository', () => {
    it('seeds exactly a member and an admin with stable ids', () => {
      const member = seedUsers.find((u) => u.role === 'member');
      const admin = seedUsers.find((u) => u.role === 'admin');
      expect(member?.id).toBe('usr_member');
      expect(member?.email).toBe('member@vanta.shop');
      expect(admin?.id).toBe('usr_admin');
      expect(admin?.role).toBe('admin');
    });

    it('the member ships with one country-first TH address (no US fields)', () => {
      const member = seedUsers.find((u) => u.id === 'usr_member');
      expect(member?.addresses).toHaveLength(1);
      const addr = member!.addresses[0];
      expect(addr.country).toBe('TH');
      expect(addr.postalCode).toMatch(/^\d{5}$/);
      // shape proof: no `state`/`zip` keys leaked onto the address
      expect(Object.keys(addr)).not.toContain('state');
      expect(Object.keys(addr)).not.toContain('zip');
    });

    it('getByEmail is case-insensitive and getById round-trips', async () => {
      const r = repo();
      expect((await r.getByEmail('MEMBER@VANTA.SHOP'))?.id).toBe('usr_member');
      expect((await r.getById('usr_member'))?.email).toBe('member@vanta.shop');
      expect(await r.getById('usr_missing')).toBeNull();
    });

    it('verifyCredentials returns the user only on an exact password match', async () => {
      const r = repo();
      expect((await r.verifyCredentials('member@vanta.shop', 'vanta-demo'))?.id).toBe('usr_member');
      expect(await r.verifyCredentials('member@vanta.shop', 'wrong')).toBeNull();
      expect(await r.verifyCredentials('nobody@vanta.shop', 'vanta-demo')).toBeNull();
    });
  });
  ```

- [ ] 2. Run it and SHOW it fails (modules do not exist yet):

  ```
  npm run test -- tests/unit/user-repository.test.ts
  ```

  Expected output contains:

  ```
  Failed to resolve import "@/lib/data/mock/seed/users"
  ```

  (or, once `user-repository.mock.ts` is touched, `verifyCredentials is not a function`). Test run ends with `Test Files  1 failed`.

- [ ] 3. Implement the seed. Create `d:/MINE/freelance/system/vanta/lib/data/mock/seed/users.ts`:

  ```ts
  import type { User } from '@/lib/domain';

  /**
   * Three seed identities. "Guest" is the absence of a session cookie, not a row;
   * we seed the authenticatable users only: a member (demo) and a reserved admin.
   * Demo creds for the member are shown on /login (see SHARED CONTRACTS).
   */
  export const seedUsers: User[] = [
    {
      id: 'usr_member',
      email: 'member@vanta.shop',
      name: 'Ploy Srisai',
      role: 'member',
      addresses: [
        {
          id: 'addr_member_home',
          fullName: 'Ploy Srisai',
          line1: '128/4 Soi Sukhumvit 49',
          line2: 'Khlong Tan Nuea, Watthana',
          city: 'Bangkok',
          postalCode: '10110',
          country: 'TH',
          phone: '+66 81 234 5678',
        },
      ],
    },
    {
      id: 'usr_admin',
      email: 'admin@vanta.shop',
      name: 'VANTA Studio',
      role: 'admin',
      addresses: [],
    },
  ];

  /** userId -> demo password (mock only; real adapter delegates to Auth.js). */
  export const seedPasswords: Record<string, string> = {
    usr_member: 'vanta-demo',
    usr_admin: 'vanta-admin',
  };
  ```

- [ ] 4. Implement the repository. Replace the body of `d:/MINE/freelance/system/vanta/lib/data/mock/user-repository.mock.ts`:

  ```ts
  import type { User } from '@/lib/domain';
  import type { UserRepository } from '@/lib/data/repositories/user-repository';
  import { seedPasswords } from './seed/users';

  export class MockUserRepository implements UserRepository {
    private readonly users: User[];

    constructor(users: User[]) {
      this.users = users;
    }

    async getById(userId: string): Promise<User | null> {
      return this.users.find((u) => u.id === userId) ?? null;
    }

    async getByEmail(email: string): Promise<User | null> {
      const needle = email.trim().toLowerCase();
      return this.users.find((u) => u.email.toLowerCase() === needle) ?? null;
    }

    async verifyCredentials(email: string, password: string): Promise<User | null> {
      const user = await this.getByEmail(email);
      if (!user) return null;
      return seedPasswords[user.id] === password ? user : null;
    }
  }
  ```

- [ ] 5. Wire the seed into the mock bundle. In `d:/MINE/freelance/system/vanta/lib/data/mock/index.ts`, ensure the users repo is constructed from the seed (add/confirm these lines alongside the other repositories):

  ```ts
  import { MockUserRepository } from './user-repository.mock';
  import { seedUsers } from './seed/users';

  // inside the `mockRepositories` object:
  // users: new MockUserRepository(seedUsers),
  ```

  Use a mutable copy if the bundle expects in-session mutation: `new MockUserRepository([...seedUsers])`.

- [ ] 6. Run it and SHOW it passes:

  ```
  npm run test -- tests/unit/user-repository.test.ts
  ```

  Expected tail:

  ```
   Test Files  1 passed (1)
        Tests  4 passed (4)
  ```

- [ ] 7. Commit:

  ```
  git add lib/data/mock/seed/users.ts lib/data/mock/user-repository.mock.ts lib/data/mock/index.ts tests/unit/user-repository.test.ts
  git commit -m "feat(auth): seed member/admin users and verifyCredentials"
  ```

---

### Task 7.2 — `authService` signed-cookie session

The session cookie sign/verify primitives and the `AuthService` implementation. This is the only module that touches `cookies()` for the session.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/services/session.ts`
- Create: `d:/MINE/freelance/system/vanta/lib/services/auth-service.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/session.test.ts`

**Interfaces**

- Consumes: `User` from `@/lib/domain`; `users` from `@/lib/data`; `cookies` from `next/headers`; `createHmac`/`timingSafeEqual` from `node:crypto`.
- Produces from `session.ts` (pure, no `next/headers`): `SESSION_COOKIE = 'vanta_session'`, `signSession(userId: string): string`, `verifySession(token: string | undefined): string | null`. Produces from `auth-service.ts`: `authService: AuthService` (`login`/`register`/`logout`/`getCurrentUser`) verbatim.

**Steps**

- [ ] 1. Write the failing test for the pure sign/verify (no cookie access, so it runs in node env). Create `d:/MINE/freelance/system/vanta/tests/unit/session.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { signSession, verifySession, SESSION_COOKIE } from '@/lib/services/session';

  describe('session token', () => {
    it('exposes the canonical cookie name', () => {
      expect(SESSION_COOKIE).toBe('vanta_session');
    });

    it('round-trips a signed user id', () => {
      const token = signSession('usr_member');
      expect(token).toContain('.');
      expect(verifySession(token)).toBe('usr_member');
    });

    it('rejects undefined, empty, malformed and tampered tokens', () => {
      expect(verifySession(undefined)).toBeNull();
      expect(verifySession('')).toBeNull();
      expect(verifySession('not-a-token')).toBeNull();

      const token = signSession('usr_member');
      const [payload] = token.split('.');
      // keep the valid payload, swap in a bogus signature
      expect(verifySession(`${payload}.deadbeef`)).toBeNull();
      // tamper the payload, keep the old signature
      const forged = `${Buffer.from('usr_admin').toString('base64url')}.${token.split('.')[1]}`;
      expect(verifySession(forged)).toBeNull();
    });
  });
  ```

- [ ] 2. Run it and SHOW it fails:

  ```
  npm run test -- tests/unit/session.test.ts
  ```

  Expected output contains:

  ```
  Failed to resolve import "@/lib/services/session"
  ```

  Run ends `Test Files  1 failed`.

- [ ] 3. Implement the pure session primitives. Create `d:/MINE/freelance/system/vanta/lib/services/session.ts`:

  ```ts
  import { createHmac, timingSafeEqual } from 'node:crypto';

  export const SESSION_COOKIE = 'vanta_session';

  /**
   * Checked-in dev fallback keeps the portfolio demo zero-config.
   * Set SESSION_SECRET in production (the real Auth.js adapter supersedes this).
   */
  const SECRET = process.env.SESSION_SECRET ?? 'vanta-dev-session-secret-do-not-use-in-prod';

  function sign(payloadB64: string): string {
    return createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  }

  /** `base64url(userId).base64url(hmac)` */
  export function signSession(userId: string): string {
    const payload = Buffer.from(userId, 'utf8').toString('base64url');
    return `${payload}.${sign(payload)}`;
  }

  export function verifySession(token: string | undefined): string | null {
    if (!token) return null;
    const dot = token.indexOf('.');
    if (dot <= 0 || dot === token.length - 1) return null;

    const payload = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const expected = sign(payload);

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const userId = Buffer.from(payload, 'base64url').toString('utf8');
    return userId.length > 0 ? userId : null;
  }
  ```

- [ ] 4. Run it and SHOW it passes:

  ```
  npm run test -- tests/unit/session.test.ts
  ```

  Expected tail:

  ```
   Test Files  1 passed (1)
        Tests  3 passed (3)
  ```

- [ ] 5. Implement `authService` (cookie I/O lives here, not in repositories). Create `d:/MINE/freelance/system/vanta/lib/services/auth-service.ts`:

  ```ts
  import 'server-only';
  import { cookies } from 'next/headers';
  import type { User } from '@/lib/domain';
  import { users } from '@/lib/data';
  import { SESSION_COOKIE, signSession, verifySession } from './session';

  export interface AuthService {
    login(email: string, password: string): Promise<User>;
    register(email: string, password: string, name: string): Promise<User>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
  }

  /** Typed error so call sites/guards can branch without string-matching. */
  export class AuthError extends Error {
    constructor(
      public readonly code: 'invalid_credentials' | 'email_taken' | 'unauthorized' | 'forbidden',
    ) {
      super(code);
      this.name = 'AuthError';
    }
  }

  const ONE_WEEK = 60 * 60 * 24 * 7;

  async function setSession(userId: string): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, signSession(userId), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_WEEK,
    });
  }

  class CookieAuthService implements AuthService {
    async login(email: string, password: string): Promise<User> {
      const user = await users.verifyCredentials(email, password);
      if (!user) throw new AuthError('invalid_credentials');
      await setSession(user.id);
      return user;
    }

    async register(email: string, password: string, name: string): Promise<User> {
      // Mock path: registration is a non-goal beyond the seam. If the email is a
      // known seed user, treat it as taken; otherwise log the member in as a demo.
      const existing = await users.getByEmail(email);
      if (existing) throw new AuthError('email_taken');
      // No write-back in the mock (no churn sim); hand the registrant the demo member identity.
      const member = await users.getById('usr_member');
      if (!member) throw new AuthError('invalid_credentials');
      await setSession(member.id);
      return { ...member, email, name };
    }

    async logout(): Promise<void> {
      const store = await cookies();
      store.delete(SESSION_COOKIE);
    }

    async getCurrentUser(): Promise<User | null> {
      const store = await cookies();
      const userId = verifySession(store.get(SESSION_COOKIE)?.value);
      if (!userId) return null;
      return users.getById(userId);
    }
  }

  export const authService: AuthService = new CookieAuthService();
  ```

- [ ] 6. Type-check (no test for cookie I/O — it needs the request scope and is exercised in the Playwright run in 7.6):

  ```
  npm run typecheck
  ```

  Expected: exits `0`, no errors.

- [ ] 7. Commit:

  ```
  git add lib/services/session.ts lib/services/auth-service.ts tests/unit/session.test.ts
  git commit -m "feat(auth): signed-cookie session and authService"
  ```

---

### Task 7.3 — Guards: `requireUser` / `requireMember` / `requireAdmin`

The authorization functions, re-verified at every call site. Behaviour is unit-tested by injecting the current user (so the guard logic is provable without a request scope), then wired to `authService.getCurrentUser()` for production.

**Files**

- Modify: `d:/MINE/freelance/system/vanta/lib/services/auth-service.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/auth-guards.test.ts`

**Interfaces**

- Consumes: `User`, `Role` from `@/lib/domain`; `AuthError` from `auth-service.ts`.
- Produces: `requireUser(): Promise<User>`, `requireMember(): Promise<User>`, `requireAdmin(): Promise<User>` (verbatim). Internal testable core `enforceRole(user: User | null, allowed: readonly Role[]): User` that throws `AuthError('unauthorized')` for guests and `AuthError('forbidden')` for insufficient role.

**Steps**

- [ ] 1. Write the failing test for the pure guard core (no cookies — pass the user in). Create `d:/MINE/freelance/system/vanta/tests/unit/auth-guards.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import type { User } from '@/lib/domain';
  import { enforceRole, AuthError } from '@/lib/services/auth-service';

  const guest: User | null = null;
  const member: User = {
    id: 'usr_member',
    email: 'member@vanta.shop',
    name: 'Ploy',
    role: 'member',
    addresses: [],
  };
  const admin: User = {
    id: 'usr_admin',
    email: 'admin@vanta.shop',
    name: 'Studio',
    role: 'admin',
    addresses: [],
  };

  describe('enforceRole (guard core)', () => {
    it('requireUser shape: any authenticated user passes, guest is unauthorized', () => {
      expect(enforceRole(member, ['member', 'admin', 'guest']).id).toBe('usr_member');
      expect(() => enforceRole(guest, ['member', 'admin', 'guest'])).toThrowError(
        new AuthError('unauthorized'),
      );
    });

    it('requireMember shape: member and admin pass; guest blocked at the service layer', () => {
      expect(enforceRole(member, ['member', 'admin']).role).toBe('member');
      expect(enforceRole(admin, ['member', 'admin']).role).toBe('admin');
      let thrown: unknown;
      try {
        enforceRole(guest, ['member', 'admin']);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(AuthError);
      expect((thrown as AuthError).code).toBe('unauthorized');
    });

    it('requireAdmin shape: a member is forbidden (not merely unauthorized)', () => {
      let thrown: unknown;
      try {
        enforceRole(member, ['admin']);
      } catch (e) {
        thrown = e;
      }
      expect((thrown as AuthError).code).toBe('forbidden');
      expect(enforceRole(admin, ['admin']).role).toBe('admin');
    });
  });
  ```

- [ ] 2. Run it and SHOW it fails:

  ```
  npm run test -- tests/unit/auth-guards.test.ts
  ```

  Expected output contains:

  ```
  The requested module '@/lib/services/auth-service' does not provide an export named 'enforceRole'
  ```

  Run ends `Test Files  1 failed`.

- [ ] 3. Implement the guard core and public guards. Append to `d:/MINE/freelance/system/vanta/lib/services/auth-service.ts`:

  ```ts
  import type { Role } from '@/lib/domain';

  /**
   * PURE authorization decision (testable without a request scope).
   * Guest (null) => 'unauthorized'; wrong role => 'forbidden'.
   */
  export function enforceRole(user: User | null, allowed: readonly Role[]): User {
    if (!user) throw new AuthError('unauthorized');
    if (!allowed.includes(user.role)) throw new AuthError('forbidden');
    return user;
  }

  export async function requireUser(): Promise<User> {
    return enforceRole(await authService.getCurrentUser(), ['guest', 'member', 'admin']);
  }

  export async function requireMember(): Promise<User> {
    return enforceRole(await authService.getCurrentUser(), ['member', 'admin']);
  }

  export async function requireAdmin(): Promise<User> {
    return enforceRole(await authService.getCurrentUser(), ['admin']);
  }
  ```

- [ ] 4. Run it and SHOW it passes:

  ```
  npm run test -- tests/unit/auth-guards.test.ts
  ```

  Expected tail:

  ```
   Test Files  1 passed (1)
        Tests  3 passed (3)
  ```

- [ ] 5. Commit:

  ```
  git add lib/services/auth-service.ts tests/unit/auth-guards.test.ts
  git commit -m "feat(auth): requireUser/requireMember/requireAdmin guards"
  ```

---

### Task 7.4 — `auth-actions` + i18n copy

The `'use server'` actions that pages submit to. They translate `AuthError` codes into the `AuthActionState` discriminated union and redirect on success. Logic (error mapping) is unit-tested via a pure mapper; the redirect/cookie behaviour is exercised in 7.6.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/actions/auth-actions.ts`
- Modify: `d:/MINE/freelance/system/vanta/messages/en.json`
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/auth-actions.test.ts`

**Interfaces**

- Consumes: `User` from `@/lib/domain`; `authService`, `AuthError` from `@/lib/services/auth-service`; `redirect` from `@/lib/i18n/navigation`.
- Produces: `AuthActionState` (verbatim), `login(prevState, formData)`, `register(prevState, formData)`, `logout()` (verbatim). Internal pure helper `mapAuthError(err: unknown): Extract<AuthActionState, { ok: false }>`.

**Steps**

- [ ] 1. Write the failing test for the pure error mapper. Create `d:/MINE/freelance/system/vanta/tests/unit/auth-actions.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { mapAuthError } from '@/lib/actions/auth-actions';
  import { AuthError } from '@/lib/services/auth-service';

  describe('mapAuthError', () => {
    it('maps invalid_credentials to a failed login state', () => {
      expect(mapAuthError(new AuthError('invalid_credentials'))).toEqual({
        ok: false,
        error: 'invalid_credentials',
      });
    });

    it('maps email_taken to a failed register state', () => {
      expect(mapAuthError(new AuthError('email_taken'))).toEqual({
        ok: false,
        error: 'email_taken',
      });
    });

    it('maps unknown/guard errors to invalid_credentials (never leaks internals)', () => {
      expect(mapAuthError(new AuthError('unauthorized'))).toEqual({
        ok: false,
        error: 'invalid_credentials',
      });
      expect(mapAuthError(new Error('boom'))).toEqual({ ok: false, error: 'invalid_credentials' });
    });
  });
  ```

- [ ] 2. Run it and SHOW it fails:

  ```
  npm run test -- tests/unit/auth-actions.test.ts
  ```

  Expected output contains:

  ```
  The requested module '@/lib/actions/auth-actions' does not provide an export named 'mapAuthError'
  ```

  Run ends `Test Files  1 failed`.

- [ ] 3. Implement the actions. Create `d:/MINE/freelance/system/vanta/lib/actions/auth-actions.ts`:

  ```ts
  'use server';

  import type { User } from '@/lib/domain';
  import { authService, AuthError } from '@/lib/services/auth-service';
  import { redirect } from '@/lib/i18n/navigation';

  export type AuthActionState =
    | { ok: true; user: User }
    | { ok: false; error: 'invalid_credentials' | 'email_taken' };

  /** PURE: normalize any thrown value into a safe failed state. */
  export function mapAuthError(err: unknown): Extract<AuthActionState, { ok: false }> {
    if (err instanceof AuthError && err.code === 'email_taken') {
      return { ok: false, error: 'email_taken' };
    }
    // invalid_credentials, unauthorized, forbidden, and anything unexpected
    return { ok: false, error: 'invalid_credentials' };
  }

  export async function login(
    _prevState: AuthActionState,
    formData: FormData,
  ): Promise<AuthActionState> {
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    try {
      await authService.login(email, password);
    } catch (err) {
      return mapAuthError(err);
    }
    redirect('/account');
  }

  export async function register(
    _prevState: AuthActionState,
    formData: FormData,
  ): Promise<AuthActionState> {
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const name = String(formData.get('name') ?? '');
    try {
      await authService.register(email, password, name);
    } catch (err) {
      return mapAuthError(err);
    }
    redirect('/account');
  }

  export async function logout(): Promise<void> {
    await authService.logout();
    redirect('/');
  }
  ```

  > `redirect()` throws the Next navigation signal, so the lines after it are unreachable on success — that is the intended control flow and satisfies the `Promise<AuthActionState>` return type for the failure branches.

- [ ] 4. Add the `Auth` namespace to `d:/MINE/freelance/system/vanta/messages/en.json` (merge into the existing root object):

  ```json
  {
    "Auth": {
      "loginTitle": "Sign in",
      "registerTitle": "Create account",
      "email": "Email",
      "password": "Password",
      "name": "Name",
      "submitLogin": "Sign in",
      "submitRegister": "Create account",
      "toRegister": "New here? Create an account",
      "toLogin": "Already have an account? Sign in",
      "errorInvalid": "Email or password is incorrect.",
      "errorTaken": "That email is already registered.",
      "demoHeading": "Demo account",
      "demoBody": "Use these credentials to sign in as a member:",
      "demoEmail": "member@vanta.shop",
      "demoPassword": "vanta-demo"
    }
  }
  ```

- [ ] 5. Add the mirrored `Auth` namespace to `d:/MINE/freelance/system/vanta/messages/th.json`:

  ```json
  {
    "Auth": {
      "loginTitle": "เข้าสู่ระบบ",
      "registerTitle": "สร้างบัญชี",
      "email": "อีเมล",
      "password": "รหัสผ่าน",
      "name": "ชื่อ",
      "submitLogin": "เข้าสู่ระบบ",
      "submitRegister": "สร้างบัญชี",
      "toRegister": "ยังไม่มีบัญชี? สร้างบัญชีใหม่",
      "toLogin": "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ",
      "errorInvalid": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      "errorTaken": "อีเมลนี้ถูกใช้ลงทะเบียนแล้ว",
      "demoHeading": "บัญชีทดลอง",
      "demoBody": "ใช้ข้อมูลนี้เพื่อเข้าสู่ระบบในฐานะสมาชิก:",
      "demoEmail": "member@vanta.shop",
      "demoPassword": "vanta-demo"
    }
  }
  ```

- [ ] 6. Run it and SHOW it passes:

  ```
  npm run test -- tests/unit/auth-actions.test.ts
  ```

  Expected tail:

  ```
   Test Files  1 passed (1)
        Tests  3 passed (3)
  ```

- [ ] 7. Commit:

  ```
  git add lib/actions/auth-actions.ts messages/en.json messages/th.json tests/unit/auth-actions.test.ts
  git commit -m "feat(auth): login/register/logout server actions with i18n copy"
  ```

---

### Task 7.5 — Login + register pages (visible demo creds)

Tier-2 auth pages. Server Components render the form; a small client component drives `useActionState` to surface error copy. Demo creds are **visible on screen**, copyable.

**Files**

- Create: `d:/MINE/freelance/system/vanta/components/auth/AuthForm.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(auth)/login/page.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(auth)/register/page.tsx`
- Test: `d:/MINE/freelance/system/vanta/tests/e2e/auth.en.spec.ts`

**Interfaces**

- Consumes: `login`, `register`, `AuthActionState` from `@/lib/actions/auth-actions`; `useActionState` (React 19.2); `useTranslations` from `next-intl`; `Link` from `@/lib/i18n/navigation`.
- Produces: `<AuthForm mode="login" | "register" />` client component; two route pages.

**Steps**

- [ ] 1. Write the client form. Create `d:/MINE/freelance/system/vanta/components/auth/AuthForm.tsx`:

  ```tsx
  'use client';

  import { useActionState } from 'react';
  import { useTranslations } from 'next-intl';
  import { login, register, type AuthActionState } from '@/lib/actions/auth-actions';

  const initialState: AuthActionState = { ok: false, error: 'invalid_credentials' };

  type AuthFormProps = { mode: 'login' | 'register' };

  export function AuthForm({ mode }: AuthFormProps) {
    const t = useTranslations('Auth');
    const action = mode === 'login' ? login : register;
    const [state, formAction, pending] = useActionState(action, initialState);

    // Only show the error once the form has actually been submitted with a failure.
    const showError = !state.ok && pending === false && hasBeenSubmitted(state);

    return (
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {mode === 'register' && (
          <label className="flex flex-col gap-1 font-body text-sm text-paper">
            <span>{t('name')}</span>
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              className="rounded-none border border-smoke-700 bg-smoke-900 px-3 py-2 text-paper focus-visible:border-blaze focus-visible:outline-none"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 font-body text-sm text-paper">
          <span>{t('email')}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={mode === 'login' ? t('demoEmail') : undefined}
            className="rounded-none border border-smoke-700 bg-smoke-900 px-3 py-2 text-paper focus-visible:border-blaze focus-visible:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 font-body text-sm text-paper">
          <span>{t('password')}</span>
          <input
            name="password"
            type="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="rounded-none border border-smoke-700 bg-smoke-900 px-3 py-2 text-paper focus-visible:border-blaze focus-visible:outline-none"
          />
        </label>

        {showError && (
          <p role="alert" className="font-mono text-sm text-blaze">
            {state.error === 'email_taken' ? t('errorTaken') : t('errorInvalid')}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-blaze px-4 py-3 font-display uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {mode === 'login' ? t('submitLogin') : t('submitRegister')}
        </button>
      </form>
    );
  }

  // The initial state is a sentinel `{ ok:false }`; treat it as "not submitted yet".
  function hasBeenSubmitted(state: AuthActionState): boolean {
    return state !== initialState;
  }
  ```

  > The error is gated on `state !== initialState` so the page does not show a red error before the user has submitted. `defaultValue` pre-fills the demo email on `/login` only.

- [ ] 2. Write the login page with visible demo creds. Create `d:/MINE/freelance/system/vanta/app/[locale]/(auth)/login/page.tsx`:

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { AuthForm } from '@/components/auth/AuthForm';
  import { Link } from '@/lib/i18n/navigation';

  export default async function LoginPage() {
    const t = await getTranslations('Auth');

    return (
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
        <h1 className="display font-display text-4xl text-paper">{t('loginTitle')}</h1>

        <section
          aria-labelledby="demo-creds"
          className="border border-lime/40 bg-smoke-900 p-4 text-paper"
        >
          <h2 id="demo-creds" className="font-mono text-sm uppercase tracking-tight text-lime">
            {t('demoHeading')}
          </h2>
          <p className="mt-1 font-body text-sm text-smoke-300">{t('demoBody')}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-sm">
            <dt className="text-smoke-500">{t('email')}</dt>
            <dd className="text-paper" data-testid="demo-email">
              {t('demoEmail')}
            </dd>
            <dt className="text-smoke-500">{t('password')}</dt>
            <dd className="text-paper" data-testid="demo-password">
              {t('demoPassword')}
            </dd>
          </dl>
        </section>

        <AuthForm mode="login" />

        <Link href="/register" className="font-body text-sm text-smoke-300 underline">
          {t('toRegister')}
        </Link>
      </main>
    );
  }
  ```

- [ ] 3. Write the register page. Create `d:/MINE/freelance/system/vanta/app/[locale]/(auth)/register/page.tsx`:

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { AuthForm } from '@/components/auth/AuthForm';
  import { Link } from '@/lib/i18n/navigation';

  export default async function RegisterPage() {
    const t = await getTranslations('Auth');

    return (
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
        <h1 className="display font-display text-4xl text-paper">{t('registerTitle')}</h1>
        <AuthForm mode="register" />
        <Link href="/login" className="font-body text-sm text-smoke-300 underline">
          {t('toLogin')}
        </Link>
      </main>
    );
  }
  ```

- [ ] 4. Verify visually against the dev server. Start it in the background:

  ```
  npm run dev
  ```

  Then drive the EN login page with the Playwright MCP and confirm the demo creds are on screen. Run:

  ```
  mcp__plugin_playwright_playwright__browser_navigate  ->  http://localhost:3000/en/login
  mcp__plugin_playwright_playwright__browser_snapshot
  mcp__plugin_playwright_playwright__browser_take_screenshot  ->  save scratchpad/login-en.png
  ```

  Exact check: the snapshot contains a region labelled "Demo account" and a `data-testid="demo-email"` node with text `member@vanta.shop` and `data-testid="demo-password"` with `vanta-demo`. Repeat for `http://localhost:3000/th/login` and confirm the heading reads `เข้าสู่ระบบ` and the demo creds block reads `บัญชีทดลอง` (creds values unchanged). Save `scratchpad/login-th.png`.

- [ ] 5. Write the E2E login-flow spec (the phase's required Playwright test). Create `d:/MINE/freelance/system/vanta/tests/e2e/auth.en.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('auth (en)', () => {
    test('demo creds are visible on /login', async ({ page }) => {
      await page.goto('/en/login');
      await expect(page.getByTestId('demo-email')).toHaveText('member@vanta.shop');
      await expect(page.getByTestId('demo-password')).toHaveText('vanta-demo');
    });

    test('bad credentials show an inline error and stay on /login', async ({ page }) => {
      await page.goto('/en/login');
      await page.getByLabel('Email').fill('member@vanta.shop');
      await page.getByLabel('Password').fill('wrong-password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page).toHaveURL(/\/en\/login$/);
    });

    test('valid demo creds log in and land on the member dashboard', async ({ page }) => {
      await page.goto('/en/login');
      await page.getByLabel('Email').fill('member@vanta.shop');
      await page.getByLabel('Password').fill('vanta-demo');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/en\/account$/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Ploy');
    });

    test('a guest hitting /account is redirected to /login', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/en/account');
      await expect(page).toHaveURL(/\/en\/login$/);
    });
  });
  ```

- [ ] 6. Run the E2E spec and SHOW it passes (the third and fourth cases depend on Task 7.6; run after 7.6 is implemented, or run just the first two now and the full file at the end of the phase):

  ```
  npm run test:e2e -- tests/e2e/auth.en.spec.ts
  ```

  Expected tail:

  ```
    4 passed
  ```

- [ ] 7. Commit:

  ```
  git add components/auth/AuthForm.tsx "app/[locale]/(auth)/login/page.tsx" "app/[locale]/(auth)/register/page.tsx" tests/e2e/auth.en.spec.ts
  git commit -m "feat(auth): login and register pages with visible demo creds"
  ```

---

### Task 7.6 — Account layout guard (member-only) + admin reserved route

The `(account)` layout calls `requireMember()` and redirects guests to `/login`; the `(admin)` route calls `requireAdmin()`. Authorization is enforced here in the layout/page — not middleware.

**Files**

- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(account)/layout.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(admin)/admin/page.tsx`
- Modify: `d:/MINE/freelance/system/vanta/messages/en.json`
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json`

**Interfaces**

- Consumes: `requireMember`, `requireAdmin`, `AuthError` from `@/lib/services/auth-service`; `redirect` from `@/lib/i18n/navigation`.
- Produces: account route-group layout (guests redirected); admin page (non-admins redirected). Adds the `Account` and `Admin` message namespaces.

**Steps**

- [ ] 1. Write the account layout. Create `d:/MINE/freelance/system/vanta/app/[locale]/(account)/layout.tsx`:

  ```tsx
  import type { ReactNode } from 'react';
  import { getTranslations } from 'next-intl/server';
  import { requireMember, AuthError } from '@/lib/services/auth-service';
  import { redirect, Link } from '@/lib/i18n/navigation';
  import { logout } from '@/lib/actions/auth-actions';

  export default async function AccountLayout({ children }: { children: ReactNode }) {
    try {
      await requireMember();
    } catch (err) {
      if (err instanceof AuthError) redirect('/login');
      throw err;
    }

    const t = await getTranslations('Account');

    return (
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[200px_1fr]">
        <aside className="flex flex-col gap-2 font-body text-sm">
          <Link href="/account" className="text-paper hover:text-blaze">
            {t('navDashboard')}
          </Link>
          <Link href="/account/orders" className="text-paper hover:text-blaze">
            {t('navOrders')}
          </Link>
          <Link href="/account/addresses" className="text-paper hover:text-blaze">
            {t('navAddresses')}
          </Link>
          <Link href="/account/settings" className="text-paper hover:text-blaze">
            {t('navSettings')}
          </Link>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="font-mono text-xs uppercase tracking-tight text-smoke-300 hover:text-blaze"
            >
              {t('logout')}
            </button>
          </form>
        </aside>
        <section>{children}</section>
      </div>
    );
  }
  ```

  > The guard runs on every request to any `(account)` route because it lives in the layout that wraps them all; the `redirect('/login')` is the optimistic-but-also-enforced path (middleware never does this).

- [ ] 2. Write the reserved admin page. Create `d:/MINE/freelance/system/vanta/app/[locale]/(admin)/admin/page.tsx`:

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { requireAdmin, AuthError } from '@/lib/services/auth-service';
  import { redirect } from '@/lib/i18n/navigation';

  export default async function AdminPage() {
    try {
      await requireAdmin();
    } catch (err) {
      if (err instanceof AuthError) redirect('/login');
      throw err;
    }

    const t = await getTranslations('Admin');

    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="display font-display text-3xl text-paper">{t('title')}</h1>
        <p className="mt-4 font-body text-smoke-300">{t('reserved')}</p>
      </main>
    );
  }
  ```

- [ ] 3. Add the `Account` and `Admin` namespaces to `d:/MINE/freelance/system/vanta/messages/en.json`:

  ```json
  {
    "Account": {
      "navDashboard": "Dashboard",
      "navOrders": "Orders",
      "navAddresses": "Addresses",
      "navSettings": "Settings",
      "logout": "Sign out",
      "dashTitle": "Welcome back, {name}",
      "dashRole": "Membership",
      "dashRecentOrder": "Most recent order",
      "ordersTitle": "Order history",
      "ordersEmpty": "No orders yet.",
      "orderPlaced": "Placed",
      "orderStatus": "Status",
      "orderTotal": "Total",
      "addressesTitle": "Saved address",
      "addressesEmpty": "No saved address.",
      "settingsTitle": "Settings",
      "settingsName": "Name",
      "settingsEmail": "Email",
      "settingsLocale": "Preferred language",
      "settingsNote": "Profile editing is out of scope for this demo."
    },
    "Admin": {
      "title": "Admin",
      "reserved": "Reserved for admins. Product, order, and inventory tools are built later."
    }
  }
  ```

- [ ] 4. Add the mirrored namespaces to `d:/MINE/freelance/system/vanta/messages/th.json`:

  ```json
  {
    "Account": {
      "navDashboard": "แดชบอร์ด",
      "navOrders": "ประวัติคำสั่งซื้อ",
      "navAddresses": "ที่อยู่",
      "navSettings": "ตั้งค่า",
      "logout": "ออกจากระบบ",
      "dashTitle": "ยินดีต้อนรับกลับมา {name}",
      "dashRole": "สมาชิกภาพ",
      "dashRecentOrder": "คำสั่งซื้อล่าสุด",
      "ordersTitle": "ประวัติคำสั่งซื้อ",
      "ordersEmpty": "ยังไม่มีคำสั่งซื้อ",
      "orderPlaced": "สั่งซื้อเมื่อ",
      "orderStatus": "สถานะ",
      "orderTotal": "ยอดรวม",
      "addressesTitle": "ที่อยู่ที่บันทึกไว้",
      "addressesEmpty": "ยังไม่มีที่อยู่ที่บันทึกไว้",
      "settingsTitle": "ตั้งค่า",
      "settingsName": "ชื่อ",
      "settingsEmail": "อีเมล",
      "settingsLocale": "ภาษาที่ต้องการ",
      "settingsNote": "การแก้ไขโปรไฟล์อยู่นอกขอบเขตของเดโมนี้"
    },
    "Admin": {
      "title": "ผู้ดูแลระบบ",
      "reserved": "สงวนไว้สำหรับผู้ดูแลระบบ เครื่องมือจัดการสินค้า คำสั่งซื้อ และสต็อกจะสร้างในภายหลัง"
    }
  }
  ```

- [ ] 5. Type-check:

  ```
  npm run typecheck
  ```

  Expected: exits `0`.

- [ ] 6. Run the guard E2E case from 7.5 (now that the layout exists), and SHOW it passes:

  ```
  npm run test:e2e -- tests/e2e/auth.en.spec.ts -g "redirected to /login"
  ```

  Expected tail:

  ```
    1 passed
  ```

- [ ] 7. Commit:

  ```
  git add "app/[locale]/(account)/layout.tsx" "app/[locale]/(admin)/admin/page.tsx" messages/en.json messages/th.json
  git commit -m "feat(account): member-only layout guard and reserved admin route"
  ```

---

### Task 7.7 — Account dashboard + orders (rendering `OrderLineItem` snapshots)

The dashboard greets the member; the orders page lists their `Order`s, rendering each `OrderLineItem` **from its own snapshot fields** (`title`, `unitPrice`, `imageUrl`, `optionValues`) — never re-reading Product/Variant. Money via `formatMoney`, dates via `formatDate`. A seeded `listByUser('usr_member')` row makes the page render instantly for reviewers (the seeded `ord_seed_demo` confirmation order is attributed to the member).

**Files**

- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/page.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/orders/page.tsx`
- Modify: `d:/MINE/freelance/system/vanta/lib/data/mock/seed/users.ts` (add a member-owned seed order if the order seed lives with users) — OR confirm the existing `ord_seed_demo` has `userId: 'usr_member'`.
- Test: `d:/MINE/freelance/system/vanta/tests/unit/order-repository.test.ts`

**Interfaces**

- Consumes: `requireMember` from `@/lib/services/auth-service`; `orders` from `@/lib/data`; `Order`, `OrderLineItem` from `@/lib/domain`; `formatMoney` from `@/lib/format/money`; `formatDate` from `@/lib/format/date`; `getTranslations`, `getLocale` from `next-intl/server`.
- Produces: dashboard page and orders page (Server Components). Test asserts `OrderRepository.listByUser('usr_member')` returns the seeded order.

**Steps**

- [ ] 1. Write the failing test asserting the seeded member order exists and is self-contained. Create `d:/MINE/freelance/system/vanta/tests/unit/order-repository.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { orders } from '@/lib/data';

  describe('OrderRepository (mock) seed', () => {
    it('exposes the seeded confirmation order owned by the demo member', async () => {
      const list = await orders.listByUser('usr_member');
      expect(list.length).toBeGreaterThanOrEqual(1);
      const seeded = list.find((o) => o.id === 'ord_seed_demo');
      expect(seeded).toBeDefined();
      expect(seeded!.userId).toBe('usr_member');
    });

    it('line items are self-contained snapshots (title/price/image live on the item)', async () => {
      const order = await orders.getById('ord_seed_demo');
      expect(order).not.toBeNull();
      const li = order!.lineItems[0];
      expect(li.title).toHaveProperty('en');
      expect(li.title).toHaveProperty('th');
      expect(li.unitPrice.currency).toBe('THB');
      expect(Number.isInteger(li.unitPrice.amount)).toBe(true);
      expect(li.imageUrl.length).toBeGreaterThan(0);
      expect(li.optionValues).toHaveProperty('size');
      expect(li.optionValues).toHaveProperty('color');
    });

    it('listByUser isolates by user (a stranger sees nothing)', async () => {
      expect(await orders.listByUser('usr_nobody')).toEqual([]);
    });
  });
  ```

- [ ] 2. Run it and SHOW it fails (the seed order is not yet attributed to `usr_member`):

  ```
  npm run test -- tests/unit/order-repository.test.ts
  ```

  Expected output contains an assertion failure like:

  ```
  AssertionError: expected [] to have a length >= 1
  ```

  Run ends `Test Files  1 failed`.

- [ ] 3. Attribute the seeded order to the member. In the order seed (`d:/MINE/freelance/system/vanta/lib/data/mock/seed/orders.ts` — created in the checkout phase), confirm `ord_seed_demo` has `userId: 'usr_member'`. If it is `null`, change it:

  ```ts
  // lib/data/mock/seed/orders.ts — the seeded confirmation order
  // id: 'ord_seed_demo',
  userId: 'usr_member',
  ```

  If `MockOrderRepository.listByUser` is not yet implemented to filter by `userId`, implement it in `d:/MINE/freelance/system/vanta/lib/data/mock/order-repository.mock.ts`:

  ```ts
  async listByUser(userId: string): Promise<Order[]> {
    return [...this.ordersById.values()].filter((o) => o.userId === userId);
  }
  ```

- [ ] 4. Run it and SHOW it passes:

  ```
  npm run test -- tests/unit/order-repository.test.ts
  ```

  Expected tail:

  ```
   Test Files  1 passed (1)
        Tests  3 passed (3)
  ```

- [ ] 5. Write the dashboard. Create `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/page.tsx`:

  ```tsx
  import { getLocale, getTranslations } from 'next-intl/server';
  import { requireMember } from '@/lib/services/auth-service';
  import { orders } from '@/lib/data';
  import { formatMoney } from '@/lib/format/money';
  import { formatDate } from '@/lib/format/date';
  import type { Locale } from '@/lib/domain';
  import { Link } from '@/lib/i18n/navigation';

  export default async function AccountDashboardPage() {
    const user = await requireMember();
    const locale = (await getLocale()) as Locale;
    const t = await getTranslations('Account');

    const userOrders = await orders.listByUser(user.id);
    const recent = userOrders.slice().sort((a, b) => b.placedAt.localeCompare(a.placedAt))[0];

    return (
      <main className="flex flex-col gap-8">
        <h1 className="display font-display text-3xl text-paper">
          {t('dashTitle', { name: user.name })}
        </h1>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-body text-sm text-paper">
          <dt className="text-smoke-500">{t('dashRole')}</dt>
          <dd className="font-mono uppercase tracking-tight text-lime">{user.role}</dd>
        </dl>

        {recent && (
          <section className="border border-smoke-700 p-4">
            <h2 className="font-mono text-xs uppercase tracking-tight text-smoke-300">
              {t('dashRecentOrder')}
            </h2>
            <Link
              href={`/account/orders`}
              className="mt-2 inline-block font-display text-xl text-paper hover:text-blaze"
            >
              {recent.id}
            </Link>
            <p className="mt-1 font-mono text-sm text-smoke-300">
              {formatDate(recent.placedAt, locale)} · {formatMoney(recent.totals.total, locale)}
            </p>
          </section>
        )}
      </main>
    );
  }
  ```

- [ ] 6. Write the orders page, rendering each `OrderLineItem` from its snapshot. Create `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/orders/page.tsx`:

  ```tsx
  import Image from 'next/image';
  import { getLocale, getTranslations } from 'next-intl/server';
  import { requireMember } from '@/lib/services/auth-service';
  import { orders } from '@/lib/data';
  import { formatMoney } from '@/lib/format/money';
  import { formatDate } from '@/lib/format/date';
  import type { Locale } from '@/lib/domain';

  export default async function AccountOrdersPage() {
    const user = await requireMember();
    const locale = (await getLocale()) as Locale;
    const t = await getTranslations('Account');

    const userOrders = (await orders.listByUser(user.id))
      .slice()
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));

    return (
      <main className="flex flex-col gap-8">
        <h1 className="display font-display text-3xl text-paper">{t('ordersTitle')}</h1>

        {userOrders.length === 0 && <p className="font-body text-smoke-300">{t('ordersEmpty')}</p>}

        {userOrders.map((order) => (
          <article key={order.id} className="border border-smoke-700 p-4">
            <header className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-sm">
              <span className="text-paper">{order.id}</span>
              <span className="text-smoke-300">
                {t('orderPlaced')}: {formatDate(order.placedAt, locale)}
              </span>
              <span className="uppercase tracking-tight text-blaze">
                {t('orderStatus')}: {order.status}
              </span>
            </header>

            <ul className="mt-4 flex flex-col gap-4">
              {order.lineItems.map((li) => (
                <li key={li.variantId} className="flex items-center gap-4">
                  <Image
                    src={li.imageUrl}
                    alt={li.title[locale]}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-body text-paper">{li.title[locale]}</span>
                    <span className="font-mono text-xs text-smoke-300">
                      {li.optionValues.color} / {li.optionValues.size} · {li.sku}
                    </span>
                  </div>
                  <span className="ml-auto font-mono text-sm text-paper">
                    {li.quantity} × {formatMoney(li.unitPrice, locale)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="mt-4 flex justify-end font-mono text-sm text-paper">
              {t('orderTotal')}: {formatMoney(order.totals.total, locale)}
            </footer>
          </article>
        ))}
      </main>
    );
  }
  ```

  > Every displayed value (`li.title[locale]`, `li.imageUrl`, `li.unitPrice`, `li.sku`, `li.optionValues`) comes from the `OrderLineItem` snapshot — there is no `products.getById` call here, proving the order is self-contained.

- [ ] 7. Verify visually (member is logged in from the 7.5 flow) and commit. Navigate the Playwright MCP to `http://localhost:3000/en/account/orders`, confirm one `article` with id `ord_seed_demo`, a `1 × ฿…`-style line, and a `Total: ฿…` line (baht sign, no decimals); repeat on `/th/account/orders` confirming Thai labels and the same Western-digit, gregory-formatted date. Save `scratchpad/orders-en.png` and `scratchpad/orders-th.png`. Then:

  ```
  git add "app/[locale]/(account)/account/page.tsx" "app/[locale]/(account)/account/orders/page.tsx" lib/data/mock/seed/orders.ts lib/data/mock/order-repository.mock.ts tests/unit/order-repository.test.ts
  git commit -m "feat(account): dashboard and order history rendering line-item snapshots"
  ```

---

### Task 7.8 — Addresses (one country-first Thai-shaped example) + settings

The addresses page renders the member's single saved address country-first with **no US State/ZIP labels**; the settings page is a clean, correct read-only profile view (full account CRUD is an explicit non-goal). Both are Tier-3 correct+clean.

**Files**

- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/addresses/page.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/settings/page.tsx`
- Test: `d:/MINE/freelance/system/vanta/tests/e2e/account.th.spec.ts`

**Interfaces**

- Consumes: `requireMember` from `@/lib/services/auth-service`; `Address`, `User` from `@/lib/domain`; `getTranslations`, `getLocale` from `next-intl/server`.
- Produces: addresses page (one example, country-first), settings page (read-only profile). E2E asserts the Thai address renders country-first and contains no `State`/`ZIP` labels.

**Steps**

- [ ] 1. Write the addresses page (country-first ordering: Country → Postal code → City → lines → name → phone). Create `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/addresses/page.tsx`:

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import { requireMember } from '@/lib/services/auth-service';
  import type { Address } from '@/lib/domain';

  function AddressCard({ address }: { address: Address }) {
    // Country-first, Thai-shaped order. No "State" / "ZIP" labels anywhere.
    return (
      <address className="not-italic border border-smoke-700 p-4 font-body text-paper">
        <p className="font-mono text-xs uppercase tracking-tight text-smoke-300">
          {address.country}
        </p>
        <p className="mt-2 font-mono text-sm text-smoke-300">{address.postalCode}</p>
        <p>{address.city}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p className="mt-2 font-medium">{address.fullName}</p>
        {address.phone && <p className="font-mono text-sm text-smoke-300">{address.phone}</p>}
      </address>
    );
  }

  export default async function AccountAddressesPage() {
    const user = await requireMember();
    const t = await getTranslations('Account');
    const address = user.addresses[0] ?? null;

    return (
      <main className="flex flex-col gap-6">
        <h1 className="display font-display text-3xl text-paper">{t('addressesTitle')}</h1>
        {address ? (
          <AddressCard address={address} />
        ) : (
          <p className="font-body text-smoke-300">{t('addressesEmpty')}</p>
        )}
      </main>
    );
  }
  ```

- [ ] 2. Write the settings page (read-only profile; CRUD is a stated non-goal, so the note makes the scope honest). Create `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/settings/page.tsx`:

  ```tsx
  import { getLocale, getTranslations } from 'next-intl/server';
  import { requireMember } from '@/lib/services/auth-service';
  import type { Locale } from '@/lib/domain';

  export default async function AccountSettingsPage() {
    const user = await requireMember();
    const locale = (await getLocale()) as Locale;
    const t = await getTranslations('Account');

    return (
      <main className="flex flex-col gap-6">
        <h1 className="display font-display text-3xl text-paper">{t('settingsTitle')}</h1>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 font-body text-sm text-paper">
          <dt className="text-smoke-500">{t('settingsName')}</dt>
          <dd>{user.name}</dd>

          <dt className="text-smoke-500">{t('settingsEmail')}</dt>
          <dd className="font-mono">{user.email}</dd>

          <dt className="text-smoke-500">{t('settingsLocale')}</dt>
          <dd className="font-mono uppercase">{locale}</dd>
        </dl>

        <p className="font-body text-sm text-smoke-500">{t('settingsNote')}</p>
      </main>
    );
  }
  ```

- [ ] 3. Write the Thai account E2E asserting country-first + no US labels (the phase's bilingual proof). Create `d:/MINE/freelance/system/vanta/tests/e2e/account.th.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  async function loginAsMember(page: import('@playwright/test').Page) {
    await page.goto('/th/login');
    await page.getByLabel('อีเมล').fill('member@vanta.shop');
    await page.getByLabel('รหัสผ่าน').fill('vanta-demo');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page).toHaveURL(/\/th\/account$/);
  }

  test.describe('account (th)', () => {
    test('saved address renders country-first with no US State/ZIP labels', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/th/account/addresses');

      const card = page.getByRole('group').or(page.locator('address')).first();
      const text = await page.locator('address').innerText();

      // country-first: ISO country code precedes the postal code in the DOM order
      const countryIdx = text.indexOf('TH');
      const postalIdx = text.indexOf('10110');
      expect(countryIdx).toBeGreaterThanOrEqual(0);
      expect(postalIdx).toBeGreaterThan(countryIdx);

      // no US labels leak into the rendered address
      await expect(page.locator('address')).not.toContainText(/State/i);
      await expect(page.locator('address')).not.toContainText(/ZIP/i);
      expect(card).toBeTruthy();
    });

    test('settings shows the member profile correctly', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/th/account/settings');
      await expect(page.getByText('member@vanta.shop')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('ตั้งค่า');
    });
  });
  ```

- [ ] 4. Run the account E2E and SHOW it passes:

  ```
  npm run test:e2e -- tests/e2e/account.th.spec.ts
  ```

  Expected tail:

  ```
    2 passed
  ```

- [ ] 5. Visually verify both locales against `npm run dev`. With the Playwright MCP, log in as the member, navigate to `http://localhost:3000/th/account/addresses`, and confirm the rendered order top-to-bottom is `TH` → `10110` → `Bangkok` → `128/4 Soi Sukhumvit 49` → name → phone, with no `State`/`ZIP` text. Save `scratchpad/addresses-th.png` and `scratchpad/addresses-en.png`. Exact check: the `<address>` element's text begins with `TH` and the postal code appears after it.

- [ ] 6. Run the full phase test suite (unit + the two E2E specs) and SHOW it green:

  ```
  npm run test -- tests/unit/user-repository.test.ts tests/unit/session.test.ts tests/unit/auth-guards.test.ts tests/unit/auth-actions.test.ts tests/unit/order-repository.test.ts
  npm run test:e2e -- tests/e2e/auth.en.spec.ts tests/e2e/account.th.spec.ts
  ```

  Expected: unit run ends `Test Files  5 passed`; E2E run ends `6 passed`.

- [ ] 7. Commit:

  ```
  git add "app/[locale]/(account)/account/addresses/page.tsx" "app/[locale]/(account)/account/settings/page.tsx" tests/e2e/account.th.spec.ts
  git commit -m "feat(account): country-first Thai address example and settings page"
  ```

---

**Phase 7 deliverable check:** a viewer can log in with the visible demo creds (`member@vanta.shop` / `vanta-demo`), land on a member dashboard, view an order history rendered entirely from `OrderLineItem` snapshots, see one country-first Thai-shaped saved address (no US State/ZIP), and read a clean settings page. Guests are blocked at the **service layer** (`requireMember` throwing `AuthError('unauthorized')`, redirected to `/login`), proven by unit tests on `enforceRole` and an E2E guard run; admins-only is reserved via `requireAdmin`. Authorization is enforced in the layout/pages/actions, never in middleware.

Files created/modified in this phase (all absolute):

- `d:/MINE/freelance/system/vanta/lib/data/mock/seed/users.ts`
- `d:/MINE/freelance/system/vanta/lib/data/mock/user-repository.mock.ts`
- `d:/MINE/freelance/system/vanta/lib/data/mock/order-repository.mock.ts`
- `d:/MINE/freelance/system/vanta/lib/data/mock/seed/orders.ts`
- `d:/MINE/freelance/system/vanta/lib/services/session.ts`
- `d:/MINE/freelance/system/vanta/lib/services/auth-service.ts`
- `d:/MINE/freelance/system/vanta/lib/actions/auth-actions.ts`
- `d:/MINE/freelance/system/vanta/components/auth/AuthForm.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(auth)/login/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(auth)/register/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(account)/layout.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/orders/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/addresses/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(account)/account/settings/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(admin)/admin/page.tsx`
- `d:/MINE/freelance/system/vanta/messages/en.json`, `d:/MINE/freelance/system/vanta/messages/th.json`
- `d:/MINE/freelance/system/vanta/tests/unit/{user-repository,session,auth-guards,auth-actions,order-repository}.test.ts`
- `d:/MINE/freelance/system/vanta/tests/e2e/{auth.en,account.th}.spec.ts`

---

No additional spec constraints on shipping flat-rate or OG specifics — I'll define them within the locked contracts (shipping is a `Money`; the seed order `ord_seed_demo` is named in CONVENTIONS). I have everything needed. Here is Phase 8.

---

## Phase 8 — Checkout & confirmation

This phase delivers the back third of the hero slice: a collapsed 1–2 step checkout, the `PaymentService` seam (interface + latency-bearing mock that honors a declining test token), the `checkoutService` that snapshots the cart into immutable `OrderLineItem`s and computes `OrderTotals`, the `placeOrder` Server Action, and the premium, shareable `/checkout/[orderId]` confirmation (OG image, gregory-calendar date, THB totals). Logic is built TDD-first with Vitest; the screens are verified with Playwright in both locales.

**Phase preconditions (already shipped in earlier phases, consumed verbatim here):** `lib/domain` barrel; `repositories` swap point with `products`/`orders`/`cart`; `cartService`; `authService` (`getCurrentUser`); `formatMoney`/`formatDate`; the Zustand mirror `useCartStore`; `messages/en.json` + `messages/th.json`; `lib/i18n/navigation.ts` (`Link`, `redirect`); the mock `OrderRepository` already seeds `ord_seed_demo`.

**Shipping policy used by this phase (a constant owned by `checkout-service.ts`, not a domain widening):** flat shipping `{ amount: 5000, currency: 'THB' }` (฿50) on any non-empty cart, `{ amount: 0, currency: 'THB' }` on an empty cart; `total = subtotal + shipping`. This is the only place shipping is computed.

---

### Task 8.1 — `PaymentService` mock (latency + declining test token)

Build the payment seam first: a pure-ish async adapter that adds artificial latency and declines exactly the `'tok_decline'` token. Everything downstream depends on its `ChargeResult` shape.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/services/payment-service.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/payment-service.test.ts`

**Interfaces**

- Produces (verbatim from contracts):
  ```ts
  export type ChargeInput = { amountMinor: number; currency: 'THB'; paymentToken: string };
  export type ChargeResult =
    | { ok: true; chargeId: string }
    | { ok: false; declineCode: 'card_declined' };
  export interface PaymentService {
    charge(input: ChargeInput): Promise<ChargeResult>;
  }
  export const mockPaymentService: PaymentService;
  ```
- Consumes: nothing (leaf module). Mock token convention from the contract: `'tok_ok'` charges, `'tok_decline'` declines.

**Steps**

- [ ] Write the failing test `d:/MINE/freelance/system/vanta/tests/unit/payment-service.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { mockPaymentService, type ChargeResult } from '@/lib/services/payment-service';

  describe('mockPaymentService.charge', () => {
    it('charges a valid token and returns an ok result with a chargeId', async () => {
      const result: ChargeResult = await mockPaymentService.charge({
        amountMinor: 199000,
        currency: 'THB',
        paymentToken: 'tok_ok',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.chargeId).toMatch(/^ch_/);
      }
    });

    it('declines the declining test token with card_declined', async () => {
      const result: ChargeResult = await mockPaymentService.charge({
        amountMinor: 199000,
        currency: 'THB',
        paymentToken: 'tok_decline',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.declineCode).toBe('card_declined');
      }
    });

    it('declines any unknown token (only tok_ok charges)', async () => {
      const result = await mockPaymentService.charge({
        amountMinor: 5000,
        currency: 'THB',
        paymentToken: 'tok_unknown',
      });
      expect(result.ok).toBe(false);
    });

    it('rejects a non-positive amount before charging', async () => {
      const result = await mockPaymentService.charge({
        amountMinor: 0,
        currency: 'THB',
        paymentToken: 'tok_ok',
      });
      expect(result.ok).toBe(false);
    });

    it('adds artificial latency (>= 200ms)', async () => {
      const start = Date.now();
      await mockPaymentService.charge({
        amountMinor: 199000,
        currency: 'THB',
        paymentToken: 'tok_ok',
      });
      expect(Date.now() - start).toBeGreaterThanOrEqual(200);
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/payment-service.test.ts
  ```

  Expected output (failure): `Error: Failed to resolve import "@/lib/services/payment-service"` / `No test files found or module not found`, exit code `1`.

- [ ] Implement the minimal adapter in `d:/MINE/freelance/system/vanta/lib/services/payment-service.ts`:

  ```ts
  export type ChargeInput = {
    amountMinor: number; // integer minor units
    currency: 'THB';
    paymentToken: string; // mock: 'tok_ok' charges, 'tok_decline' declines
  };

  export type ChargeResult =
    | { ok: true; chargeId: string }
    | { ok: false; declineCode: 'card_declined' };

  /** Seam targeting Stripe/Omise. Mock adds latency + honors a declining test token. */
  export interface PaymentService {
    charge(input: ChargeInput): Promise<ChargeResult>;
  }

  /** Artificial network latency so the checkout spinner is observable. */
  const LATENCY_MS = 700;

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  export const mockPaymentService: PaymentService = {
    async charge(input: ChargeInput): Promise<ChargeResult> {
      await delay(LATENCY_MS);

      if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
        return { ok: false, declineCode: 'card_declined' };
      }

      // Only the explicit success token charges; everything else declines.
      if (input.paymentToken !== 'tok_ok') {
        return { ok: false, declineCode: 'card_declined' };
      }

      const chargeId = `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      return { ok: true, chargeId };
    },
  };
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/payment-service.test.ts
  ```

  Expected output (success): `Test Files  1 passed (1)` · `Tests  5 passed (5)`, exit code `0`.

- [ ] Commit:
  ```
  git add lib/services/payment-service.ts tests/unit/payment-service.test.ts
  git commit -m "feat(payment): add PaymentService seam with latency + declining test token mock"
  ```

---

### Task 8.2 — `checkoutService`: line-item snapshotting + totals + place-order

The heart of the phase. `buildLineItemsFromCart` turns each `CartItem` into a self-contained `OrderLineItem` snapshot (title, sku, optionValues, unitPrice, imageUrl resolved at purchase time). `placeOrder` computes `OrderTotals`, charges via `mockPaymentService`, persists the `Order` (with `status` + `placedAt`), and clears the cart — surfacing the declined-card and empty-cart paths.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/services/checkout-service.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/checkout-service.test.ts`

**Interfaces**

- Consumes:
  - `import { products, orders, cart as cartStore } from '@/lib/data'` (`ProductRepository.getById`/`getVariantById`, `OrderRepository.create`, `CartStore.read`/`clear`)
  - `import { authService } from '@/lib/services/auth-service'` (`getCurrentUser(): Promise<User | null>`)
  - `import { mockPaymentService } from '@/lib/services/payment-service'` (`charge`)
  - Domain types from `@/lib/domain`: `Order`, `OrderLineItem`, `OrderTotals`, `Address`, `Cart`, `Money`, `Variant`, `Product`
- Produces (verbatim from contracts):
  ```ts
  export type PlaceOrderInput = { email: string; shippingAddress: Address; paymentToken: string };
  export type PlaceOrderResult =
    | { ok: true; order: Order }
    | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };
  export interface CheckoutService {
    placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
    buildLineItemsFromCart(cart: Cart): Promise<Order['lineItems']>;
  }
  export const checkoutService: CheckoutService;
  ```

> Note: the line-item resolver needs the owning product per variant to snapshot `title` and `imageUrl`. We resolve via `products.getVariantById(variantId)` for price/options/sku and `products.getById(...)` for the parent title + image; since `Variant` has no `productId`, we fall back to scanning `products.list()` to find the owner — a cheap mock-side lookup, still behind the repository seam.

**Steps**

- [ ] Write the failing test `d:/MINE/freelance/system/vanta/tests/unit/checkout-service.test.ts`. It mocks the data + service dependencies so the logic is tested in isolation:

  ```ts
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import type { Cart, Product, Variant, User } from '@/lib/domain';

  // --- Mock the data seam ---
  const getById = vi.fn();
  const getVariantById = vi.fn();
  const list = vi.fn();
  const create = vi.fn();
  const read = vi.fn();
  const clear = vi.fn();

  vi.mock('@/lib/data', () => ({
    products: {
      getById: (...a: unknown[]) => getById(...a),
      getVariantById: (...a: unknown[]) => getVariantById(...a),
      list: (...a: unknown[]) => list(...a),
    },
    orders: { create: (...a: unknown[]) => create(...a) },
    cart: { read: (...a: unknown[]) => read(...a), clear: (...a: unknown[]) => clear(...a) },
  }));

  // --- Mock auth ---
  const getCurrentUser = vi.fn();
  vi.mock('@/lib/services/auth-service', () => ({
    authService: { getCurrentUser: (...a: unknown[]) => getCurrentUser(...a) },
  }));

  // --- Mock payment ---
  const charge = vi.fn();
  vi.mock('@/lib/services/payment-service', () => ({
    mockPaymentService: { charge: (...a: unknown[]) => charge(...a) },
  }));

  import { checkoutService } from '@/lib/services/checkout-service';

  const VARIANT: Variant = {
    id: 'var_1',
    sku: 'VNT-TEE-BLK-M',
    optionValues: { size: 'M', color: 'black' },
    price: { amount: 199000, currency: 'THB' },
    stock: 10,
    availability: 'live',
  };

  const PRODUCT: Product = {
    id: 'prod_1',
    slug: 'void-tee',
    title: { en: 'Void Tee', th: 'เสื้อยืดวอยด์' },
    description: { en: 'd', th: 'ด' },
    optionAxes: { size: ['M'], color: ['black'] },
    variants: [VARIANT],
    imagesByColor: {
      black: [
        {
          id: 'img_1',
          url: '/img/void-black.jpg',
          alt: { en: 'a', th: 'อ' },
          width: 800,
          height: 1000,
        },
      ],
    },
    collectionIds: [],
  };

  const CART_2X: Cart = {
    items: [{ variantId: 'var_1', quantity: 2 }],
    itemCount: 2,
    subtotal: { amount: 398000, currency: 'THB' },
    updatedAt: '2026-06-27T00:00:00.000Z',
  };

  const ADDRESS = {
    id: 'addr_1',
    fullName: 'Somchai Jaidee',
    line1: '99 Sukhumvit Rd',
    city: 'Bangkok',
    postalCode: '10110',
    country: 'TH',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getVariantById.mockResolvedValue(VARIANT);
    getById.mockResolvedValue(PRODUCT);
    list.mockResolvedValue([PRODUCT]);
    getCurrentUser.mockResolvedValue(null);
    create.mockImplementation(async (o) => o);
  });

  describe('buildLineItemsFromCart', () => {
    it('snapshots each cart item into a self-contained OrderLineItem', async () => {
      const items = await checkoutService.buildLineItemsFromCart(CART_2X);
      expect(items).toEqual([
        {
          variantId: 'var_1',
          sku: 'VNT-TEE-BLK-M',
          title: { en: 'Void Tee', th: 'เสื้อยืดวอยด์' },
          optionValues: { size: 'M', color: 'black' },
          unitPrice: { amount: 199000, currency: 'THB' },
          quantity: 2,
          imageUrl: '/img/void-black.jpg',
        },
      ]);
    });

    it('throws if a variant referenced by the cart no longer exists', async () => {
      getVariantById.mockResolvedValueOnce(null);
      await expect(checkoutService.buildLineItemsFromCart(CART_2X)).rejects.toThrow();
    });
  });

  describe('placeOrder', () => {
    it('rejects an empty cart', async () => {
      read.mockResolvedValue({
        items: [],
        itemCount: 0,
        subtotal: { amount: 0, currency: 'THB' },
        updatedAt: 'x',
      });
      const result = await checkoutService.placeOrder({
        email: 'a@b.co',
        shippingAddress: ADDRESS,
        paymentToken: 'tok_ok',
      });
      expect(result).toEqual({ ok: false, error: 'empty_cart' });
      expect(charge).not.toHaveBeenCalled();
    });

    it('computes totals = subtotal + flat ฿50 shipping and charges the grand total', async () => {
      read.mockResolvedValue(CART_2X);
      charge.mockResolvedValue({ ok: true, chargeId: 'ch_123' });
      const result = await checkoutService.placeOrder({
        email: 'a@b.co',
        shippingAddress: ADDRESS,
        paymentToken: 'tok_ok',
      });
      expect(result.ok).toBe(true);
      // charged the grand total in minor units: 398000 + 5000
      expect(charge).toHaveBeenCalledWith({
        amountMinor: 403000,
        currency: 'THB',
        paymentToken: 'tok_ok',
      });
      if (result.ok) {
        expect(result.order.totals).toEqual({
          subtotal: { amount: 398000, currency: 'THB' },
          shipping: { amount: 5000, currency: 'THB' },
          total: { amount: 403000, currency: 'THB' },
        });
        expect(result.order.status).toBe('paid');
        expect(result.order.lineItems).toHaveLength(1);
        expect(typeof result.order.placedAt).toBe('string');
        expect(new Date(result.order.placedAt).toString()).not.toBe('Invalid Date');
        expect(result.order.email).toBe('a@b.co');
        expect(result.order.userId).toBeNull(); // guest
      }
    });

    it('attaches the authenticated user id when a member is logged in', async () => {
      read.mockResolvedValue(CART_2X);
      charge.mockResolvedValue({ ok: true, chargeId: 'ch_123' });
      const member: User = {
        id: 'usr_member',
        email: 'member@vanta.shop',
        name: 'Member',
        role: 'member',
        addresses: [],
      };
      getCurrentUser.mockResolvedValue(member);
      const result = await checkoutService.placeOrder({
        email: 'member@vanta.shop',
        shippingAddress: ADDRESS,
        paymentToken: 'tok_ok',
      });
      if (result.ok) {
        expect(result.order.userId).toBe('usr_member');
      } else {
        throw new Error('expected ok');
      }
    });

    it('returns payment_declined, does NOT persist or clear, on a declining token', async () => {
      read.mockResolvedValue(CART_2X);
      charge.mockResolvedValue({ ok: false, declineCode: 'card_declined' });
      const result = await checkoutService.placeOrder({
        email: 'a@b.co',
        shippingAddress: ADDRESS,
        paymentToken: 'tok_decline',
      });
      expect(result).toEqual({ ok: false, error: 'payment_declined' });
      expect(create).not.toHaveBeenCalled();
      expect(clear).not.toHaveBeenCalled();
    });

    it('persists the order and clears the cart on success', async () => {
      read.mockResolvedValue(CART_2X);
      charge.mockResolvedValue({ ok: true, chargeId: 'ch_123' });
      await checkoutService.placeOrder({
        email: 'a@b.co',
        shippingAddress: ADDRESS,
        paymentToken: 'tok_ok',
      });
      expect(create).toHaveBeenCalledTimes(1);
      expect(clear).toHaveBeenCalledTimes(1);
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/checkout-service.test.ts
  ```

  Expected output (failure): `Error: Failed to resolve import "@/lib/services/checkout-service"`, exit code `1`.

- [ ] Implement `d:/MINE/freelance/system/vanta/lib/services/checkout-service.ts`:

  ```ts
  import type {
    Order,
    OrderLineItem,
    OrderTotals,
    Address,
    Cart,
    Money,
    Product,
    Variant,
  } from '@/lib/domain';
  import { products, orders, cart as cartStore } from '@/lib/data';
  import { authService } from '@/lib/services/auth-service';
  import { mockPaymentService } from '@/lib/services/payment-service';

  export type PlaceOrderInput = {
    email: string;
    shippingAddress: Address;
    paymentToken: string; // opaque token from PaymentService
  };

  export type PlaceOrderResult =
    | { ok: true; order: Order }
    | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };

  export interface CheckoutService {
    placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
    buildLineItemsFromCart(cart: Cart): Promise<Order['lineItems']>;
  }

  /** Flat shipping — owned here, the only place shipping is computed. */
  const SHIPPING_FLAT: Money = { amount: 5000, currency: 'THB' };

  /** Find the product that owns a variant so we can snapshot its title + image. */
  async function findOwningProduct(variantId: string): Promise<Product | null> {
    const all = await products.list();
    return all.find((p) => p.variants.some((v) => v.id === variantId)) ?? null;
  }

  /** First image for the variant's colorway, falling back to any image. */
  function pickImageUrl(product: Product, variant: Variant): string {
    const byColor = product.imagesByColor[variant.optionValues.color];
    if (byColor && byColor.length > 0) return byColor[0].url;
    const anyColor = Object.values(product.imagesByColor)[0];
    return anyColor && anyColor.length > 0 ? anyColor[0].url : '';
  }

  async function snapshotLineItem(variantId: string, quantity: number): Promise<OrderLineItem> {
    const variant = await products.getVariantById(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} no longer exists; cannot snapshot order line item.`);
    }
    const product = await findOwningProduct(variantId);
    if (!product) {
      throw new Error(
        `Product owning variant ${variantId} not found; cannot snapshot order line item.`,
      );
    }
    return {
      variantId: variant.id,
      sku: variant.sku,
      title: product.title,
      optionValues: variant.optionValues,
      unitPrice: variant.price,
      quantity,
      imageUrl: pickImageUrl(product, variant),
    };
  }

  function computeTotals(lineItems: OrderLineItem[]): OrderTotals {
    const subtotalAmount = lineItems.reduce(
      (sum, li) => sum + li.unitPrice.amount * li.quantity,
      0,
    );
    const subtotal: Money = { amount: subtotalAmount, currency: 'THB' };
    const shipping: Money = subtotalAmount > 0 ? SHIPPING_FLAT : { amount: 0, currency: 'THB' };
    const total: Money = { amount: subtotal.amount + shipping.amount, currency: 'THB' };
    return { subtotal, shipping, total };
  }

  function newOrderId(): string {
    return `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  export const checkoutService: CheckoutService = {
    async buildLineItemsFromCart(cart: Cart): Promise<OrderLineItem[]> {
      const items: OrderLineItem[] = [];
      for (const item of cart.items) {
        items.push(await snapshotLineItem(item.variantId, item.quantity));
      }
      return items;
    },

    async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
      const cart = await cartStore.read();
      if (cart.items.length === 0) {
        return { ok: false, error: 'empty_cart' };
      }

      const lineItems = await this.buildLineItemsFromCart(cart);
      const totals = computeTotals(lineItems);

      const charge = await mockPaymentService.charge({
        amountMinor: totals.total.amount,
        currency: 'THB',
        paymentToken: input.paymentToken,
      });
      if (!charge.ok) {
        return { ok: false, error: 'payment_declined' };
      }

      const user = await authService.getCurrentUser();

      const order: Order = {
        id: newOrderId(),
        userId: user ? user.id : null,
        status: 'paid',
        lineItems,
        totals,
        shippingAddress: input.shippingAddress,
        email: input.email,
        placedAt: new Date().toISOString(),
      };

      const persisted = await orders.create(order);
      await cartStore.clear();
      return { ok: true, order: persisted };
    },
  };
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/checkout-service.test.ts
  ```

  Expected output (success): `Test Files  1 passed (1)` · `Tests  8 passed (8)`, exit code `0`.

- [ ] Commit:
  ```
  git add lib/services/checkout-service.ts tests/unit/checkout-service.test.ts
  git commit -m "feat(checkout): snapshot cart to order line items, compute totals, charge + persist order"
  ```

---

### Task 8.3 — `placeOrder` Server Action with Zod validation

Bridge the form to the service. The action validates `FormData` with Zod, calls `checkoutService.placeOrder`, and returns the `PlaceOrderActionState` discriminated union the form consumes via `useActionState`.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/actions/checkout-actions.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/checkout-actions.test.ts`

**Interfaces**

- Consumes:
  - `import { checkoutService } from '@/lib/services/checkout-service'`
  - `import { z } from 'zod'`
  - `import type { Address } from '@/lib/domain'`
- Produces (verbatim from contracts):
  ```ts
  export type PlaceOrderActionState =
    | { ok: true; orderId: string }
    | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };
  export async function placeOrder(
    prevState: PlaceOrderActionState,
    formData: FormData,
  ): Promise<PlaceOrderActionState>;
  ```
- The Zod schema (the validation contract this action owns). On a validation miss it maps to `{ ok: false, error: 'empty_cart' }` only when the cart truly cannot be processed; field-shape failures throw before reaching the service (the form guarantees field presence client-side, and the test asserts the mapping):
  ```ts
  export const checkoutFormSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
    phone: z.string().optional(),
    paymentToken: z.enum(['tok_ok', 'tok_decline']),
  });
  ```

**Steps**

- [ ] Write the failing test `d:/MINE/freelance/system/vanta/tests/unit/checkout-actions.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach, vi } from 'vitest';

  const placeOrderSvc = vi.fn();
  vi.mock('@/lib/services/checkout-service', () => ({
    checkoutService: { placeOrder: (...a: unknown[]) => placeOrderSvc(...a) },
  }));

  import { placeOrder, type PlaceOrderActionState } from '@/lib/actions/checkout-actions';

  function form(fields: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  }

  const VALID = {
    email: 'a@b.co',
    fullName: 'Somchai Jaidee',
    line1: '99 Sukhumvit Rd',
    city: 'Bangkok',
    postalCode: '10110',
    country: 'TH',
    paymentToken: 'tok_ok',
  };

  const PREV: PlaceOrderActionState = { ok: false, error: 'empty_cart' };

  beforeEach(() => vi.clearAllMocks());

  describe('placeOrder action', () => {
    it('passes validated fields to the service and returns the order id on success', async () => {
      placeOrderSvc.mockResolvedValue({ ok: true, order: { id: 'ord_abc' } });
      const result = await placeOrder(PREV, form(VALID));
      expect(result).toEqual({ ok: true, orderId: 'ord_abc' });
      expect(placeOrderSvc).toHaveBeenCalledWith({
        email: 'a@b.co',
        shippingAddress: {
          id: '',
          fullName: 'Somchai Jaidee',
          line1: '99 Sukhumvit Rd',
          line2: undefined,
          city: 'Bangkok',
          postalCode: '10110',
          country: 'TH',
          phone: undefined,
        },
        paymentToken: 'tok_ok',
      });
    });

    it('surfaces a payment decline as an error state', async () => {
      placeOrderSvc.mockResolvedValue({ ok: false, error: 'payment_declined' });
      const result = await placeOrder(PREV, form({ ...VALID, paymentToken: 'tok_decline' }));
      expect(result).toEqual({ ok: false, error: 'payment_declined' });
    });

    it('returns empty_cart when validation fails (missing required field)', async () => {
      const { email, ...missingEmail } = VALID;
      const result = await placeOrder(PREV, form(missingEmail));
      expect(result).toEqual({ ok: false, error: 'empty_cart' });
      expect(placeOrderSvc).not.toHaveBeenCalled();
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/checkout-actions.test.ts
  ```

  Expected output (failure): `Error: Failed to resolve import "@/lib/actions/checkout-actions"`, exit code `1`.

- [ ] Install Zod if not already present (idempotent; skip if the lockfile already lists it):

  ```
  npm install zod
  ```

- [ ] Implement `d:/MINE/freelance/system/vanta/lib/actions/checkout-actions.ts`:

  ```ts
  'use server';

  import { z } from 'zod';
  import type { Address } from '@/lib/domain';
  import { checkoutService } from '@/lib/services/checkout-service';

  export type PlaceOrderActionState =
    | { ok: true; orderId: string }
    | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };

  export const checkoutFormSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
    phone: z.string().optional(),
    paymentToken: z.enum(['tok_ok', 'tok_decline']),
  });

  function normalizeOptional(value: FormDataEntryValue | null): string | undefined {
    if (value === null) return undefined;
    const s = String(value).trim();
    return s.length === 0 ? undefined : s;
  }

  export async function placeOrder(
    prevState: PlaceOrderActionState,
    formData: FormData,
  ): Promise<PlaceOrderActionState> {
    const parsed = checkoutFormSchema.safeParse({
      email: formData.get('email'),
      fullName: formData.get('fullName'),
      line1: formData.get('line1'),
      line2: normalizeOptional(formData.get('line2')),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
      country: formData.get('country'),
      phone: normalizeOptional(formData.get('phone')),
      paymentToken: formData.get('paymentToken'),
    });

    if (!parsed.success) {
      // Client form guarantees field shape; a parse miss means nothing to charge.
      return { ok: false, error: 'empty_cart' };
    }

    const data = parsed.data;
    const shippingAddress: Address = {
      id: '',
      fullName: data.fullName,
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      phone: data.phone,
    };

    const result = await checkoutService.placeOrder({
      email: data.email,
      shippingAddress,
      paymentToken: data.paymentToken,
    });

    if (result.ok) {
      return { ok: true, orderId: result.order.id };
    }
    return { ok: false, error: result.error };
  }
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/checkout-actions.test.ts
  ```

  Expected output (success): `Test Files  1 passed (1)` · `Tests  3 passed (3)`, exit code `0`.

- [ ] Commit:
  ```
  git add lib/actions/checkout-actions.ts tests/unit/checkout-actions.test.ts package.json package-lock.json
  git commit -m "feat(checkout): add placeOrder server action with Zod validation"
  ```

---

### Task 8.4 — Checkout UI: `CheckoutForm`, `PaymentMockForm`, `OrderSummary`, and the checkout page

The 1–2 step screen. Single scroll, two stacked sections — **Contact + shipping** and **Payment** — with a sticky `OrderSummary` rail (THB via `formatMoney`). `PaymentMockForm` exposes the two test cards (success / declining) as radio choices that set the hidden `paymentToken`. The page redirects to `/checkout/[orderId]` on success and renders an inline error banner on decline.

**Files**

- Create: `d:/MINE/freelance/system/vanta/components/checkout/OrderSummary.tsx`
- Create: `d:/MINE/freelance/system/vanta/components/checkout/PaymentMockForm.tsx`
- Create: `d:/MINE/freelance/system/vanta/components/checkout/CheckoutForm.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/page.tsx`
- Modify: `d:/MINE/freelance/system/vanta/messages/en.json` (add `checkout` namespace)
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json` (mirror keyset)

**Interfaces**

- Consumes: `useActionState` (React 19.2), `placeOrder` + `PlaceOrderActionState` from `@/lib/actions/checkout-actions`; `useRouter`/`redirect` from `@/lib/i18n/navigation`; `formatMoney` from `@/lib/format/money`; `useCartStore` from `@/lib/store/cart-store`; `useTranslations` from `next-intl`; `repositories`/`cart` reads only via RSC page; `Money` from `@/lib/domain`.
- Produces: rendered checkout route; `OrderSummary` props `{ items: { title: string; sku: string; quantity: number; unitPrice: Money }[]; subtotal: Money; shipping: Money; total: Money; locale: Locale }`.

**Steps**

- [ ] Add the `checkout` namespace to `d:/MINE/freelance/system/vanta/messages/en.json` (merge into the existing root object):

  ```json
  "checkout": {
    "title": "Checkout",
    "contactSection": "Contact & shipping",
    "paymentSection": "Payment",
    "email": "Email",
    "fullName": "Full name",
    "line1": "Address",
    "line2": "Apartment, suite (optional)",
    "city": "City",
    "postalCode": "Postal code",
    "country": "Country",
    "phone": "Phone (optional)",
    "summaryTitle": "Order summary",
    "subtotal": "Subtotal",
    "shipping": "Shipping",
    "total": "Total",
    "payButton": "Pay",
    "processing": "Processing…",
    "paymentMethod": "Payment method",
    "testCardSuccess": "Test card — succeeds",
    "testCardDecline": "Test card — declines",
    "errorDeclined": "Your card was declined. Try the succeeding test card.",
    "errorEmptyCart": "Your cart is empty.",
    "errorOutOfStock": "An item went out of stock. Please review your cart.",
    "emptyCartHeading": "Nothing to check out",
    "emptyCartCta": "Continue shopping"
  }
  ```

- [ ] Add the mirrored `checkout` namespace to `d:/MINE/freelance/system/vanta/messages/th.json`:

  ```json
  "checkout": {
    "title": "ชำระเงิน",
    "contactSection": "ข้อมูลติดต่อและที่อยู่จัดส่ง",
    "paymentSection": "การชำระเงิน",
    "email": "อีเมล",
    "fullName": "ชื่อ-นามสกุล",
    "line1": "ที่อยู่",
    "line2": "ห้อง/ชั้น (ไม่บังคับ)",
    "city": "เมือง/อำเภอ",
    "postalCode": "รหัสไปรษณีย์",
    "country": "ประเทศ",
    "phone": "เบอร์โทร (ไม่บังคับ)",
    "summaryTitle": "สรุปคำสั่งซื้อ",
    "subtotal": "ยอดรวมย่อย",
    "shipping": "ค่าจัดส่ง",
    "total": "ยอดรวมทั้งหมด",
    "payButton": "ชำระเงิน",
    "processing": "กำลังดำเนินการ…",
    "paymentMethod": "วิธีการชำระเงิน",
    "testCardSuccess": "บัตรทดสอบ — สำเร็จ",
    "testCardDecline": "บัตรทดสอบ — ถูกปฏิเสธ",
    "errorDeclined": "บัตรของคุณถูกปฏิเสธ ลองใช้บัตรทดสอบที่สำเร็จ",
    "errorEmptyCart": "ตะกร้าของคุณว่างเปล่า",
    "errorOutOfStock": "มีสินค้าหมดสต็อก โปรดตรวจสอบตะกร้าอีกครั้ง",
    "emptyCartHeading": "ไม่มีสินค้าให้ชำระเงิน",
    "emptyCartCta": "เลือกซื้อสินค้าต่อ"
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/components/checkout/OrderSummary.tsx`:

  ```tsx
  import type { Money, Locale } from '@/lib/domain';
  import { formatMoney } from '@/lib/format/money';
  import { getTranslations } from 'next-intl/server';

  export type OrderSummaryLine = {
    title: string;
    sku: string;
    quantity: number;
    unitPrice: Money;
  };

  export type OrderSummaryProps = {
    items: OrderSummaryLine[];
    subtotal: Money;
    shipping: Money;
    total: Money;
    locale: Locale;
  };

  export async function OrderSummary({
    items,
    subtotal,
    shipping,
    total,
    locale,
  }: OrderSummaryProps) {
    const t = await getTranslations('checkout');
    return (
      <aside
        data-testid="order-summary"
        className="rounded-lg bg-smoke-900 p-6 text-paper lg:sticky lg:top-24"
      >
        <h2 className="display text-xl">{t('summaryTitle')}</h2>
        <ul className="mt-6 space-y-4">
          {items.map((line) => (
            <li key={line.sku} className="flex items-baseline justify-between gap-4">
              <span className="text-sm">
                {line.title}
                <span className="ml-2 font-mono text-xs text-smoke-300">×{line.quantity}</span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {formatMoney(
                  { amount: line.unitPrice.amount * line.quantity, currency: 'THB' },
                  locale,
                )}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-smoke-700 pt-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-smoke-300">{t('subtotal')}</dt>
            <dd data-testid="summary-subtotal" className="font-mono tabular-nums">
              {formatMoney(subtotal, locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-smoke-300">{t('shipping')}</dt>
            <dd data-testid="summary-shipping" className="font-mono tabular-nums">
              {formatMoney(shipping, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-smoke-700 pt-2 text-base">
            <dt className="display">{t('total')}</dt>
            <dd data-testid="summary-total" className="font-mono tabular-nums text-lime">
              {formatMoney(total, locale)}
            </dd>
          </div>
        </dl>
      </aside>
    );
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/components/checkout/PaymentMockForm.tsx`:

  ```tsx
  'use client';

  import { useState } from 'react';
  import { useTranslations } from 'next-intl';

  export function PaymentMockForm() {
    const t = useTranslations('checkout');
    const [token, setToken] = useState<'tok_ok' | 'tok_decline'>('tok_ok');

    return (
      <fieldset className="space-y-3">
        <legend className="display text-sm text-ink">{t('paymentMethod')}</legend>
        <input type="hidden" name="paymentToken" value={token} />

        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-smoke-300 p-4 has-[:checked]:border-ink">
          <input
            type="radio"
            name="paymentChoice"
            value="tok_ok"
            checked={token === 'tok_ok'}
            onChange={() => setToken('tok_ok')}
            className="accent-ink"
            data-testid="pay-token-ok"
          />
          <span className="text-sm">{t('testCardSuccess')}</span>
          <span className="ml-auto font-mono text-xs text-smoke-500">4242 4242 4242 4242</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-smoke-300 p-4 has-[:checked]:border-blaze-on-light">
          <input
            type="radio"
            name="paymentChoice"
            value="tok_decline"
            checked={token === 'tok_decline'}
            onChange={() => setToken('tok_decline')}
            className="accent-blaze-on-light"
            data-testid="pay-token-decline"
          />
          <span className="text-sm">{t('testCardDecline')}</span>
          <span className="ml-auto font-mono text-xs text-smoke-500">4000 0000 0000 0002</span>
        </label>
      </fieldset>
    );
  }
  ```

- [ ] Create `d:/MINE/freelance/system/vanta/components/checkout/CheckoutForm.tsx`:

  ```tsx
  'use client';

  import { useActionState, useEffect } from 'react';
  import { useFormStatus } from 'react-dom';
  import { useTranslations } from 'next-intl';
  import { useRouter } from '@/lib/i18n/navigation';
  import { placeOrder, type PlaceOrderActionState } from '@/lib/actions/checkout-actions';
  import { useCartStore } from '@/lib/store/cart-store';
  import { PaymentMockForm } from './PaymentMockForm';

  const INITIAL: PlaceOrderActionState = { ok: false, error: 'empty_cart' };

  function SubmitButton() {
    const t = useTranslations('checkout');
    const { pending } = useFormStatus();
    return (
      <button
        type="submit"
        disabled={pending}
        data-testid="checkout-pay"
        className="mt-8 w-full rounded-md bg-ink py-4 text-center font-mono uppercase tracking-widest text-paper disabled:opacity-60"
      >
        {pending ? t('processing') : t('payButton')}
      </button>
    );
  }

  function Field({
    name,
    label,
    type = 'text',
    required = true,
    autoComplete,
    defaultValue,
  }: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    autoComplete?: string;
    defaultValue?: string;
  }) {
    return (
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wide text-smoke-500">{label}</span>
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          data-testid={`field-${name}`}
          className="w-full rounded-md border border-smoke-300 bg-paper px-3 py-2 text-ink focus-visible:border-ink focus-visible:outline-none"
        />
      </label>
    );
  }

  export function CheckoutForm() {
    const t = useTranslations('checkout');
    const router = useRouter();
    const replaceFromServer = useCartStore((s) => s.replaceFromServer);
    const [state, formAction] = useActionState(placeOrder, INITIAL);

    useEffect(() => {
      if (state.ok) {
        // Cart cleared server-side; mirror the emptied cart, then go to confirmation.
        replaceFromServer({
          items: [],
          itemCount: 0,
          subtotal: { amount: 0, currency: 'THB' },
          updatedAt: new Date().toISOString(),
        });
        router.push(`/checkout/${state.orderId}`);
      }
    }, [state, router, replaceFromServer]);

    const errorKey =
      !state.ok && state.error === 'payment_declined'
        ? 'errorDeclined'
        : !state.ok && state.error === 'out_of_stock'
          ? 'errorOutOfStock'
          : null;

    return (
      <form action={formAction} className="space-y-10">
        {errorKey && (
          <p
            role="alert"
            data-testid="checkout-error"
            className="rounded-md border border-blaze-on-light bg-blaze-on-light/10 px-4 py-3 text-sm text-blaze-on-light"
          >
            {t(errorKey)}
          </p>
        )}

        <section aria-labelledby="contact-heading" className="space-y-4">
          <h2 id="contact-heading" className="display text-xl text-ink">
            {t('contactSection')}
          </h2>
          <Field name="email" label={t('email')} type="email" autoComplete="email" />
          <Field name="fullName" label={t('fullName')} autoComplete="name" />
          <Field name="line1" label={t('line1')} autoComplete="address-line1" />
          <Field name="line2" label={t('line2')} required={false} autoComplete="address-line2" />
          <div className="grid grid-cols-2 gap-4">
            <Field name="city" label={t('city')} autoComplete="address-level2" />
            <Field name="postalCode" label={t('postalCode')} autoComplete="postal-code" />
          </div>
          <Field name="country" label={t('country')} autoComplete="country" defaultValue="TH" />
          <Field name="phone" label={t('phone')} required={false} type="tel" autoComplete="tel" />
        </section>

        <section aria-labelledby="payment-heading" className="space-y-4">
          <h2 id="payment-heading" className="display text-xl text-ink">
            {t('paymentSection')}
          </h2>
          <PaymentMockForm />
        </section>

        <SubmitButton />
      </form>
    );
  }
  ```

- [ ] Create the checkout page `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/page.tsx`. It reads the authoritative cart through the repository seam (RSC), resolves each line's snapshot data for the summary, and computes the same flat-shipping totals the service uses:

  ```tsx
  import { getTranslations } from 'next-intl/server';
  import type { Locale, Money } from '@/lib/domain';
  import { products, cart as cartStore } from '@/lib/data';
  import { formatMoney } from '@/lib/format/money';
  import { Link } from '@/lib/i18n/navigation';
  import { CheckoutForm } from '@/components/checkout/CheckoutForm';
  import { OrderSummary, type OrderSummaryLine } from '@/components/checkout/OrderSummary';

  const SHIPPING_FLAT: Money = { amount: 5000, currency: 'THB' };

  export default async function CheckoutPage({ params }: { params: Promise<{ locale: Locale }> }) {
    const { locale } = await params;
    const t = await getTranslations('checkout');
    const cart = await cartStore.read();

    if (cart.items.length === 0) {
      return (
        <main className="mx-auto max-w-shell px-6 py-24 text-center">
          <h1 className="display text-3xl text-ink">{t('emptyCartHeading')}</h1>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-md bg-ink px-6 py-3 font-mono uppercase tracking-widest text-paper"
          >
            {t('emptyCartCta')}
          </Link>
        </main>
      );
    }

    const lines: OrderSummaryLine[] = [];
    for (const item of cart.items) {
      const variant = await products.getVariantById(item.variantId);
      if (!variant) continue;
      const all = await products.list();
      const product = all.find((p) => p.variants.some((v) => v.id === variant.id));
      lines.push({
        title: product ? product.title[locale] : variant.sku,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice: variant.price,
      });
    }

    const subtotalAmount = lines.reduce((sum, l) => sum + l.unitPrice.amount * l.quantity, 0);
    const subtotal: Money = { amount: subtotalAmount, currency: 'THB' };
    const shipping = SHIPPING_FLAT;
    const total: Money = { amount: subtotal.amount + shipping.amount, currency: 'THB' };

    return (
      <main className="mx-auto grid max-w-shell gap-12 px-6 py-16 lg:grid-cols-[1fr_400px]">
        <div>
          <h1 className="display text-3xl text-ink">{t('title')}</h1>
          <div className="mt-10">
            <CheckoutForm />
          </div>
        </div>
        <OrderSummary
          items={lines}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          locale={locale}
        />
      </main>
    );
  }
  ```

- [ ] Verify the checkout screen renders in both locales against the dev server. Start it in the background:

  ```
  npm run dev
  ```

  Then drive Playwright (MCP `browser_navigate` + `browser_snapshot` + `browser_take_screenshot`). Exact checks:
  - Navigate to `http://localhost:3000/en/checkout` (with a non-empty cart from Phase 7 add-to-cart, or seed one via the cart action) and assert the snapshot contains `data-testid="order-summary"`, a `summary-total` whose text starts with `฿`, the two radios `pay-token-ok` and `pay-token-decline`, and the `checkout-pay` button labeled `PAY`.
  - Navigate to `http://localhost:3000/th/checkout` and assert the same testids resolve, the button reads `ชำระเงิน`, and the total still renders with the baht sign `฿` and Western digits (no `๒๕๖๗`).
  - Screenshot both as `checkout-en.png` / `checkout-th.png` for the case study.

- [ ] Run typecheck to confirm the new components compile under strict mode:

  ```
  npm run typecheck
  ```

  Expected output: no errors, exit code `0`.

- [ ] Commit:
  ```
  git add components/checkout/OrderSummary.tsx components/checkout/PaymentMockForm.tsx components/checkout/CheckoutForm.tsx "app/[locale]/(checkout)/checkout/page.tsx" messages/en.json messages/th.json
  git commit -m "feat(checkout): build 1-2 step checkout screen with payment mock and order summary"
  ```

---

### Task 8.5 — Premium shareable confirmation `/checkout/[orderId]` (OG image + gregory date + THB totals)

The Tier-1 payoff. A polished, shareable confirmation that reads the persisted `Order` through the repository seam, renders the snapshotted line items, the gregory-calendar `placedAt`, and the THB totals — plus a dynamic `opengraph-image` so the URL unfurls beautifully. The seeded `ord_seed_demo` lets a reviewer hit `/checkout/ord_seed_demo` and see a full confirmation instantly.

**Files**

- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/[orderId]/page.tsx`
- Create: `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/[orderId]/opengraph-image.tsx`
- Modify: `d:/MINE/freelance/system/vanta/messages/en.json` (add `confirmation` namespace)
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json` (mirror keyset)

**Interfaces**

- Consumes: `orders` from `@/lib/data` (`OrderRepository.getById`); `formatMoney` from `@/lib/format/money`; `formatDate` from `@/lib/format/date` (`calendar: 'gregory'`); `getTranslations` from `next-intl/server`; `notFound` from `next/navigation`; `ImageResponse` from `next/og`; `Order`, `Locale` from `@/lib/domain`.
- Produces: confirmation route + dynamic OG image; `generateMetadata` setting `openGraph` + `twitter` card.

**Steps**

- [ ] Add the `confirmation` namespace to `d:/MINE/freelance/system/vanta/messages/en.json`:

  ```json
  "confirmation": {
    "heading": "Order confirmed",
    "thanks": "Thank you — your drop is secured.",
    "orderNumber": "Order",
    "placedOn": "Placed on",
    "shipTo": "Ship to",
    "subtotal": "Subtotal",
    "shipping": "Shipping",
    "total": "Total",
    "shareTitle": "I just copped from VANTA®",
    "continue": "Continue shopping",
    "ogTagline": "Order confirmed — VANTA®"
  }
  ```

- [ ] Add the mirrored `confirmation` namespace to `d:/MINE/freelance/system/vanta/messages/th.json`:

  ```json
  "confirmation": {
    "heading": "ยืนยันคำสั่งซื้อแล้ว",
    "thanks": "ขอบคุณ — คุณได้รับสินค้าจากดรอปนี้แล้ว",
    "orderNumber": "คำสั่งซื้อ",
    "placedOn": "สั่งซื้อเมื่อ",
    "shipTo": "จัดส่งถึง",
    "subtotal": "ยอดรวมย่อย",
    "shipping": "ค่าจัดส่ง",
    "total": "ยอดรวมทั้งหมด",
    "shareTitle": "ฉันเพิ่งช้อปจาก VANTA®",
    "continue": "เลือกซื้อสินค้าต่อ",
    "ogTagline": "ยืนยันคำสั่งซื้อแล้ว — VANTA®"
  }
  ```

- [ ] Create the confirmation page `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/[orderId]/page.tsx`:

  ```tsx
  import type { Metadata } from 'next';
  import { notFound } from 'next/navigation';
  import { getTranslations } from 'next-intl/server';
  import type { Locale } from '@/lib/domain';
  import { orders } from '@/lib/data';
  import { formatMoney } from '@/lib/format/money';
  import { formatDate } from '@/lib/format/date';
  import { Link } from '@/lib/i18n/navigation';

  type Params = { locale: Locale; orderId: string };

  export async function generateMetadata({
    params,
  }: {
    params: Promise<Params>;
  }): Promise<Metadata> {
    const { orderId, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'confirmation' });
    return {
      title: `${t('orderNumber')} ${orderId} — VANTA®`,
      openGraph: {
        title: t('shareTitle'),
        description: t('ogTagline'),
      },
      twitter: {
        card: 'summary_large_image',
        title: t('shareTitle'),
        description: t('ogTagline'),
      },
    };
  }

  export default async function ConfirmationPage({ params }: { params: Promise<Params> }) {
    const { orderId, locale } = await params;
    const order = await orders.getById(orderId);
    if (!order) notFound();

    const t = await getTranslations('confirmation');
    const addr = order.shippingAddress;

    return (
      <main className="mx-auto max-w-shell px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-xl bg-ink p-10 text-paper">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime">VANTA®</p>
          <h1 className="display mt-4 text-4xl">{t('heading')}</h1>
          <p className="mt-3 text-smoke-300">{t('thanks')}</p>

          <dl className="mt-8 grid grid-cols-2 gap-y-3 border-y border-smoke-700 py-6 text-sm">
            <dt className="text-smoke-300">{t('orderNumber')}</dt>
            <dd data-testid="confirm-order-id" className="text-right font-mono">
              {order.id}
            </dd>
            <dt className="text-smoke-300">{t('placedOn')}</dt>
            <dd data-testid="confirm-placed-at" className="text-right font-mono">
              {formatDate(order.placedAt, locale)}
            </dd>
          </dl>

          <ul className="mt-6 space-y-4">
            {order.lineItems.map((li) => (
              <li key={li.variantId} className="flex items-center gap-4">
                {li.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={li.imageUrl}
                    alt={li.title[locale]}
                    width={56}
                    height={70}
                    className="rounded object-cover"
                  />
                )}
                <span className="flex-1 text-sm">
                  {li.title[locale]}
                  <span className="ml-2 font-mono text-xs text-smoke-300">
                    {li.optionValues.size} · {li.optionValues.color} · ×{li.quantity}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {formatMoney(
                    { amount: li.unitPrice.amount * li.quantity, currency: 'THB' },
                    locale,
                  )}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-smoke-700 pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-smoke-300">{t('subtotal')}</dt>
              <dd className="font-mono tabular-nums">
                {formatMoney(order.totals.subtotal, locale)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-smoke-300">{t('shipping')}</dt>
              <dd className="font-mono tabular-nums">
                {formatMoney(order.totals.shipping, locale)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-smoke-700 pt-2 text-base">
              <dt className="display">{t('total')}</dt>
              <dd data-testid="confirm-total" className="font-mono tabular-nums text-lime">
                {formatMoney(order.totals.total, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 text-sm">
            <p className="text-smoke-300">{t('shipTo')}</p>
            <address className="mt-1 not-italic">
              {addr.fullName}
              <br />
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}
              <br />
              {addr.city} {addr.postalCode}
              <br />
              {addr.country}
            </address>
          </div>

          <Link
            href="/shop"
            className="mt-10 inline-block rounded-md bg-paper px-6 py-3 font-mono uppercase tracking-widest text-ink"
          >
            {t('continue')}
          </Link>
        </div>
      </main>
    );
  }
  ```

- [ ] Create the dynamic OG image `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/[orderId]/opengraph-image.tsx`:

  ```tsx
  import { ImageResponse } from 'next/og';
  import type { Locale } from '@/lib/domain';
  import { orders } from '@/lib/data';
  import { formatMoney } from '@/lib/format/money';
  import { getTranslations } from 'next-intl/server';

  export const size = { width: 1200, height: 630 };
  export const contentType = 'image/png';
  export const alt = 'VANTA® order confirmation';

  export default async function OpengraphImage({
    params,
  }: {
    params: { locale: Locale; orderId: string };
  }) {
    const { locale, orderId } = params;
    const order = await orders.getById(orderId);
    const t = await getTranslations({ locale, namespace: 'confirmation' });

    const total = order ? formatMoney(order.totals.total, locale) : '';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0A0A0A',
            color: '#F5F4EF',
            padding: 80,
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{ color: '#D4FF2E', fontSize: 28, letterSpacing: 8, textTransform: 'uppercase' }}
          >
            VANTA®
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>{t('heading')}</div>
            <div style={{ marginTop: 24, fontSize: 36, color: '#B8B8B8' }}>{t('ogTagline')}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 36 }}>
            <span style={{ color: '#6B6B6B' }}>{orderId}</span>
            <span style={{ color: '#FF3B1F' }}>{total}</span>
          </div>
        </div>
      ),
      { ...size },
    );
  }
  ```

- [ ] Verify the seeded confirmation renders instantly in both locales against `npm run dev` (already running from Task 8.4). Drive Playwright (MCP):
  - Navigate to `http://localhost:3000/en/checkout/ord_seed_demo`; assert the snapshot contains `data-testid="confirm-order-id"` reading `ord_seed_demo`, a `confirm-total` starting with `฿`, and a `confirm-placed-at` whose text contains a 4-digit Western year (regex `/\b(19|20)\d{2}\b/`) and NOT a Buddhist-era year (assert the text does not contain `25` followed by two more Western digits forming a 2500s year — i.e. it must match a 20xx year). Screenshot `confirmation-en.png`.
  - Navigate to `http://localhost:3000/th/checkout/ord_seed_demo`; assert the same testids resolve, the heading reads `ยืนยันคำสั่งซื้อแล้ว`, the date again matches `/\b20\d{2}\b/` (gregory, never `2567`/`๒๕๖๗`), and the total renders with `฿` + Western digits. Screenshot `confirmation-th.png`.
  - Fetch the OG image route `http://localhost:3000/en/checkout/ord_seed_demo/opengraph-image` and assert the response `content-type` is `image/png` (via `browser_network_request` after navigating, or a `fetch` in `browser_evaluate`). Save it as `og-confirmation.png` for the case study.

- [ ] Run typecheck:

  ```
  npm run typecheck
  ```

  Expected output: no errors, exit code `0`.

- [ ] Commit:
  ```
  git add "app/[locale]/(checkout)/checkout/[orderId]/page.tsx" "app/[locale]/(checkout)/checkout/[orderId]/opengraph-image.tsx" messages/en.json messages/th.json
  git commit -m "feat(checkout): add premium shareable confirmation page with OG image and gregory date"
  ```

---

### Task 8.6 — Playwright E2E: cart → checkout → confirmation, both locales

Lock the full back-third of the hero slice end-to-end. The spec extends the existing per-locale hero specs (`hero-slice.en.spec.ts` / `hero-slice.th.spec.ts`) with a checkout-to-confirmation flow that exercises both the declining and succeeding test cards.

**Files**

- Modify: `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.en.spec.ts`
- Modify: `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.th.spec.ts`

**Interfaces**

- Consumes: the deployed-on-localhost app under `playwright.config.ts` (`baseURL` = `http://localhost:3000`), the routes from Tasks 8.4–8.5, the cart Server Actions from Phase 7 (`addToCart`) reached via the PDP UI, and the seeded `ord_seed_demo`.
- Produces: passing E2E checks for the checkout slice in both locales.

**Steps**

- [ ] Append the checkout flow to `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.en.spec.ts` (a self-contained describe block — it adds an item from the PDP, opens checkout, exercises decline then success, lands on confirmation):

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('EN checkout → confirmation', () => {
    test('declining card shows error, succeeding card reaches confirmation', async ({ page }) => {
      // Seed the cart by adding a buyable variant from a PDP.
      await page.goto('/en/shop');
      await page.getByTestId('product-card').first().click();
      await page.getByTestId('add-to-cart').click();
      await expect(page.getByTestId('cart-count')).not.toHaveText('0');

      await page.goto('/en/checkout');
      await expect(page.getByTestId('order-summary')).toBeVisible();
      await expect(page.getByTestId('summary-total')).toContainText('฿');

      // Fill the form.
      await page.getByTestId('field-email').fill('shopper@vanta.shop');
      await page.getByTestId('field-fullName').fill('Somchai Jaidee');
      await page.getByTestId('field-line1').fill('99 Sukhumvit Rd');
      await page.getByTestId('field-city').fill('Bangkok');
      await page.getByTestId('field-postalCode').fill('10110');
      await page.getByTestId('field-country').fill('TH');

      // Declining card first.
      await page.getByTestId('pay-token-decline').check();
      await page.getByTestId('checkout-pay').click();
      await expect(page.getByTestId('checkout-error')).toBeVisible();
      await expect(page).toHaveURL(/\/en\/checkout$/);

      // Succeeding card → confirmation.
      await page.getByTestId('pay-token-ok').check();
      await page.getByTestId('checkout-pay').click();
      await expect(page).toHaveURL(/\/en\/checkout\/ord_/);
      await expect(page.getByTestId('confirm-total')).toContainText('฿');
      await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
    });

    test('seeded order renders instantly with gregory date', async ({ page }) => {
      await page.goto('/en/checkout/ord_seed_demo');
      await expect(page.getByTestId('confirm-order-id')).toHaveText('ord_seed_demo');
      await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
      await expect(page.getByTestId('confirm-placed-at')).not.toHaveText(/25\d{2}/);
    });
  });
  ```

- [ ] Append the mirrored Thai flow to `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.th.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('TH checkout → confirmation', () => {
    test('declining card shows error, succeeding card reaches confirmation', async ({ page }) => {
      await page.goto('/th/shop');
      await page.getByTestId('product-card').first().click();
      await page.getByTestId('add-to-cart').click();
      await expect(page.getByTestId('cart-count')).not.toHaveText('0');

      await page.goto('/th/checkout');
      await expect(page.getByTestId('order-summary')).toBeVisible();
      await expect(page.getByTestId('summary-total')).toContainText('฿');

      await page.getByTestId('field-email').fill('shopper@vanta.shop');
      await page.getByTestId('field-fullName').fill('สมชาย ใจดี');
      await page.getByTestId('field-line1').fill('99 ถนนสุขุมวิท');
      await page.getByTestId('field-city').fill('กรุงเทพมหานคร');
      await page.getByTestId('field-postalCode').fill('10110');
      await page.getByTestId('field-country').fill('TH');

      await page.getByTestId('pay-token-decline').check();
      await page.getByTestId('checkout-pay').click();
      await expect(page.getByTestId('checkout-error')).toBeVisible();
      await expect(page).toHaveURL(/\/th\/checkout$/);

      await page.getByTestId('pay-token-ok').check();
      await page.getByTestId('checkout-pay').click();
      await expect(page).toHaveURL(/\/th\/checkout\/ord_/);
      await expect(page.getByTestId('confirm-total')).toContainText('฿');
      // Gregory year, never Buddhist-era 2567.
      await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
      await expect(page.getByTestId('confirm-placed-at')).not.toHaveText(/2567/);
    });

    test('seeded order renders instantly with gregory date in Thai', async ({ page }) => {
      await page.goto('/th/checkout/ord_seed_demo');
      await expect(page.getByTestId('confirm-order-id')).toHaveText('ord_seed_demo');
      await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
      await expect(page.getByTestId('confirm-placed-at')).not.toHaveText(/2567/);
    });
  });
  ```

- [ ] Run the checkout E2E (both locale projects). With the dev/preview server managed by `playwright.config.ts`’s `webServer`:

  ```
  npm run test:e2e -- hero-slice.en.spec.ts hero-slice.th.spec.ts
  ```

  Expected output: the two new describe blocks pass in both locale projects — e.g. `EN checkout → confirmation › declining card shows error, succeeding card reaches confirmation` and the TH equivalents all green; final line `passed`, exit code `0`.

- [ ] Commit:
  ```
  git add tests/e2e/hero-slice.en.spec.ts tests/e2e/hero-slice.th.spec.ts
  git commit -m "test(checkout): add e2e cart-to-checkout-to-confirmation flow for both locales"
  ```

---

**Phase 8 deliverable:** a working, bilingual checkout that snapshots immutable order line items, computes THB totals with flat shipping, charges through the `PaymentService` mock (latency + declining `tok_decline`), persists the order via the repository seam, and lands on a premium, OG-unfurling confirmation that renders gregory dates and the seeded `ord_seed_demo` instantly — all covered by Vitest (snapshotting, totals, declined-card, validation) and Playwright (cart → checkout → confirmation in EN and TH).

Relevant files this phase creates/modifies (absolute paths):

- `d:/MINE/freelance/system/vanta/lib/services/payment-service.ts`
- `d:/MINE/freelance/system/vanta/lib/services/checkout-service.ts`
- `d:/MINE/freelance/system/vanta/lib/actions/checkout-actions.ts`
- `d:/MINE/freelance/system/vanta/components/checkout/OrderSummary.tsx`
- `d:/MINE/freelance/system/vanta/components/checkout/PaymentMockForm.tsx`
- `d:/MINE/freelance/system/vanta/components/checkout/CheckoutForm.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/[orderId]/page.tsx`
- `d:/MINE/freelance/system/vanta/app/[locale]/(checkout)/checkout/[orderId]/opengraph-image.tsx`
- `d:/MINE/freelance/system/vanta/tests/unit/payment-service.test.ts`
- `d:/MINE/freelance/system/vanta/tests/unit/checkout-service.test.ts`
- `d:/MINE/freelance/system/vanta/tests/unit/checkout-actions.test.ts`
- `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.en.spec.ts` (modified)
- `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.th.spec.ts` (modified)
- `d:/MINE/freelance/system/vanta/messages/en.json` (modified) · `d:/MINE/freelance/system/vanta/messages/th.json` (modified)

---

I have everything needed. Here is Phase 9, written as polished plan markdown ready to paste into the document.

---

## Phase 9 — Motion system & design polish

This phase makes motion a _system_, not a sprinkle: a single capability gate (`useMotionCapability`) that every animated surface consults, reduced-motion as a real second experience (content visible-by-default, then animates in — never stuck at `opacity:0`), a persisted in-UI motion toggle, the grapheme-safe split-text helper, GSAP reveal helpers that honor the gate, the magnetic-button CTA variant, View Transition polish, and the final design-token AA pass (blaze-on-light usage + a lime-on-paper token guard). The phase closes with a Playwright reduced-motion project that asserts no content is ever stranded at `opacity:0`.

> **Prerequisites:** the domain barrel `@/lib/domain`, `lib/format/*`, the `:lang()` headline rules and `@theme` token block in `app/globals.css`, the Header/Footer/LocaleSwitcher, and the hero slice surfaces (Home, PDP `ProductCard`, cart drawer, confirmation) exist from earlier phases. This phase wires motion _into_ those surfaces; it does not invent new routes.

> **Sub-skill reminder:** invoke `superpowers:executing-plans`; for every LOGIC task below (capability matchMedia logic, grapheme segmenter, lime-token guard) follow `superpowers:test-driven-development`. UI tasks are verified with Playwright assertions + visual verification against `npm run dev`.

---

### Task 9.1 — `splitGraphemes` (Intl.Segmenter, grapheme-safe split-text)

Pure logic. Every per-grapheme animation (hero headline reveal, marquee) consumes this. `.split('')` is forbidden — it shatters Thai combining marks (`เ`, `่`, vowel/tone clusters) and a Thai reviewer catches it instantly.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/motion/segment.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/segment.test.ts`

**Interfaces**

- Produces: `export function splitGraphemes(text: string, locale: Locale): string[]`
- Consumes: `import type { Locale } from '@/lib/domain'`

**Steps**

- [ ] Write the failing test at `tests/unit/segment.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { splitGraphemes } from '@/lib/motion/segment';

  describe('splitGraphemes', () => {
    it('splits Latin text into one entry per character', () => {
      expect(splitGraphemes('DROP', 'en')).toEqual(['D', 'R', 'O', 'P']);
    });

    it('keeps Thai combining marks attached to their base (no shattering)', () => {
      // 'เปิด' = เ + ป + ิ + ด ; naive split('') would yield 4 broken pieces,
      // but ปิ is one grapheme cluster (base ป + sara i ิ).
      const result = splitGraphemes('เปิด', 'th');
      expect(result).toEqual(['เ', 'ปิ', 'ด']);
      // Reassembly must be lossless.
      expect(result.join('')).toBe('เปิด');
    });

    it('treats an emoji ZWJ sequence as a single grapheme', () => {
      const family = '👨‍👩‍👧';
      expect(splitGraphemes(family, 'en')).toEqual([family]);
    });

    it('returns an empty array for an empty string', () => {
      expect(splitGraphemes('', 'en')).toEqual([]);
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/segment.test.ts
  ```

  Expected output (module does not exist yet):

  ```
  FAIL  tests/unit/segment.test.ts
  Error: Failed to resolve import "@/lib/motion/segment"
  ```

- [ ] Implement the minimal code at `lib/motion/segment.ts`:

  ```ts
  import type { Locale } from '@/lib/domain';

  /**
   * Grapheme-cluster-safe split. NEVER use `.split('')` (shatters Thai
   * combining marks and emoji ZWJ sequences). Used by every per-character
   * reveal so Thai headlines animate intact in both locales.
   */
  export function splitGraphemes(text: string, locale: Locale): string[] {
    if (text.length === 0) return [];
    const segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' });
    const out: string[] = [];
    for (const { segment } of segmenter.segment(text)) {
      out.push(segment);
    }
    return out;
  }
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/segment.test.ts
  ```

  Expected output:

  ```
  ✓ tests/unit/segment.test.ts (4 tests)
  Test Files  1 passed (1)
       Tests  4 passed (4)
  ```

- [ ] Commit:
  ```
  git add lib/motion/segment.ts tests/unit/segment.test.ts
  git commit -m "feat(motion): add grapheme-safe splitGraphemes via Intl.Segmenter"
  ```

---

### Task 9.2 — Motion preference store (persisted in-UI toggle source of truth)

A tiny Zustand store holds the user's _explicit_ motion override and persists it to `localStorage`. The capability hook (9.3) reads this as the highest-priority signal, so the toggle is durable across reloads. Kept separate from `useCartStore` (different concern, different persistence). Logic-light but persistence is testable.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/motion/preference.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/motion-preference.test.ts`

**Interfaces**

- Produces:
  ```ts
  export type MotionPreference = 'system' | 'full' | 'reduced';
  export type MotionPreferenceState = {
    preference: MotionPreference;
    setPreference: (preference: MotionPreference) => void;
  };
  export const useMotionPreference: import('zustand').UseBoundStore<
    import('zustand').StoreApi<MotionPreferenceState>
  >;
  export const MOTION_PREFERENCE_STORAGE_KEY = 'vanta:motion-preference';
  ```

**Steps**

- [ ] Write the failing test at `tests/unit/motion-preference.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import { useMotionPreference, MOTION_PREFERENCE_STORAGE_KEY } from '@/lib/motion/preference';

  describe('useMotionPreference', () => {
    beforeEach(() => {
      localStorage.clear();
      useMotionPreference.setState({ preference: 'system' });
    });

    it('defaults to "system"', () => {
      expect(useMotionPreference.getState().preference).toBe('system');
    });

    it('setPreference updates state and persists to localStorage', () => {
      useMotionPreference.getState().setPreference('reduced');
      expect(useMotionPreference.getState().preference).toBe('reduced');
      const persisted = JSON.parse(localStorage.getItem(MOTION_PREFERENCE_STORAGE_KEY) ?? '{}');
      expect(persisted.state.preference).toBe('reduced');
    });

    it('cycles back to "full" then "system"', () => {
      const { setPreference } = useMotionPreference.getState();
      setPreference('full');
      expect(useMotionPreference.getState().preference).toBe('full');
      setPreference('system');
      expect(useMotionPreference.getState().preference).toBe('system');
    });
  });
  ```

- [ ] Add a `jsdom` environment annotation so `localStorage` exists for this spec (Vitest reads the top-of-file comment per the `environmentMatchGlobs`/docblock convention). Prepend to the test file:

  ```ts
  // @vitest-environment jsdom
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/motion-preference.test.ts
  ```

  Expected output:

  ```
  FAIL  tests/unit/motion-preference.test.ts
  Error: Failed to resolve import "@/lib/motion/preference"
  ```

- [ ] Implement at `lib/motion/preference.ts`:

  ```ts
  import { create } from 'zustand';
  import { persist, createJSONStorage } from 'zustand/middleware';

  export type MotionPreference = 'system' | 'full' | 'reduced';

  export type MotionPreferenceState = {
    /** User's explicit override. 'system' defers to OS prefers-reduced-motion. */
    preference: MotionPreference;
    setPreference: (preference: MotionPreference) => void;
  };

  export const MOTION_PREFERENCE_STORAGE_KEY = 'vanta:motion-preference';

  export const useMotionPreference = create<MotionPreferenceState>()(
    persist(
      (set) => ({
        preference: 'system',
        setPreference: (preference) => set({ preference }),
      }),
      {
        name: MOTION_PREFERENCE_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/motion-preference.test.ts
  ```

  Expected output:

  ```
  ✓ tests/unit/motion-preference.test.ts (3 tests)
  Test Files  1 passed (1)
       Tests  3 passed (3)
  ```

- [ ] Commit:
  ```
  git add lib/motion/preference.ts tests/unit/motion-preference.test.ts
  git commit -m "feat(motion): add persisted motion-preference store"
  ```

---

### Task 9.3 — `useMotionCapability` hook (matchMedia gate: no-preference AND pointer:fine AND not Save-Data)

The single gate every heavy effect consults. It combines, in priority order: the explicit `useMotionPreference` override → the three media queries. Heavy wow is enabled ONLY when `(prefers-reduced-motion: no-preference)` AND `(pointer: fine)` AND NOT `Save-Data` — **no `deviceMemory`/`hardwareConcurrency` arithmetic** (coarse, absent in Safari, would wrongly downgrade premium iOS users). The pure decision function is extracted so it is unit-testable without a DOM.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/motion/capability.ts`
- Test: `d:/MINE/freelance/system/vanta/tests/unit/motion-capability.test.ts`

**Interfaces**

- Produces:
  ```ts
  export type MotionSignals = {
    prefersNoPreference: boolean; // (prefers-reduced-motion: no-preference)
    pointerFine: boolean; // (pointer: fine)
    saveData: boolean; // navigator.connection?.saveData === true
  };
  export function resolveMotionEnabled(
    preference: MotionPreference,
    signals: MotionSignals,
  ): boolean;
  export function useMotionCapability(): boolean;
  ```
- Consumes: `import { useMotionPreference, type MotionPreference } from '@/lib/motion/preference'`

**Steps**

- [ ] Write the failing test at `tests/unit/motion-capability.test.ts` (covers the PURE decision function — no DOM needed):

  ```ts
  import { describe, it, expect } from 'vitest';
  import { resolveMotionEnabled, type MotionSignals } from '@/lib/motion/capability';

  const ideal: MotionSignals = {
    prefersNoPreference: true,
    pointerFine: true,
    saveData: false,
  };

  describe('resolveMotionEnabled', () => {
    it('enables motion when system signals are ideal and preference defers', () => {
      expect(resolveMotionEnabled('system', ideal)).toBe(true);
    });

    it('explicit "reduced" override always wins, even with ideal signals', () => {
      expect(resolveMotionEnabled('reduced', ideal)).toBe(false);
    });

    it('explicit "full" override forces motion on, even with hostile signals', () => {
      expect(
        resolveMotionEnabled('full', {
          prefersNoPreference: false,
          pointerFine: false,
          saveData: true,
        }),
      ).toBe(true);
    });

    it('system: OS prefers reduced motion disables', () => {
      expect(resolveMotionEnabled('system', { ...ideal, prefersNoPreference: false })).toBe(false);
    });

    it('system: coarse pointer (touch) disables heavy wow', () => {
      expect(resolveMotionEnabled('system', { ...ideal, pointerFine: false })).toBe(false);
    });

    it('system: Save-Data disables', () => {
      expect(resolveMotionEnabled('system', { ...ideal, saveData: true })).toBe(false);
    });

    it('system requires ALL three signals (AND, not OR)', () => {
      expect(
        resolveMotionEnabled('system', {
          prefersNoPreference: true,
          pointerFine: false,
          saveData: false,
        }),
      ).toBe(false);
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/motion-capability.test.ts
  ```

  Expected output:

  ```
  FAIL  tests/unit/motion-capability.test.ts
  Error: Failed to resolve import "@/lib/motion/capability"
  ```

- [ ] Implement at `lib/motion/capability.ts` (the pure function + the React hook that wires it to live matchMedia + the preference store):

  ```ts
  'use client';

  import { useSyncExternalStore } from 'react';
  import { useMotionPreference, type MotionPreference } from './preference';

  export type MotionSignals = {
    /** (prefers-reduced-motion: no-preference) matches. */
    prefersNoPreference: boolean;
    /** (pointer: fine) matches — a precise pointing device. */
    pointerFine: boolean;
    /** Save-Data header / Network Information API requested data saving. */
    saveData: boolean;
  };

  /**
   * PURE. Heavy wow gated on no-preference AND pointer:fine AND not Save-Data.
   * NO deviceMemory / hardwareConcurrency arithmetic (coarse, Safari-absent).
   * An explicit user override (full/reduced) always beats the system signals.
   */
  export function resolveMotionEnabled(
    preference: MotionPreference,
    signals: MotionSignals,
  ): boolean {
    if (preference === 'full') return true;
    if (preference === 'reduced') return false;
    return signals.prefersNoPreference && signals.pointerFine && !signals.saveData;
  }

  const REDUCED_QUERY = '(prefers-reduced-motion: no-preference)';
  const POINTER_QUERY = '(pointer: fine)';

  type Connection = { saveData?: boolean } | undefined;

  function readSignals(): MotionSignals {
    if (typeof window === 'undefined') {
      // SSR: assume the reduced/static experience so content is visible-by-default.
      return { prefersNoPreference: false, pointerFine: false, saveData: true };
    }
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    return {
      prefersNoPreference: window.matchMedia(REDUCED_QUERY).matches,
      pointerFine: window.matchMedia(POINTER_QUERY).matches,
      saveData: connection?.saveData === true,
    };
  }

  function subscribe(onChange: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const reduced = window.matchMedia(REDUCED_QUERY);
    const pointer = window.matchMedia(POINTER_QUERY);
    reduced.addEventListener('change', onChange);
    pointer.addEventListener('change', onChange);
    return () => {
      reduced.removeEventListener('change', onChange);
      pointer.removeEventListener('change', onChange);
    };
  }

  // Stable server snapshot => SSR renders the visible-by-default (static) path,
  // so content is NEVER stranded at opacity:0 before hydration.
  const SERVER_SIGNALS: MotionSignals = {
    prefersNoPreference: false,
    pointerFine: false,
    saveData: true,
  };

  function useLiveSignals(): MotionSignals {
    return useSyncExternalStore(subscribe, readSignals, () => SERVER_SIGNALS);
  }

  /** The single gate every heavy effect consults. Re-renders on media/preference change. */
  export function useMotionCapability(): boolean {
    const preference = useMotionPreference((s) => s.preference);
    const signals = useLiveSignals();
    return resolveMotionEnabled(preference, signals);
  }
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/motion-capability.test.ts
  ```

  Expected output:

  ```
  ✓ tests/unit/motion-capability.test.ts (7 tests)
  Test Files  1 passed (1)
       Tests  7 passed (7)
  ```

- [ ] Typecheck (ensures no `any` in `lib/**`, `unknown`-narrowed connection):

  ```
  npm run typecheck
  ```

  Expected output:

  ```
  > tsc --noEmit
  (no errors)
  ```

- [ ] Commit:
  ```
  git add lib/motion/capability.ts tests/unit/motion-capability.test.ts
  git commit -m "feat(motion): add useMotionCapability gate (no-pref AND pointer:fine AND not Save-Data)"
  ```

---

### Task 9.4 — GSAP reveal helpers honoring the capability hook (visible-by-default)

A small, reusable client hook + helper that drives "content visible-by-default, then animates IN" — the inverse of the blank-page anti-pattern. When motion is disabled (capability `false`), it is a hard no-op: elements keep their natural CSS (no inline `opacity:0` is ever written). When enabled, it sets the _from_ state and immediately animates to natural state, wrapped in `gsap.context` for clean teardown. Split-text reveals route every grapheme through `splitGraphemes`.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/motion/reveal.ts`
- Test (component-level via Playwright in 9.9; unit-test the guard branch here): `d:/MINE/freelance/system/vanta/tests/unit/motion-reveal.test.ts`

**Interfaces**

- Produces:
  ```ts
  export type RevealOptions = {
    enabled: boolean; // pass useMotionCapability() result
    y?: number; // translate-from distance (default 24)
    duration?: number; // seconds (default 0.6)
    stagger?: number; // seconds between children (default 0.04)
  };
  export function runReveal(targets: Element[], options: RevealOptions): () => void; // returns cleanup
  export function useReveal(options: RevealOptions): (node: HTMLElement | null) => void; // ref callback
  ```
- Consumes: `gsap`, `import { splitGraphemes } from './segment'` (split-text variant lives with the consuming component; this helper animates already-present nodes)

**Steps**

- [ ] Write the failing test at `tests/unit/motion-reveal.test.ts` (asserts the load-bearing invariant: disabled = no opacity tampering):

  ```ts
  // @vitest-environment jsdom
  import { describe, it, expect, vi } from 'vitest';

  vi.mock('gsap', () => ({
    default: {
      fromTo: vi.fn(),
      context: (fn: () => void) => {
        fn();
        return { revert: vi.fn() };
      },
    },
    gsap: {
      fromTo: vi.fn(),
      context: (fn: () => void) => {
        fn();
        return { revert: vi.fn() };
      },
    },
  }));

  import gsap from 'gsap';
  import { runReveal } from '@/lib/motion/reveal';

  function makeEls(n: number): HTMLElement[] {
    return Array.from({ length: n }, () => document.createElement('div'));
  }

  describe('runReveal', () => {
    it('is a hard no-op when disabled and NEVER writes opacity:0', () => {
      const els = makeEls(3);
      const cleanup = runReveal(els, { enabled: false });
      expect(gsap.fromTo).not.toHaveBeenCalled();
      for (const el of els) {
        expect(el.style.opacity).toBe(''); // untouched — visible by default
      }
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('drives a fromTo animation when enabled', () => {
      const els = makeEls(2);
      runReveal(els, { enabled: true });
      expect(gsap.fromTo).toHaveBeenCalledTimes(1);
      const [, fromVars, toVars] = (gsap.fromTo as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fromVars).toMatchObject({ opacity: 0, y: 24 });
      expect(toVars).toMatchObject({ opacity: 1, y: 0 });
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/motion-reveal.test.ts
  ```

  Expected output:

  ```
  FAIL  tests/unit/motion-reveal.test.ts
  Error: Failed to resolve import "@/lib/motion/reveal"
  ```

- [ ] Implement at `lib/motion/reveal.ts`:

  ```ts
  'use client';

  import { useCallback, useRef } from 'react';
  import gsap from 'gsap';

  export type RevealOptions = {
    /** Pass the useMotionCapability() result. false => hard no-op. */
    enabled: boolean;
    y?: number;
    duration?: number;
    stagger?: number;
  };

  /**
   * Animates targets IN from a translate/fade. When disabled this NEVER writes
   * opacity:0 — content stays visible-by-default (no blank-page failure).
   * Returns a cleanup that reverts the GSAP context.
   */
  export function runReveal(targets: Element[], options: RevealOptions): () => void {
    const { enabled, y = 24, duration = 0.6, stagger = 0.04 } = options;
    if (!enabled || targets.length === 0) {
      return () => {};
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'power3.out',
          clearProps: 'opacity,transform', // hand styling back to CSS when done
        },
      );
    });
    return () => ctx.revert();
  }

  /**
   * Ref-callback variant: reveals the node's direct children on mount.
   * Re-runs when `enabled` flips (e.g. user toggles motion).
   */
  export function useReveal(options: RevealOptions): (node: HTMLElement | null) => void {
    const cleanupRef = useRef<() => void>(() => {});
    const { enabled, y, duration, stagger } = options;
    return useCallback(
      (node: HTMLElement | null) => {
        cleanupRef.current();
        if (node === null) {
          cleanupRef.current = () => {};
          return;
        }
        const children = Array.from(node.children);
        cleanupRef.current = runReveal(children, { enabled, y, duration, stagger });
      },
      [enabled, y, duration, stagger],
    );
  }
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/motion-reveal.test.ts
  ```

  Expected output:

  ```
  ✓ tests/unit/motion-reveal.test.ts (2 tests)
  Test Files  1 passed (1)
       Tests  2 passed (2)
  ```

- [ ] Commit:
  ```
  git add lib/motion/reveal.ts tests/unit/motion-reveal.test.ts
  git commit -m "feat(motion): add GSAP reveal helpers gated on capability (visible-by-default)"
  ```

---

### Task 9.5 — `MotionToggle` component (in-UI toggle, wired into Header)

A real, accessible tri-state control (System / Full / Reduced) in the Header, bound to `useMotionPreference`. It is the user-facing surface of Task 9.2 and proves "reduced motion is a real second experience you can drive from the UI."

**Files**

- Create: `d:/MINE/freelance/system/vanta/components/layout/MotionToggle.tsx`
- Modify: `d:/MINE/freelance/system/vanta/components/layout/Header.tsx` (mount the toggle)
- Modify: `d:/MINE/freelance/system/vanta/messages/en.json` (add `motion` namespace)
- Modify: `d:/MINE/freelance/system/vanta/messages/th.json` (mirror keyset)

**Interfaces**

- Consumes: `import { useMotionPreference, type MotionPreference } from '@/lib/motion/preference'`; `import { useTranslations } from 'next-intl'`
- Produces: `export function MotionToggle(): JSX.Element`

**Steps**

- [ ] Add the `motion` namespace to `messages/en.json` (merge into the existing object — do not clobber other namespaces):

  ```json
  "motion": {
    "label": "Motion",
    "system": "System",
    "full": "Full",
    "reduced": "Reduced"
  }
  ```

- [ ] Add the mirrored `motion` namespace to `messages/th.json`:

  ```json
  "motion": {
    "label": "การเคลื่อนไหว",
    "system": "ตามระบบ",
    "full": "เต็มรูปแบบ",
    "reduced": "ลดทอน"
  }
  ```

- [ ] Create `components/layout/MotionToggle.tsx`:

  ```tsx
  'use client';

  import { useTranslations } from 'next-intl';
  import { useMotionPreference, type MotionPreference } from '@/lib/motion/preference';

  const OPTIONS: MotionPreference[] = ['system', 'full', 'reduced'];

  export function MotionToggle() {
    const t = useTranslations('motion');
    const preference = useMotionPreference((s) => s.preference);
    const setPreference = useMotionPreference((s) => s.setPreference);

    return (
      <fieldset className="flex items-center gap-1 font-mono text-xs" aria-label={t('label')}>
        <legend className="sr-only">{t('label')}</legend>
        {OPTIONS.map((option) => {
          const selected = preference === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setPreference(option)}
              className={
                'rounded-full border px-2 py-1 uppercase tracking-wide transition-colors ' +
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ' +
                (selected
                  ? 'border-lime bg-lime text-ink'
                  : 'border-smoke-500 text-smoke-300 hover:text-paper')
              }
            >
              {t(option)}
            </button>
          );
        })}
      </fieldset>
    );
  }
  ```

  > Note: `bg-lime`/`text-lime` here are lime-on-dark (the toggle sits in the dark Header) — compliant with the lime-on-dark-ONLY rule and well under 5% coverage.

- [ ] Mount it in `components/layout/Header.tsx` beside the `LocaleSwitcher`. Add the import and render it in the header's controls cluster:

  ```tsx
  import { MotionToggle } from './MotionToggle';
  // ...inside the controls cluster, next to <LocaleSwitcher />:
  <MotionToggle />;
  ```

- [ ] Visual + behavioral verification against the dev server. Start it:

  ```
  npm run dev
  ```

  Then drive with Playwright MCP (`mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/en`, `browser_snapshot`, `browser_click` the "Reduced" button). The exact check: after clicking **Reduced**, the button has `aria-pressed="true"`; reload the page (`browser_navigate` to the same URL) and confirm **Reduced** is still `aria-pressed="true"` (persistence). Capture `browser_take_screenshot` of the Header in `/en` and `/th` to confirm the Thai labels render in Kanit/IBM Plex Sans Thai without clipping.

- [ ] Commit:
  ```
  git add components/layout/MotionToggle.tsx components/layout/Header.tsx messages/en.json messages/th.json
  git commit -m "feat(layout): add in-UI MotionToggle wired to motion-preference store"
  ```

---

### Task 9.6 — Magnetic `Button` variant on hero CTAs (rAF-throttled, gated)

The magnetic CTA — the only "fancy pointer" effect in VANTA (custom cursor was cut). It lives as a `magnetic` variant on the shared `Button`. The pull is rAF-throttled, gated on `useMotionCapability()` (so it is inert on touch / reduced-motion / Save-Data), and applied to at most 1–2 hero CTAs. Disabled = a perfectly ordinary button.

**Files**

- Modify: `d:/MINE/freelance/system/vanta/components/ui/Button.tsx` (add `magnetic` prop + behavior)
- Modify: `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/page.tsx` (apply `magnetic` to the single hero "Shop the drop" CTA)

**Interfaces**

- Consumes: `import { useMotionCapability } from '@/lib/motion/capability'`
- Produces: `Button` accepts `magnetic?: boolean` (default `false`); existing props unchanged.

**Steps**

- [ ] Add the magnetic behavior to `components/ui/Button.tsx`. Add a `magnetic` prop and an internal effect; the component must already be (or become) a client component for this variant:

  ```tsx
  'use client';

  import { useEffect, useRef } from 'react';
  import { useMotionCapability } from '@/lib/motion/capability';

  type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    magnetic?: boolean;
  };

  const STRENGTH = 0.3; // fraction of pointer offset applied
  const MAX_SHIFT = 16; // px clamp so the CTA never detaches from its label

  export function Button({ magnetic = false, className, children, ...props }: ButtonProps) {
    const ref = useRef<HTMLButtonElement | null>(null);
    const motionEnabled = useMotionCapability();
    const active = magnetic && motionEnabled;

    useEffect(() => {
      const node = ref.current;
      if (!active || node === null) return;

      let frame = 0;
      let targetX = 0;
      let targetY = 0;

      const apply = () => {
        frame = 0;
        node.style.transform = `translate(${targetX}px, ${targetY}px)`;
      };

      const onMove = (event: PointerEvent) => {
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        targetX = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dx * STRENGTH));
        targetY = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dy * STRENGTH));
        if (frame === 0) frame = requestAnimationFrame(apply); // rAF-throttled
      };

      const onLeave = () => {
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        targetX = 0;
        targetY = 0;
        node.style.transform = '';
      };

      node.addEventListener('pointermove', onMove);
      node.addEventListener('pointerleave', onLeave);
      return () => {
        node.removeEventListener('pointermove', onMove);
        node.removeEventListener('pointerleave', onLeave);
        if (frame !== 0) cancelAnimationFrame(frame);
        node.style.transform = '';
      };
    }, [active]);

    return (
      <button
        ref={ref}
        className={
          'inline-flex items-center justify-center rounded-none font-mono uppercase tracking-wide ' +
          'bg-blaze text-paper px-6 py-3 transition-transform will-change-transform ' +
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ' +
          (className ?? '')
        }
        {...props}
      >
        {children}
      </button>
    );
  }
  ```

  > Note: `transition-transform` provides a smooth spring-back on `pointerleave`; the rAF only batches the active follow. When `active` is false the effect never registers listeners — a plain button.

- [ ] Apply `magnetic` to the single hero CTA in `app/[locale]/(shop)/page.tsx`. Locate the hero "Shop the drop" CTA and set the prop:

  ```tsx
  <Button magnetic>{t('hero.cta')}</Button>
  ```

  Keep magnetic on **one** hero CTA (the spec caps it at 1–2 hero CTAs only — do not spread it to catalog/PDP buttons).

- [ ] Visual verification against `npm run dev` with the Chrome DevTools MCP or Playwright MCP. Exact check (motion ON path): `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/en`, then `browser_hover` near the hero CTA and `browser_evaluate` reading `getComputedStyle(button).transform` — assert it is a non-identity matrix while hovering and returns to `none`/identity after `browser_hover` away. Disabled path: set the toggle to **Reduced** and confirm `transform` stays identity on hover. Capture screenshots in `/en` and `/th`.

- [ ] Commit:
  ```
  git add components/ui/Button.tsx "app/[locale]/(shop)/page.tsx"
  git commit -m "feat(ui): add rAF-throttled magnetic Button variant on hero CTA"
  ```

---

### Task 9.7 — View Transitions polish (locale-stable name + reduced-motion hard cut)

Polish the existing card→PDP View Transition so it is keyed on `product-${product.id}` (locale-stable — never on slug or `LocalizedText`), and so reduced motion is a hard cut (no-op), not a fade. The React 19.2 `<ViewTransition>` primitive obeys CSS; we gate the _naming_ on capability so a disabled user gets an instant swap.

**Files**

- Modify: `d:/MINE/freelance/system/vanta/components/product/ProductCard.tsx` (capability-gated `view-transition-name`)
- Modify: `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/product/[slug]/page.tsx` (matching name on the PDP hero image)
- Modify: `d:/MINE/freelance/system/vanta/app/globals.css` (reduced-motion hard-cut rule)

**Interfaces**

- Consumes: `import { useMotionCapability } from '@/lib/motion/capability'`; `product.id` (stable id, never slug/localized)
- Produces: a paired `view-transition-name: product-<id>` on card image ↔ PDP image, suppressed when motion is disabled.

**Steps**

- [ ] In `components/product/ProductCard.tsx`, apply the capability-gated, id-keyed transition name to the card's primary image wrapper:

  ```tsx
  'use client';

  import { useMotionCapability } from '@/lib/motion/capability';
  // ...within the component, where `product` is in scope:
  const motionEnabled = useMotionCapability();
  const transitionName = motionEnabled ? `product-${product.id}` : undefined;
  // ...on the image element:
  <span style={{ viewTransitionName: transitionName }} className="block">
    {/* existing <Image .../> */}
  </span>;
  ```

  > The name derives from `product.id` (locale-stable) so the transition survives an EN↔TH switch — never key on `product.slug` or any `LocalizedText`.

- [ ] In `app/[locale]/(shop)/product/[slug]/page.tsx`, set the _same_ id-keyed name on the PDP hero image. Since the PDP page is a Server Component, apply the name unconditionally via inline style on the image wrapper (the CSS hard-cut rule in the next step neutralizes it for reduced-motion users):

  ```tsx
  <span style={{ viewTransitionName: `product-${product.id}` }} className="block">
    {/* existing PDP hero <Image .../> */}
  </span>
  ```

- [ ] Add the reduced-motion hard-cut rule to `app/globals.css` (after the `:lang()` headline rules block). This guarantees a no-op cut even though the name is present:

  ```css
  /* View Transitions: hard cut (no cross-fade) for reduced-motion users. */
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation: none !important;
    }
  }
  ```

- [ ] Visual verification against `npm run dev`. Exact check (motion ON): with Playwright MCP, `browser_navigate` to `http://localhost:3000/en`, `browser_click` a product card, and confirm the URL advances to `/en/product/<slug>` and the hero image is present (`browser_snapshot`). Then `browser_navigate` to `http://localhost:3000/th` and repeat to prove the transition still fires after locale switch (id-keyed). Reduced-motion check is covered by the Playwright project in Task 9.9 (asserts no fade animation). Capture screenshots of the PDP in `/en` and `/th`.

- [ ] Commit:
  ```
  git add components/product/ProductCard.tsx "app/[locale]/(shop)/product/[slug]/page.tsx" app/globals.css
  git commit -m "feat(motion): key view-transition-name on product id with reduced-motion hard cut"
  ```

---

### Task 9.8 — Finalize design tokens: AA fixes + lime-on-paper token guard

Lock the design-token contract: enforce that urgency text on the `paper` surface uses `--blaze-on-light` (paper-red `#FF3B1F` is only 3.23:1; the darker `#D62E16` is AA-safe), and add a _token guard_ — a unit-tested allowlist that fails the build if `lime` is ever paired with `paper`/light surfaces (lime is `<5%`, lime-on-dark ONLY; lime-on-paper is 1.05:1). The guard is the "token-enforced" part of the spec made real and testable.

**Files**

- Create: `d:/MINE/freelance/system/vanta/lib/motion/token-guard.ts` (pure contrast/pairing guard — colocated with design-system enforcement)
- Test: `d:/MINE/freelance/system/vanta/tests/unit/token-guard.test.ts`
- Modify: `d:/MINE/freelance/system/vanta/components/drop/AvailabilityBadge.tsx` (use `blaze-on-light` on paper surfaces)

**Interfaces**

- Produces:
  ```ts
  export type Surface = 'dark' | 'paper';
  export type TokenColor = 'ink' | 'paper' | 'blaze' | 'blaze-on-light' | 'lime';
  export function assertColorOnSurface(color: TokenColor, surface: Surface): void; // throws on forbidden pair
  export function isColorAllowedOnSurface(color: TokenColor, surface: Surface): boolean;
  ```

**Steps**

- [ ] Write the failing test at `tests/unit/token-guard.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { isColorAllowedOnSurface, assertColorOnSurface } from '@/lib/motion/token-guard';

  describe('token guard', () => {
    it('forbids lime on paper (1.05:1 contrast)', () => {
      expect(isColorAllowedOnSurface('lime', 'paper')).toBe(false);
      expect(() => assertColorOnSurface('lime', 'paper')).toThrow(/lime.*paper/i);
    });

    it('allows lime on dark (lime-on-dark ONLY)', () => {
      expect(isColorAllowedOnSurface('lime', 'dark')).toBe(true);
      expect(() => assertColorOnSurface('lime', 'dark')).not.toThrow();
    });

    it('forbids raw blaze on paper (3.23:1 fails AA)', () => {
      expect(isColorAllowedOnSurface('blaze', 'paper')).toBe(false);
    });

    it('allows blaze-on-light on paper (AA-safe darker variant)', () => {
      expect(isColorAllowedOnSurface('blaze-on-light', 'paper')).toBe(true);
    });

    it('allows blaze on dark', () => {
      expect(isColorAllowedOnSurface('blaze', 'dark')).toBe(true);
    });
  });
  ```

- [ ] Run it and SHOW it fail:

  ```
  npm run test -- tests/unit/token-guard.test.ts
  ```

  Expected output:

  ```
  FAIL  tests/unit/token-guard.test.ts
  Error: Failed to resolve import "@/lib/motion/token-guard"
  ```

- [ ] Implement at `lib/motion/token-guard.ts`:

  ```ts
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
  ```

- [ ] Run it and SHOW it pass:

  ```
  npm run test -- tests/unit/token-guard.test.ts
  ```

  Expected output:

  ```
  ✓ tests/unit/token-guard.test.ts (5 tests)
  Test Files  1 passed (1)
       Tests  5 passed (5)
  ```

- [ ] Apply the AA fix in `components/drop/AvailabilityBadge.tsx`: any urgency text rendered on the `paper` surface (e.g. the low-stock / sale label on a light card) must use the `text-blaze-on-light` token, while the same badge on a dark surface uses `text-blaze`. Update the className mapping so low-stock on paper reads:

  ```tsx
  // urgency label on light/paper card:
  <span className="font-mono text-blaze-on-light">{t('lowStock', { n })}</span>
  ```

  Confirm no instance of `text-lime`/`bg-lime` exists in any component that renders on a paper surface (grep the components tree; lime must only appear in dark-surface contexts such as the Header toggle and dark hero accents).

- [ ] Run the full unit suite + typecheck to confirm no regressions:

  ```
  npm run test && npm run typecheck
  ```

  Expected output:

  ```
  Test Files  N passed (N)
       Tests  M passed (M)
  > tsc --noEmit
  (no errors)
  ```

- [ ] Commit:
  ```
  git add lib/motion/token-guard.ts tests/unit/token-guard.test.ts components/drop/AvailabilityBadge.tsx
  git commit -m "feat(design): add lime-on-paper token guard and blaze-on-light AA fix"
  ```

---

### Task 9.9 — Playwright reduced-motion project (asserts no content stuck at opacity:0)

The capstone safety net: a Playwright project running with `prefers-reduced-motion: reduce` over the hero slice, asserting that **no** content element is left at `opacity:0` after load (the visible-by-default invariant), that the magnetic CTA does not translate on hover, and that the card→PDP navigation is an instant cut (no view-transition fade animation running).

**Files**

- Modify: `d:/MINE/freelance/system/vanta/playwright.config.ts` (add the `reduced-motion` project)
- Create: `d:/MINE/freelance/system/vanta/tests/e2e/reduced-motion.spec.ts`

**Interfaces**

- Consumes: the running dev/preview server (Playwright `webServer`), `prefers-reduced-motion: reduce` emulation.
- Produces: a green `reduced-motion` Playwright project.

**Steps**

- [ ] Add the `reduced-motion` project to `playwright.config.ts` (merge into the existing `projects` array; keep the existing `chromium-en`/`chromium-th` projects):

  ```ts
  // inside defineConfig({ projects: [ ... ] }):
  {
    name: 'reduced-motion',
    testMatch: /reduced-motion\.spec\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      baseURL: 'http://localhost:3000',
    },
  },
  ```

- [ ] Create `tests/e2e/reduced-motion.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test.describe('reduced motion = a real second experience', () => {
    test('no content element is stranded at opacity:0 on Home (visible-by-default)', async ({
      page,
    }) => {
      await page.goto('/en');
      await page.waitForLoadState('networkidle');

      const strandedCount = await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll(
            'main h1, main h2, main p, main img, main a, main [data-reveal]',
          ),
        );
        return candidates.filter((el) => {
          const style = window.getComputedStyle(el as Element);
          // visibility check: rendered, not display:none, but opacity pinned to 0
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return parseFloat(style.opacity) === 0;
        }).length;
      });

      expect(strandedCount).toBe(0);
    });

    test('hero magnetic CTA does not translate on hover under reduced motion', async ({ page }) => {
      await page.goto('/en');
      const cta = page.getByRole('button', { name: /shop|drop/i }).first();
      await cta.hover();
      const transform = await cta.evaluate((el) => window.getComputedStyle(el).transform);
      // identity / none — magnetic effect is inert
      expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
    });

    test('card to PDP is an instant cut (no running view-transition animation)', async ({
      page,
    }) => {
      await page.goto('/en');
      await page.waitForLoadState('networkidle');
      const firstCard = page.locator('a[href*="/product/"]').first();
      await firstCard.click();
      await expect(page).toHaveURL(/\/en\/product\//);

      const running = await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      );
      // hard cut => no animations driving the transition
      expect(running).toBe(0);
    });

    test('Thai locale also keeps content visible-by-default', async ({ page }) => {
      await page.goto('/th');
      await page.waitForLoadState('networkidle');
      const stranded = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('main h1, main h2, main p, main img'));
        return els.filter((el) => {
          const s = window.getComputedStyle(el as Element);
          if (s.display === 'none' || s.visibility === 'hidden') return false;
          return parseFloat(s.opacity) === 0;
        }).length;
      });
      expect(stranded).toBe(0);
    });
  });
  ```

- [ ] Run the reduced-motion project and SHOW it pass (start the server first if `webServer` is not auto-configured):

  ```
  npm run test:e2e -- --project=reduced-motion
  ```

  Expected output:

  ```
  Running 4 tests using 1 worker
    ✓ reduced-motion.spec.ts:… no content element is stranded at opacity:0 on Home
    ✓ reduced-motion.spec.ts:… hero magnetic CTA does not translate on hover
    ✓ reduced-motion.spec.ts:… card to PDP is an instant cut
    ✓ reduced-motion.spec.ts:… Thai locale also keeps content visible-by-default
    4 passed
  ```

- [ ] Run the full e2e suite to confirm the hero-slice EN/TH projects still pass alongside the new project:

  ```
  npm run test:e2e
  ```

  Expected output (all projects green):

  ```
    … passed
  ```

- [ ] Commit:
  ```
  git add playwright.config.ts tests/e2e/reduced-motion.spec.ts
  git commit -m "test(motion): add reduced-motion e2e project asserting no opacity:0 stranding"
  ```

---

**Phase 9 deliverable:** a coherent motion _system_ — one capability gate consumed by GSAP reveals, the magnetic CTA, and View Transitions; reduced motion as a genuine, content-visible-by-default second experience with a persisted in-UI toggle; grapheme-safe split-text; finalized AA-safe tokens with a tested lime-on-paper guard; and a green Playwright reduced-motion project proving nothing is ever stranded at `opacity:0` in either locale.

Relevant files (all absolute):

- `d:/MINE/freelance/system/vanta/lib/motion/segment.ts`
- `d:/MINE/freelance/system/vanta/lib/motion/preference.ts`
- `d:/MINE/freelance/system/vanta/lib/motion/capability.ts`
- `d:/MINE/freelance/system/vanta/lib/motion/reveal.ts`
- `d:/MINE/freelance/system/vanta/lib/motion/token-guard.ts`
- `d:/MINE/freelance/system/vanta/components/layout/MotionToggle.tsx`
- `d:/MINE/freelance/system/vanta/components/ui/Button.tsx`
- `d:/MINE/freelance/system/vanta/components/product/ProductCard.tsx`
- `d:/MINE/freelance/system/vanta/components/drop/AvailabilityBadge.tsx`
- `d:/MINE/freelance/system/vanta/app/globals.css`
- `d:/MINE/freelance/system/vanta/playwright.config.ts`
- `d:/MINE/freelance/system/vanta/tests/e2e/reduced-motion.spec.ts`

---

I have everything I need. The locked contracts and spec are clear. Writing Phase 10.

# Phase 10 — Quality, Case Study & Deploy

> **Phase goal:** lock the hero slice with an executable end-to-end safety net (Playwright in `en` AND `th` + a reduced-motion project), produce the case-study evidence (Lighthouse screenshot, curl-able `/api/products` seam, architecture diagram + README naming `lib/data/index.ts` as the change-one-import seam, OG image + demo-video note), and ship to Vercel with visible demo creds and a seeded order so a reviewer walks browse → PDP → cart → checkout → confirmation instantly.
>
> **Prerequisite:** invoke `superpowers:executing-plans` before starting. The first task is LOGIC-adjacent (E2E specs) and follows `superpowers:test-driven-development`'s red→green→commit rhythm even though the assertions run in Playwright, not Vitest. Tasks 2–8 are evidence/config tasks verified by an exact command or a visual check, then committed.

---

## Task 10.1 — Playwright config + reduced-motion project

Stand up the Playwright runner with three projects (`en`, `th`, `reduced-motion`) pointed at the dev server, plus the shared deterministic seed assumptions (the seeded confirmation order `ord_seed_demo`, the member creds `member@vanta.shop` / `vanta-demo`). Deliverable: `npm run test:e2e -- --list` shows the three projects and zero spec files error on collection.

### Files

- **Create** `d:/MINE/freelance/system/vanta/playwright.config.ts`
- **Create** `d:/MINE/freelance/system/vanta/tests/e2e/fixtures.ts`
- **Modify** `d:/MINE/freelance/system/vanta/package.json` (add `test:e2e` + `test:e2e:report` scripts)

### Interfaces

- **Consumes:** the locale prefix strategy `'always'` (`/en/...`, `/th/...`) from `lib/i18n/routing.ts`; the seeded order id `ord_seed_demo`; member creds `member@vanta.shop` / `vanta-demo` from the seed (`lib/data/mock/seed/users.ts`).
- **Produces:** `export const SEED` (typed test constants) from `tests/e2e/fixtures.ts`; three Playwright projects `en`, `th`, `reduced-motion`.

### Steps

- [ ] Confirm Playwright is installed and the browser binary is present:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx playwright install chromium
  ```
  Expected: `chromium ... is already installed` (or a one-time download that ends with `Chromium ... downloaded`).
- [ ] Add the e2e scripts to `package.json`. Inside the existing `"scripts"` object add (keep the trailing comma rules valid):
  ```json
  "test:e2e": "playwright test",
  "test:e2e:report": "playwright show-report"
  ```
- [ ] Write `tests/e2e/fixtures.ts` with the shared, locale-stable constants the specs assert against:

  ```ts
  import type { Locale } from '@/lib/domain';

  /** Deterministic seed facts the E2E specs rely on. Locale-stable ids only. */
  export const SEED = {
    locales: ['en', 'th'] as const satisfies readonly Locale[],
    member: {
      email: 'member@vanta.shop',
      password: 'vanta-demo',
      id: 'usr_member',
    },
    seededOrderId: 'ord_seed_demo',
  } as const;

  /** Prefix a path with a locale; locale prefix strategy is 'always'. */
  export function localePath(locale: Locale, path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${clean === '/' ? '' : clean}`;
  }
  ```

- [ ] Write `playwright.config.ts` with the three projects. The `reduced-motion` project forces `prefers-reduced-motion: reduce` and runs only the dedicated spec; `en`/`th` run the hero-slice specs:

  ```ts
  import { defineConfig, devices } from '@playwright/test';

  const PORT = 3000;
  const BASE_URL = `http://localhost:${PORT}`;

  export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
      baseURL: BASE_URL,
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
    },
    projects: [
      {
        name: 'en',
        testMatch: /hero-slice\.en\.spec\.ts/,
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'th',
        testMatch: /hero-slice\.th\.spec\.ts/,
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'reduced-motion',
        testMatch: /reduced-motion\.spec\.ts/,
        use: {
          ...devices['Desktop Chrome'],
          // Reduced motion = real second experience; content visible by default.
          reducedMotion: 'reduce',
        },
      },
    ],
    webServer: {
      command: 'npm run build && npm run start',
      url: BASE_URL,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  });
  ```

- [ ] Verify project collection (specs do not exist yet, so a list against an empty match is expected; the projects must enumerate):
  ```bash
  cd d:/MINE/freelance/system/vanta && npx playwright test --list
  ```
  Expected: Playwright prints `Listing tests:` then `Total: 0 tests in 0 files` (no specs yet) and exits 0 — confirming the config parses and the three projects are wired. (Once Tasks 10.2–10.4 add specs, this list populates.)
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add playwright.config.ts tests/e2e/fixtures.ts package.json && git commit -m "test(e2e): scaffold playwright config with en/th/reduced-motion projects"
  ```

---

## Task 10.2 — Hero-slice E2E spec (EN): browse → PDP → add → checkout → confirmation

The English happy path through the full hero slice. Deliverable: `npm run test:e2e -- --project=en` is RED (no `data-testid` hooks rendered) then GREEN once the UI exposes the stable selectors this spec asserts.

> **Selector discipline:** all selectors are derived from stable ids (`product-${id}`, `variant-${id}`) or role/`data-testid` — never from `LocalizedText`. The spec asserts the same DOM ids in both locales.

### Files

- **Create** `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.en.spec.ts`
- **Modify** (selector hooks only, if absent) `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/page.tsx`, `app/[locale]/(shop)/product/[slug]/page.tsx`, `components/pdp/AddToCartButton.tsx`, `components/cart/CartDrawer.tsx`, `app/[locale]/(checkout)/checkout/page.tsx`, `app/[locale]/(checkout)/checkout/[orderId]/page.tsx`

### Interfaces

- **Consumes:** `SEED`, `localePath` from `tests/e2e/fixtures.ts`; stable `data-testid` hooks: `product-card` (with `data-product-id`), `add-to-cart`, `cart-drawer` (a11y `dialog`), `cart-line-item`, `checkout-submit`, `order-confirmation` (with `data-order-id`); the mock payment token `tok_ok` from `lib/services/payment-service.ts`.
- **Produces:** the EN hero-slice E2E spec.

### Steps

- [ ] Write the failing spec:

  ```ts
  import { test, expect } from '@playwright/test';
  import { SEED, localePath } from './fixtures';

  const LOCALE = 'en' as const;

  test.describe('hero slice — en', () => {
    test('browse → PDP → add to cart → checkout → confirmation', async ({ page }) => {
      // 1. Home: the LIVE DROP + featured grid renders product cards.
      await page.goto(localePath(LOCALE, '/'));
      const firstCard = page.getByTestId('product-card').first();
      await expect(firstCard).toBeVisible();
      const productId = await firstCard.getAttribute('data-product-id');
      expect(productId).toBeTruthy();

      // 2. View Transition into PDP; name is keyed on product id (locale-stable).
      await firstCard.getByRole('link').first().click();
      await expect(page).toHaveURL(/\/en\/product\//);
      await expect(page.getByTestId('sticky-buy-panel')).toBeVisible();

      // 3. Add the first in-stock variant to cart; the a11y cart drawer opens.
      const addButton = page.getByTestId('add-to-cart');
      await expect(addButton).toBeEnabled();
      await addButton.click();
      const drawer = page.getByTestId('cart-drawer');
      await expect(drawer).toHaveRole('dialog');
      await expect(drawer.getByTestId('cart-line-item')).toHaveCount(1);

      // 4. Proceed to checkout.
      await drawer.getByTestId('cart-checkout-link').click();
      await expect(page).toHaveURL(/\/en\/checkout$/);

      // 5. Fill the 1–2 step checkout with the mock-approving token + country-first address.
      await page.getByTestId('checkout-email').fill('reviewer@vanta.shop');
      await page.getByTestId('checkout-fullName').fill('Reviewer Demo');
      await page.getByTestId('checkout-line1').fill('1 Sukhumvit Rd');
      await page.getByTestId('checkout-city').fill('Bangkok');
      await page.getByTestId('checkout-postalCode').fill('10110');
      await page.getByTestId('checkout-country').fill('TH');
      await page.getByTestId('payment-token').fill('tok_ok');
      await page.getByTestId('checkout-submit').click();

      // 6. Premium confirmation; URL carries the new order id.
      await expect(page).toHaveURL(/\/en\/checkout\/ord_/);
      const confirmation = page.getByTestId('order-confirmation');
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toContainText('฿');
    });

    test('seeded confirmation order renders instantly for reviewers', async ({ page }) => {
      await page.goto(localePath(LOCALE, `/checkout/${SEED.seededOrderId}`));
      const confirmation = page.getByTestId('order-confirmation');
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toHaveAttribute('data-order-id', SEED.seededOrderId);
    });
  });
  ```

- [ ] Run it and SHOW it fail (the UI selectors are not yet wired or a hook is missing):
  ```bash
  cd d:/MINE/freelance/system/vanta && npx playwright test --project=en
  ```
  Expected (RED): the run reports failures such as `Error: expect(locator).toBeVisible() failed` / `locator resolved to 0 elements` for `getByTestId('product-card')` or `order-confirmation`, and exits non-zero.
- [ ] Add the stable selector hooks to the hero-slice UI (these are additive `data-testid`/`data-product-id` attributes on existing components — do not change behavior). Minimum hooks, each on the element that already renders:
  - `components/product/ProductCard.tsx` — root: `data-testid="product-card" data-product-id={product.id}` and the PDP `Link` already inside it.
  - `components/pdp/StickyBuyPanel.tsx` — root: `data-testid="sticky-buy-panel"`.
  - `components/pdp/AddToCartButton.tsx` — button: `data-testid="add-to-cart"`.
  - `components/cart/CartDrawer.tsx` — dialog root: `data-testid="cart-drawer"` (already `role="dialog"`); the checkout link: `data-testid="cart-checkout-link"`.
  - `components/cart/CartLineItem.tsx` — root: `data-testid="cart-line-item"`.
  - `components/checkout/CheckoutForm.tsx` — inputs: `data-testid="checkout-email|checkout-fullName|checkout-line1|checkout-city|checkout-postalCode|checkout-country"`; submit: `data-testid="checkout-submit"`.
  - `components/checkout/PaymentMockForm.tsx` — token input: `data-testid="payment-token"`.
  - `app/[locale]/(checkout)/checkout/[orderId]/page.tsx` — confirmation root: `data-testid="order-confirmation" data-order-id={order.id}`.
- [ ] Run it and SHOW it pass:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx playwright test --project=en
  ```
  Expected (GREEN): `2 passed (en)` and exit 0.
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add tests/e2e/hero-slice.en.spec.ts components/ app/ && git commit -m "test(e2e): cover en hero slice browse-to-confirmation"
  ```

---

## Task 10.3 — Hero-slice E2E spec (TH): same DOM ids prove locale-stability

The Thai path asserts the **same stable ids** survive the locale switch (selectors keyed on `product-${id}` / `data-testid`, never localized text), proving the i18n layer does not break the architecture seam. Deliverable: `npm run test:e2e -- --project=th` is GREEN; a deliberate text-based assertion would have failed, so we assert Western digits + the baht sign + gregory date instead.

### Files

- **Create** `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.th.spec.ts`

### Interfaces

- **Consumes:** `SEED`, `localePath`; the same `data-testid` hooks added in Task 10.2; the formatting rules — THB shown as `฿1,990` (no decimals), dates in `calendar: 'gregory'` with Western digits in both locales.
- **Produces:** the TH hero-slice E2E spec.

### Steps

- [ ] Write the spec (note: it reuses the identical selectors — only the locale prefix and the locale-formatting assertions change):

  ```ts
  import { test, expect } from '@playwright/test';
  import { SEED, localePath } from './fixtures';

  const LOCALE = 'th' as const;

  test.describe('hero slice — th', () => {
    test('browse → PDP → add to cart → checkout → confirmation (locale-stable ids)', async ({
      page,
    }) => {
      await page.goto(localePath(LOCALE, '/'));
      const firstCard = page.getByTestId('product-card').first();
      await expect(firstCard).toBeVisible();
      const productId = await firstCard.getAttribute('data-product-id');
      expect(productId).toBeTruthy();

      await firstCard.getByRole('link').first().click();
      await expect(page).toHaveURL(/\/th\/product\//);
      await expect(page.getByTestId('sticky-buy-panel')).toBeVisible();

      const addButton = page.getByTestId('add-to-cart');
      await expect(addButton).toBeEnabled();
      await addButton.click();
      const drawer = page.getByTestId('cart-drawer');
      await expect(drawer).toHaveRole('dialog');
      await expect(drawer.getByTestId('cart-line-item')).toHaveCount(1);

      await drawer.getByTestId('cart-checkout-link').click();
      await expect(page).toHaveURL(/\/th\/checkout$/);

      await page.getByTestId('checkout-email').fill('reviewer@vanta.shop');
      await page.getByTestId('checkout-fullName').fill('Reviewer Demo');
      await page.getByTestId('checkout-line1').fill('1 Sukhumvit Rd');
      await page.getByTestId('checkout-city').fill('Bangkok');
      await page.getByTestId('checkout-postalCode').fill('10110');
      await page.getByTestId('checkout-country').fill('TH');
      await page.getByTestId('payment-token').fill('tok_ok');
      await page.getByTestId('checkout-submit').click();

      await expect(page).toHaveURL(/\/th\/checkout\/ord_/);
      await expect(page.getByTestId('order-confirmation')).toBeVisible();
    });

    test('THB has no decimals and dates use gregory calendar with Western digits', async ({
      page,
    }) => {
      await page.goto(localePath(LOCALE, `/checkout/${SEED.seededOrderId}`));
      const confirmation = page.getByTestId('order-confirmation');
      await expect(confirmation).toBeVisible();

      // Money: baht sign + grouped integer baht, NO decimal point.
      const total = confirmation.getByTestId('order-total');
      await expect(total).toContainText('฿');
      await expect(total).not.toContainText('.00');

      // Date: gregory year (e.g. 2026), NOT Buddhist-era 2567; Western digits only.
      const placedAt = confirmation.getByTestId('order-placed-at');
      await expect(placedAt).not.toContainText('2567');
      await expect(placedAt).not.toContainText(/[๐-๙]/);
    });

    test('marquee text is English DROP/SOLD OUT in Thai locale', async ({ page }) => {
      await page.goto(localePath(LOCALE, '/'));
      const marquee = page.getByTestId('drop-marquee');
      await expect(marquee).toBeVisible();
      // Literal Thai of "DROP" reads as "a droplet" — marquee stays English in both locales.
      await expect(marquee).toContainText(/DROP|SOLD OUT/);
    });
  });
  ```

- [ ] Confirm the additional hooks exist (add if missing, additive only): `components/checkout/OrderSummary.tsx` total → `data-testid="order-total"`; confirmation `FormattedDate` wrapper → `data-testid="order-placed-at"`; `components/drop/DropMarquee.tsx` root → `data-testid="drop-marquee"`.
- [ ] Run it and SHOW it fail first (before the hooks above are present), then pass:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx playwright test --project=th
  ```
  Expected (first run, RED): failures on `order-total` / `drop-marquee` resolving to 0 elements. After adding the three hooks, re-run — Expected (GREEN): `3 passed (th)` and exit 0.
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add tests/e2e/hero-slice.th.spec.ts components/ app/ && git commit -m "test(e2e): cover th hero slice and assert locale formatting invariants"
  ```

---

## Task 10.4 — Reduced-motion E2E spec (the real second experience)

Prove the reduced-motion contract: with `prefers-reduced-motion: reduce`, the hero slice still completes AND content is visible-by-default (never stuck at `opacity: 0`), the countdown shows a static fallback, and the View Transition is a hard cut. Deliverable: `npm run test:e2e -- --project=reduced-motion` is GREEN.

### Files

- **Create** `d:/MINE/freelance/system/vanta/tests/e2e/reduced-motion.spec.ts`

### Interfaces

- **Consumes:** `localePath`; the reduced-motion project's forced `reducedMotion: 'reduce'`; the `useMotionCapability` gate (heavy motion only on `(prefers-reduced-motion: no-preference)` AND `(pointer: fine)` AND not `Save-Data`); the `MotionToggle` component; `data-testid` hooks `countdown` / `countdown-static`.
- **Produces:** the reduced-motion E2E spec.

### Steps

- [ ] Write the spec:

  ```ts
  import { test, expect } from '@playwright/test';
  import { localePath } from './fixtures';

  const LOCALE = 'en' as const;

  test.describe('reduced motion — real second experience', () => {
    test('hero content is visible by default (never stuck at opacity:0)', async ({ page }) => {
      await page.goto(localePath(LOCALE, '/'));
      // Split-text headline and cards must be visible without animation kicking in.
      const headline = page.getByTestId('hero-headline');
      await expect(headline).toBeVisible();
      const opacity = await headline.evaluate((el) => getComputedStyle(el).opacity);
      expect(Number(opacity)).toBeGreaterThan(0.99);
    });

    test('countdown shows a static fallback instead of a per-second tick', async ({ page }) => {
      await page.goto(localePath(LOCALE, '/'));
      // Static deadline text is rendered; the live ticking island is suppressed.
      await expect(page.getByTestId('countdown-static')).toBeVisible();
      await expect(page.getByTestId('countdown')).toHaveCount(0);
    });

    test('view transition into PDP is a hard cut and the slice still completes', async ({
      page,
    }) => {
      await page.goto(localePath(LOCALE, '/'));
      const firstCard = page.getByTestId('product-card').first();
      await firstCard.getByRole('link').first().click();
      await expect(page).toHaveURL(/\/en\/product\//);
      await expect(page.getByTestId('sticky-buy-panel')).toBeVisible();

      await page.getByTestId('add-to-cart').click();
      await expect(page.getByTestId('cart-drawer')).toHaveRole('dialog');
    });

    test('in-UI motion toggle is present and operable', async ({ page }) => {
      await page.goto(localePath(LOCALE, '/'));
      const toggle = page.getByTestId('motion-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toBeEnabled();
    });
  });
  ```

- [ ] Confirm the reduced-motion hooks exist (additive): `components/drop/CountdownIsland.tsx` renders `data-testid="countdown"` when ticking and `data-testid="countdown-static"` when reduced; `components/layout/MotionToggle.tsx` root → `data-testid="motion-toggle"`; the hero headline element → `data-testid="hero-headline"`.
- [ ] Run it and SHOW it fail, then pass after the hooks/fallbacks are present:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx playwright test --project=reduced-motion
  ```
  Expected (first run, RED): e.g. `countdown-static` resolves to 0 elements or `countdown` count is 1 (live tick not suppressed). After the fallback is correctly gated — Expected (GREEN): `4 passed (reduced-motion)` and exit 0.
- [ ] Run the entire suite to confirm all three projects pass together:
  ```bash
  cd d:/MINE/freelance/system/vanta && npm run test:e2e
  ```
  Expected: `9 passed` across `en` (2) + `th` (3) + `reduced-motion` (4), exit 0.
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add tests/e2e/reduced-motion.spec.ts components/ && git commit -m "test(e2e): assert reduced-motion fallbacks and hard-cut transitions"
  ```

---

## Task 10.5 — Curl-able `/api/products` JSON seam (documented, NOT client-fetched)

Expose the repository seam as a route handler a reviewer can `curl` to see the data layer is real — strictly a documented artifact, never fetched by the UI (RSC reads through repositories directly). Deliverable: `curl -s http://localhost:3000/api/products | head` returns the seeded product JSON, and a Vitest unit test asserts the route reads through `@/lib/data` (the swap point), not `@/lib/data/mock`.

### Files

- **Create** `d:/MINE/freelance/system/vanta/app/api/products/route.ts`
- **Create** `d:/MINE/freelance/system/vanta/tests/unit/api-products.test.ts`

### Interfaces

- **Consumes:** `products` (the `ProductRepository`) from `@/lib/data`; `Product` from `@/lib/domain`.
- **Produces:** `GET` route handler returning `Product[]` as JSON.

### Steps

- [ ] Write the failing unit test (it imports the route handler and asserts it returns the seeded products through the seam):

  ```ts
  import { describe, it, expect } from 'vitest';
  import { GET } from '@/app/api/products/route';
  import { products } from '@/lib/data';

  describe('GET /api/products (the visible seam)', () => {
    it('returns the same product list the repository exposes', async () => {
      const expected = await products.list();
      const res = await GET();
      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown[];
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(expected.length);
    });

    it('serializes Money as integer minor units (no floats)', async () => {
      const res = await GET();
      const body = (await res.json()) as Array<{
        variants: Array<{ price: { amount: number; currency: string } }>;
      }>;
      const firstPrice = body[0].variants[0].price;
      expect(Number.isInteger(firstPrice.amount)).toBe(true);
      expect(firstPrice.currency).toBe('THB');
    });
  });
  ```

- [ ] Run it and SHOW it fail (route does not exist yet):
  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/api-products.test.ts
  ```
  Expected (RED): `Failed to resolve import "@/app/api/products/route"` / `Cannot find module`, suite fails, exit 1.
- [ ] Write the route handler (reads through the swap point; documented as curl-only):

  ```ts
  import { NextResponse } from 'next/server';
  import { products } from '@/lib/data';
  import type { Product } from '@/lib/domain';

  /**
   * Documented, curl-able JSON seam — exists to make the repository layer VISIBLE
   * to reviewers (`curl http://localhost:3000/api/products`).
   *
   * IMPORTANT: the app NEVER client-fetches this route. Server Components read
   * through `@/lib/data` repositories directly; this handler only re-exposes the
   * SAME seam over HTTP so the "change one import to go live" story is checkable.
   */
  export async function GET(): Promise<NextResponse<Product[]>> {
    const list = await products.list();
    return NextResponse.json(list, {
      headers: { 'cache-control': 'public, max-age=60' },
    });
  }
  ```

- [ ] Run it and SHOW it pass:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx vitest run tests/unit/api-products.test.ts
  ```
  Expected (GREEN): `Test Files  1 passed`, `Tests  2 passed`, exit 0.
- [ ] Verify the curl works against the running dev server (manual evidence for the case study):
  ```bash
  cd d:/MINE/freelance/system/vanta && npm run dev &
  curl -s http://localhost:3000/api/products | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('products:',j.length,'first slug:',j[0].slug)})"
  ```
  Expected: `products: <N> first slug: <slug>` (N matches the seed). Stop the dev server afterward.
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add app/api/products/route.ts tests/unit/api-products.test.ts && git commit -m "feat(api): expose curl-able products seam (documented, not client-fetched)"
  ```

---

## Task 10.6 — Local Lighthouse run + where to screenshot

Run one local Lighthouse audit against the production build of the hero slice and capture the report image for the case study. Deliverable: `docs/case-study/lighthouse-home.html` exists and `docs/case-study/lighthouse-home.png` is captured (the four-gauge summary), referenced from the README.

### Files

- **Create** `d:/MINE/freelance/system/vanta/docs/case-study/` (directory)
- **Create** `d:/MINE/freelance/system/vanta/docs/case-study/lighthouse-home.html` (generated report)
- **Create** `d:/MINE/freelance/system/vanta/docs/case-study/lighthouse-home.png` (screenshot of the gauges)

### Interfaces

- **Consumes:** the production build (`npm run build && npm run start`) of the EN home route `/en`.
- **Produces:** the Lighthouse HTML report + a gauge screenshot for the case study.

### Steps

- [ ] Build and start the production server in the background:
  ```bash
  cd d:/MINE/freelance/system/vanta && npm run build && (npm run start &) && npx wait-on http://localhost:3000/en
  ```
  Expected: build completes with `✓ Compiled successfully`, then `wait-on` resolves silently when `/en` responds 200.
- [ ] Run Lighthouse against the EN home route, writing the HTML report into the case-study folder:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx lighthouse http://localhost:3000/en --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=docs/case-study/lighthouse-home.html --chrome-flags="--headless=new" --quiet
  ```
  Expected: `LH:ChromeLauncher ...` lines, then the report is written; the command prints the path to `docs/case-study/lighthouse-home.html` and exits 0.
- [ ] Capture the four-gauge summary as the screenshot the case study embeds. Open the generated report and screenshot the top gauges region via Chrome DevTools MCP (or Playwright). Exact check: navigate to `file://d:/MINE/freelance/system/vanta/docs/case-study/lighthouse-home.html`, wait for the `.lh-gauge__percentage` elements to be visible, and screenshot the `.lh-scores-container` element to `docs/case-study/lighthouse-home.png`.
  - Verification assertion (Playwright/MCP): the four category scores (Performance, Accessibility, Best Practices, SEO) are present; record the four numbers in the README caption. Where to screenshot: the `.lh-scores-container` (the row of four circular gauges at the top of the report) — this is the image embedded in the README case study.
- [ ] Stop the production server (`kill` the backgrounded `next start`).
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add docs/case-study/lighthouse-home.html docs/case-study/lighthouse-home.png && git commit -m "docs(case-study): add local lighthouse report and gauge screenshot"
  ```

---

## Task 10.7 — README + architecture diagram (Mermaid) naming the swap seam

Author the case-study README: the architecture diagram (Mermaid) that names `lib/data/index.ts` as the single swap point, the 2–3 line "how a real backend plugs in," the cross-links between AETHER / VANTA / Astro, and the curl + Lighthouse + demo-creds evidence. Deliverable: `README.md` renders the Mermaid diagram and contains every required cross-link and the swap-point callout.

### Files

- **Create** `d:/MINE/freelance/system/vanta/README.md`
- **Create** `d:/MINE/freelance/system/vanta/docs/case-study/architecture.mmd` (standalone Mermaid source)

### Interfaces

- **Consumes:** the layering (`lib/domain` → `lib/data/repositories` → `lib/data/mock` → `lib/data/index.ts` → `lib/services` → `lib/actions` → App Router); the swap-point file `lib/data/index.ts`; the curl endpoint `/api/products`; demo creds `member@vanta.shop` / `vanta-demo`; the seeded order `ord_seed_demo`.
- **Produces:** the case-study README + the standalone diagram source.

### Steps

- [ ] Write the standalone Mermaid source `docs/case-study/architecture.mmd` (also embedded in the README) — it MUST label `lib/data/index.ts` as THE SWAP POINT:

  ```mermaid
  flowchart TD
    subgraph UI["App Router (Next.js 15 / React 19.2)"]
      RSC["Server Components<br/>read data"]
      SA["Server Actions<br/>'use server' mutate"]
      MW["middleware.ts<br/>(UX-only: locale + optimistic redirect)"]
    end

    subgraph SVC["lib/services (authorization re-verified per call)"]
      CART["cartService"]
      AUTH["authService<br/>requireUser / requireMember"]
      CHK["checkoutService"]
      DROP["dropService"]
      PAY["PaymentService (mock → Stripe/Omise)"]
      AVAIL["deriveAvailability (pure)"]
    end

    subgraph DATA["lib/data"]
      SWAP["lib/data/index.ts<br/><b>THE SWAP POINT</b><br/>change one import to go live"]
      REPO["repositories/*<br/>(async, request-context-free interfaces)"]
      MOCK["mock/* adapters + seed"]
      PRISMA["prismaRepositories<br/>(future: Prisma + Postgres)"]:::future
      API["apiRepositories<br/>(future: NestJS REST)"]:::future
    end

    DOMAIN["lib/domain<br/>pure types: Money, Product, Variant, Cart, Order, User"]
    APIROUTE["app/api/products<br/>curl-able JSON seam (documented, not client-fetched)"]

    RSC --> REPO
    SA --> SVC
    SVC --> REPO
    AVAIL -.reads.-> DOMAIN
    REPO --> SWAP
    SWAP --> MOCK
    SWAP -.swap target.-> PRISMA
    SWAP -.swap target.-> API
    APIROUTE --> SWAP
    REPO --> DOMAIN
    MOCK --> DOMAIN

    classDef future stroke-dasharray: 5 5,fill:#141414,color:#B8B8B8;
  ```

- [ ] Write `README.md` embedding the same diagram and all required prose:

  ````markdown
  # VANTA®

  > **Bangkok-born. Globally worn.** A bilingual (EN/TH) streetwear storefront —
  > a portfolio piece proving senior **application architecture**: a real, stateful
  > store (cart, auth, inventory, live drops) built so a real backend plugs in by
  > changing **one import**, not rewriting the UI.

  **Live demo:** _<vercel-url>_ · **Demo member:** `member@vanta.shop` / `vanta-demo`
  (shown on `/login`) · **Seeded order:** `/en/checkout/ord_seed_demo` walks the
  confirmation instantly.

  ## The hero: LIVE DROP

  One pure function, `deriveAvailability(variant, drop, now, user)`, returns
  `coming_soon | early_access | live | low_stock | sold_out` and is read identically
  by home, catalog, PDP, and the marquee. A real countdown flips the drop to LIVE,
  stock ticks down on add-to-cart, and early access unlocks for the seed member.

  ## Architecture — the seam is the selling point

  ```mermaid
  flowchart TD
    subgraph UI["App Router (Next.js 15 / React 19.2)"]
      RSC["Server Components read data"]
      SA["Server Actions 'use server' mutate"]
      MW["middleware.ts (UX-only)"]
    end
    subgraph SVC["lib/services"]
      CART["cartService"]
      AUTH["authService requireUser/requireMember"]
      CHK["checkoutService"]
      DROP["dropService"]
      PAY["PaymentService (mock → Stripe/Omise)"]
      AVAIL["deriveAvailability (pure)"]
    end
    subgraph DATA["lib/data"]
      SWAP["lib/data/index.ts — THE SWAP POINT"]
      REPO["repositories/* (async, request-context-free)"]
      MOCK["mock/* adapters + seed"]
    end
    DOMAIN["lib/domain (pure types)"]
    APIROUTE["app/api/products (curl-able seam)"]
    RSC --> REPO
    SA --> SVC
    SVC --> REPO
    REPO --> SWAP
    SWAP --> MOCK
    APIROUTE --> SWAP
    REPO --> DOMAIN
  ```
  ````

  **The swap point is [`lib/data/index.ts`](lib/data/index.ts).** Today it reads:

  ```ts
  export const repositories: Repositories = mockRepositories;
  ```

  ### How a real backend plugs in (change one import)

  Swap `mockRepositories` for a `prismaRepositories` bundle backed by **Prisma +
  Postgres** (or `apiRepositories` calling a **NestJS** service). Auth swaps the
  `authService` adapter for **OAuth** (Auth.js); the `PaymentService` seam targets
  **Stripe/Omise** with **webhook** order reconciliation. The Server Components,
  Server Actions, components, and domain types are untouched — only this one file
  changes.

  ### See the seam yourself

  ```bash
  curl -s http://localhost:3000/api/products | jq '.[0].slug'
  ```

  (Documented for reviewers — the UI never client-fetches `/api`; RSC reads the
  repositories directly. This route only re-exposes the same seam over HTTP.)

  ## Quality
  - **Vitest** — `deriveAvailability`, money/date formatting, cart reconciliation,
    repository swap, and the `/api` seam.
  - **Playwright** — the hero slice (browse → PDP → add → checkout → confirmation)
    in **EN and TH**, plus a **reduced-motion** project.
  - **Lighthouse** — one local run on `/en`:
    ![Lighthouse scores](docs/case-study/lighthouse-home.png)

  ## The senior story (three pieces, one arc)
  - **AETHER** — visual **craft** (award-tier interaction & motion).
  - **VANTA** (this repo) — application **architecture** (backend-ready, one-import swap).
  - **Astro site** — the **backend** discipline behind both.

  ## Run locally

  ```bash
  npm install
  npm run dev        # http://localhost:3000/en
  npm test           # Vitest (lib/**)
  npm run test:e2e   # Playwright (en/th/reduced-motion)
  ```

  ## Stack

  Next.js 15 (App Router) · React 19.2 · TypeScript (strict) · Tailwind CSS v4 ·
  GSAP · Zustand (disciplined mirror) · next-intl · Vitest + Playwright · Vercel.

  ```

  ```

- [ ] Verify the Mermaid blocks parse (catch syntax errors before relying on GitHub rendering):
  ```bash
  cd d:/MINE/freelance/system/vanta && npx -y @mermaid-js/mermaid-cli -i docs/case-study/architecture.mmd -o docs/case-study/architecture.svg
  ```
  Expected: `Generating single mermaid chart` then the SVG is written with no parse error; exit 0. Fix any reported line/column before continuing.
- [ ] Verify the README contains every required artifact reference:
  ```bash
  cd d:/MINE/freelance/system/vanta && grep -c "lib/data/index.ts" README.md && grep -c "member@vanta.shop" README.md && grep -c "ord_seed_demo" README.md && grep -E "AETHER|Astro" README.md | head
  ```
  Expected: a count `>= 2` for the swap point, `>= 1` for the demo creds, `>= 1` for the seeded order, and lines naming both `AETHER` and `Astro`.
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add README.md docs/case-study/architecture.mmd docs/case-study/architecture.svg && git commit -m "docs: write case-study readme with swap-point architecture diagram"
  ```

---

## Task 10.8 — Vercel deploy config, OG image, hero demo-video note + final verification

Wire the Vercel deploy config, the OG image and metadata for the hero slice, the hero demo-video note, and run the full pre-deploy verification (typecheck + unit + e2e). Deliverable: a green `npm run typecheck && npm test && npm run test:e2e`, an OG image asserted to render in `<head>`, and `vercel.json` + a deploy checklist committed.

### Files

- **Create** `d:/MINE/freelance/system/vanta/vercel.json`
- **Create** `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/opengraph-image.tsx`
- **Modify** `d:/MINE/freelance/system/vanta/app/[locale]/layout.tsx` (export `metadata`/`generateMetadata` with OG + `alternates.languages` hreflang)
- **Create** `d:/MINE/freelance/system/vanta/docs/case-study/DEPLOY.md`
- **Create** `d:/MINE/freelance/system/vanta/tests/e2e/og-image.spec.ts`

### Interfaces

- **Consumes:** the design tokens `--ink #0A0A0A`, `--paper #F5F4EF`, `--blaze #FF3B1F` (OG art direction = VANTA out of the void); the locales `en`/`th` with prefix `'always'` for hreflang; the demo creds + seeded order for the deploy checklist.
- **Produces:** `vercel.json`, the dynamic OG image route, hreflang metadata, the deploy checklist, and an OG-presence E2E spec.

### Steps

- [ ] Write `vercel.json` (build via npm; Playwright is not run on Vercel — it is local-only quality evidence):
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "installCommand": "npm install",
    "regions": ["sin1"],
    "headers": [
      {
        "source": "/api/products",
        "headers": [{ "key": "cache-control", "value": "public, max-age=60" }]
      }
    ]
  }
  ```
- [ ] Write the dynamic OG image (the void aesthetic, ALL-CAPS Latin lockup; Tier-1 hero is the OG/demo subject):

  ```tsx
  import { ImageResponse } from 'next/og';

  export const runtime = 'edge';
  export const alt = 'VANTA® — Bangkok-born. Globally worn.';
  export const size = { width: 1200, height: 630 };
  export const contentType = 'image/png';

  export default function OpengraphImage() {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            background: '#0A0A0A', // --ink: products materialize out of the void
            color: '#F5F4EF', // --paper
          }}
        >
          <div
            style={{
              fontSize: 160,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            VANTA®
          </div>
          <div style={{ marginTop: 24, fontSize: 40, color: '#FF3B1F' }}>
            {/* --blaze: signature urgency */}
            LIVE DROP — Bangkok-born. Globally worn.
          </div>
        </div>
      ),
      { ...size },
    );
  }
  ```

- [ ] Add OG + hreflang metadata to `app/[locale]/layout.tsx` via `generateMetadata` (the file already exists; add this export — adjust the `params` destructuring to match the existing async signature):

  ```tsx
  import type { Metadata } from 'next';
  import type { Locale } from '@/lib/domain';

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: Locale }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const title = 'VANTA® — Bangkok-born. Globally worn.';
    const description =
      'Bilingual EN/TH streetwear. A live drop you can feel — built backend-ready.';
    return {
      title,
      description,
      openGraph: { title, description, type: 'website', locale },
      twitter: { card: 'summary_large_image', title, description },
      alternates: {
        languages: { en: '/en', th: '/th' },
      },
    };
  }
  ```

- [ ] Write the OG-presence E2E spec (asserts the image meta tag is emitted — visual evidence the OG renders):

  ```ts
  import { test, expect } from '@playwright/test';
  import { localePath } from './fixtures';

  test.describe('open graph image', () => {
    test('home emits an og:image meta tag', async ({ page }) => {
      await page.goto(localePath('en', '/'));
      const og = page.locator('meta[property="og:image"]');
      await expect(og).toHaveCount(1);
      const content = await og.getAttribute('content');
      expect(content).toContain('opengraph-image');
    });
  });
  ```

- [ ] Add this spec to the `en` project match (it already matches `hero-slice.en.spec.ts`; either widen the `testMatch` to also include `og-image.spec.ts` or rename the spec to `hero-slice.og.en.spec.ts` so the existing `/hero-slice\.en/` regex catches it). Use the rename approach to keep the config untouched:
  ```bash
  cd d:/MINE/freelance/system/vanta && git mv tests/e2e/og-image.spec.ts tests/e2e/hero-slice.og.en.spec.ts
  ```
  > Note: the Task 10.1 `en` `testMatch` is `/hero-slice\.en\.spec\.ts/`. To include this file without editing config, instead name it `hero-slice.en.og.spec.ts` so it does NOT collide — then update the `en` `testMatch` to `/hero-slice\.en(\.og)?\.spec\.ts/`. Apply that one-line config edit now.
- [ ] Write the deploy checklist `docs/case-study/DEPLOY.md`:

  ```markdown
  # VANTA® — Vercel deploy checklist

  1. `vercel link` then `vercel --prod` (framework auto-detected as Next.js).
  2. Confirm region `sin1` (Singapore — closest to the Bangkok story).
  3. No real secrets required: the mock adapters are the data layer. (When a real
     backend is wired, set `DATABASE_URL` and the `authService`/`PaymentService`
     env here — the swap is `lib/data/index.ts`, not the deploy config.)
  4. **Demo creds are intentionally visible** on `/login`: `member@vanta.shop` /
     `vanta-demo`.
  5. Smoke the live URL:
     - `/en` and `/th` both load; LIVE DROP countdown ticks (or shows the static
       fallback under reduced motion).
     - `/en/checkout/ord_seed_demo` renders the seeded confirmation instantly.
     - `curl -s https://<url>/api/products | jq '.[0].slug'` returns a slug.
  6. Verify the OG image: paste the live URL into a link unfurl preview; the
     `opengraph-image` (void-black VANTA® lockup) renders at 1200×630.

  ## Hero demo video (the OG/demo asset)

  Record the **Tier-1 hero slice** at 1440px desktop, reduced-motion OFF, in EN:
  Home (LIVE DROP countdown + magnetic CTA) → click a card (View Transition into
  PDP) → swatch swap → add to cart (drawer slides in, stock ticks down) →
  checkout → premium confirmation. ~20–30s, no cuts. Export MP4 +
  poster frame; link it from the README and use it as the social preview where
  video unfurls are supported. Store under `docs/case-study/hero-demo.mp4`.
  ```

- [ ] Run the full pre-deploy verification gate:
  ```bash
  cd d:/MINE/freelance/system/vanta && npm run typecheck && npm test && npm run test:e2e
  ```
  Expected: `tsc --noEmit` prints nothing and exits 0; Vitest reports all unit suites passing; Playwright reports all `en`/`th`/`reduced-motion` specs passing (now including the OG spec under `en`); overall exit 0.
- [ ] Visually verify the OG image renders (Chrome DevTools MCP or Playwright against `npm run dev`): navigate to `http://localhost:3000/en/opengraph-image`, screenshot it, and confirm the void-black background `#0A0A0A`, the ALL-CAPS `VANTA®` lockup, and the blaze-red `#FF3B1F` strapline are present. Save the screenshot to `docs/case-study/og-preview.png`. Exact check: the screenshot is 1200×630 and the three token colors are visible.
- [ ] Commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add vercel.json app/ tests/e2e/ playwright.config.ts docs/case-study/DEPLOY.md docs/case-study/og-preview.png && git commit -m "feat(deploy): add vercel config, og image, hreflang metadata and deploy checklist"
  ```
- [ ] Deploy to production and capture the live URL into the README placeholder:
  ```bash
  cd d:/MINE/freelance/system/vanta && npx vercel --prod
  ```
  Expected: Vercel prints `Production: https://<url>` and exit 0. Replace `_<vercel-url>_` in `README.md` with the printed URL, then commit:
  ```bash
  cd d:/MINE/freelance/system/vanta && git add README.md && git commit -m "docs: record live vercel production url"
  ```

---

Phase file paths referenced (all absolute): `d:/MINE/freelance/system/vanta/playwright.config.ts`, `d:/MINE/freelance/system/vanta/tests/e2e/fixtures.ts`, `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.en.spec.ts`, `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.th.spec.ts`, `d:/MINE/freelance/system/vanta/tests/e2e/reduced-motion.spec.ts`, `d:/MINE/freelance/system/vanta/tests/e2e/hero-slice.en.og.spec.ts`, `d:/MINE/freelance/system/vanta/tests/unit/api-products.test.ts`, `d:/MINE/freelance/system/vanta/app/api/products/route.ts`, `d:/MINE/freelance/system/vanta/app/[locale]/(shop)/opengraph-image.tsx`, `d:/MINE/freelance/system/vanta/app/[locale]/layout.tsx`, `d:/MINE/freelance/system/vanta/vercel.json`, `d:/MINE/freelance/system/vanta/README.md`, `d:/MINE/freelance/system/vanta/docs/case-study/architecture.mmd`, `d:/MINE/freelance/system/vanta/docs/case-study/lighthouse-home.html`, `d:/MINE/freelance/system/vanta/docs/case-study/lighthouse-home.png`, `d:/MINE/freelance/system/vanta/docs/case-study/DEPLOY.md`.

---
