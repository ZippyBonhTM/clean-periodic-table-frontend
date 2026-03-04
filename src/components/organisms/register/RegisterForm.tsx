'use client';

import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import FormField from '@/components/molecules/FormField';
import { register } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';

type RegisterFormProps = {
  onSuccess: (token: string) => void;
  mode?: 'page' | 'modal';
  onSwitchToLogin?: () => void;
};

function RegisterForm({ onSuccess, mode = 'page', onSwitchToLogin }: RegisterFormProps) {
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
        setError('Password confirmation does not match.');
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
          setError('Could not create your account right now.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, name, onSuccess, password, passwordConfirmation],
  );

  const content = (
    <>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Authentication</p>
        <h2 className="text-2xl font-bold text-[var(--text-strong)]">Register</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Create your account to request secured element data.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          id="name"
          label="Name"
          name="name"
          placeholder="Ada Lovelace"
          value={name}
          onChange={setName}
          autoComplete="name"
          required
        />

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
          autoComplete="new-password"
          required
        />

        <FormField
          id="passwordConfirmation"
          label="Confirm password"
          name="passwordConfirmation"
          type="password"
          placeholder="********"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          autoComplete="new-password"
          required
        />

        {error !== null ? (
          <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      {mode === 'modal' ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
          >
            Sign in
          </button>
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]">
            Sign in
          </Link>
        </p>
      )}
    </>
  );

  if (mode === 'modal') {
    return <div>{content}</div>;
  }

  return <Panel className="mx-auto w-full max-w-lg">{content}</Panel>;
}

export default memo(RegisterForm);
