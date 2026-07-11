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
