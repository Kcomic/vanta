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
          defaultValue={mode === 'login' ? t('demoPassword') : undefined}
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
