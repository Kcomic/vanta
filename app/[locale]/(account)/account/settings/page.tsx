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
        <dt className="text-smoke-300">{t('settingsName')}</dt>
        <dd>{user.name}</dd>

        <dt className="text-smoke-300">{t('settingsEmail')}</dt>
        <dd className="font-mono">{user.email}</dd>

        <dt className="text-smoke-300">{t('settingsLocale')}</dt>
        <dd className="font-mono uppercase">{locale}</dd>
      </dl>

      <p className="font-body text-sm text-smoke-300">{t('settingsNote')}</p>
    </main>
  );
}
