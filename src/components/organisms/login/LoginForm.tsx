'use client';

import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import FormField from '@/components/molecules/FormField';
import { login } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';

type LoginFormProps = {
  onSuccess: (token: string) => void;
  mode?: 'page' | 'modal';
  onSwitchToRegister?: () => void;
};

function LoginForm({ onSuccess, mode = 'page', onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await login({ email, password });
        onSuccess(response.accessToken);
      } catch (caughtError: unknown) {
        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
          setError(caughtError.message);
        } else {
          setError('Could not sign in right now.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, onSuccess, password],
  );

  const content = (
    <>
      <div className="auth-modal__header mb-4">
        <p className="auth-modal__eyebrow text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Authentication</p>
        <h2 className="auth-modal__title text-2xl font-bold text-[var(--text-strong)]">Login</h2>
        <p className="auth-modal__subtitle mt-1 text-sm text-[var(--text-muted)]">Sign in to unlock the periodic table data.</p>
      </div>

      <form className="auth-modal__form space-y-4" onSubmit={onSubmit}>
        <FormField
          id="email"
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        {error !== null ? (
          <p className="auth-modal__error rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="auth-modal__submit w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {mode === 'modal' ? (
        <p className="auth-modal__switch mt-4 text-sm text-[var(--text-muted)]">
          Need an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
          >
            Register here
          </button>
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Need an account?{' '}
          <Link href="/register" className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]">
            Register here
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

export default memo(LoginForm);
