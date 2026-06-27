import type { Product, Drop, User } from '@/lib/domain';
import { toCatalogCard } from '@/components/product/catalog-card';
import type { CatalogCard } from '@/components/product/catalog-card';

export type SearchResults = {
  query: string; // trimmed/collapsed echo of the raw query
  count: number; // results.length
  cards: CatalogCard[]; // same card shape the grid renders
};

export function normalizeSearchQuery(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ');
}

/**
 * PURE. Build a SearchResults from an already-filtered Product[] and a raw query string.
 * The repository's search() performs the actual text matching; this function:
 *  - normalizes/echoes the query
 *  - returns empty for a blank query (repository was never asked)
 *  - maps each Product to a CatalogCard via toCatalogCard (CARD_ROLLUP_ORDER roll-up)
 *
 * The dropsById, now, and user params are accepted for API consistency with deriveCatalogView
 * but the card shape is derived from static variant.availability (see toCatalogCard).
 */
export function buildSearchResults(
  rawQuery: string | null | undefined,
  matches: Product[],
  _dropsById: Record<string, Drop>,
  _now: Date,
  _user: User | null,
): SearchResults {
  const query = normalizeSearchQuery(rawQuery);
  if (query === '') return { query: '', count: 0, cards: [] };
  const cards = matches.map((product) => toCatalogCard(product, 'en'));
  return { query, count: cards.length, cards };
}
