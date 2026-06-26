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
