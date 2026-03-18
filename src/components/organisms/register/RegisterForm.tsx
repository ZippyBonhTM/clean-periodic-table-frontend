'use client';

import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import FormField from '@/components/molecules/FormField';
import useAuthText from '@/components/organisms/auth/useAuthText';
import { register } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import useAppLocale from '@/shared/i18n/useAppLocale';

type RegisterFormProps = {
  onSuccess: (token: string) => void;
  mode?: 'page' | 'modal';
  onSwitchToLogin?: () => void;
};

function RegisterForm({ onSuccess, mode = 'page', onSwitchToLogin }: RegisterFormProps) {
  const text = useAuthText();
  const { locale } = useAppLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (password !== passwordConfirmation) {
        setError(text.register.passwordMismatch);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await register({ name, email, password });
        onSuccess(response.accessToken);
      } catch (caughtError: unknown) {
        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
          setError(caughtError.message);
        } else {
          setError(text.register.fallbackError);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, name, onSuccess, password, passwordConfirmation, text.register.fallbackError, text.register.passwordMismatch],
  );

  const content = (
    <>
      <div className="auth-modal__header mb-4">
        <p className="auth-modal__eyebrow text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{text.register.eyebrow}</p>
        <h2 className="auth-modal__title text-2xl font-bold text-[var(--text-strong)]">{text.register.title}</h2>
        <p className="auth-modal__subtitle mt-1 text-sm text-[var(--text-muted)]">{text.register.subtitle}</p>
      </div>

      <form className="auth-modal__form space-y-4" onSubmit={onSubmit}>
        <FormField
          id="name"
          label={text.fields.name}
          name="name"
          placeholder={text.fields.namePlaceholder}
          value={name}
          onChange={setName}
          autoComplete="name"
          required
        />

        <FormField
          id="email"
          label={text.fields.email}
          name="email"
          type="email"
          placeholder={text.fields.emailPlaceholder}
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        <FormField
          id="password"
          label={text.fields.password}
          name="password"
          type="password"
          placeholder={text.fields.passwordPlaceholder}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />

        <FormField
          id="passwordConfirmation"
          label={text.fields.confirmPassword}
          name="passwordConfirmation"
          type="password"
          placeholder={text.fields.passwordPlaceholder}
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          autoComplete="new-password"
          required
        />

        {error !== null ? (
          <p className="auth-modal__error rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="auth-modal__submit w-full">
          {isSubmitting ? text.register.submitting : text.register.submit}
        </Button>
      </form>

      {mode === 'modal' ? (
        <p className="auth-modal__switch mt-4 text-sm text-[var(--text-muted)]">
          {text.register.switchPrompt}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
          >
            {text.register.switchAction}
          </button>
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          {text.register.switchPrompt}{' '}
          <Link
            href={buildLocalizedAppPath(locale, '/login')}
            className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
          >
            {text.register.switchAction}
          </Link>
        </p>
      )}
    </>
  );

  if (mode === 'modal') {
    return <div className="auth-modal-content">{content}</div>;
  }

  return <Panel className="mx-auto w-full max-w-lg">{content}</Panel>;
}

export default memo(RegisterForm);
