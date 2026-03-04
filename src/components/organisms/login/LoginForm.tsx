'use client';

import { memo, useCallback, useState } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import FormField from '@/components/molecules/FormField';
import { login } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';

type LoginFormProps = {
  onSuccess: (token: string) => void;
};

function LoginForm({ onSuccess }: LoginFormProps) {
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
        } else {
          setError('Could not sign in right now.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, onSuccess, password],
  );

  return (
    <Panel className="mx-auto w-full max-w-lg">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Authentication</p>
        <h2 className="text-2xl font-bold text-slate-900">Login</h2>
        <p className="mt-1 text-sm text-slate-600">Use your auth microservice credentials to get a JWT token.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
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
          <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Panel>
  );
}

export default memo(LoginForm);
