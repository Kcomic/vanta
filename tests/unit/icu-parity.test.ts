import { describe, it, expect } from 'vitest';
import en from '@/messages/en.json';
import th from '@/messages/th.json';

/**
 * Key-isomorphism is already enforced elsewhere; this guards ICU *category* parity for the
 * semantic states that both locales must agree on. Thai has no grammatical plural, so `one`
 * is legitimately absent — but an explicit `=0` ("no items") is a semantic state, not a
 * plural rule, and must exist in both.
 */
describe('ICU parity', () => {
  it('catalog.resultCount carries an explicit =0 branch in BOTH locales', () => {
    expect(en.catalog.resultCount).toContain('=0');
    expect(th.catalog.resultCount).toContain('=0');
  });
});
