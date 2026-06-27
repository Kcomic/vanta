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
