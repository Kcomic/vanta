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
