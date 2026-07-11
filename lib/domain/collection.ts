import type { LocalizedText } from './i18n';

export type Collection = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  heroImageUrl: string;
  productIds: string[];
};
