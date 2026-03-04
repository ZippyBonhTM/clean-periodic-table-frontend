import { memo } from 'react';

type TokenStatusProps = {
  hasToken: boolean;
};

function TokenStatus({ hasToken }: TokenStatusProps) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        hasToken
          ? 'border-[rgba(16,185,129,0.55)] bg-[rgba(16,185,129,0.18)] text-[var(--text-strong)]'
          : 'border-[rgba(245,158,11,0.48)] bg-[rgba(245,158,11,0.15)] text-[var(--text-strong)]'
      }`}
    >
      {hasToken ? 'Authenticated' : 'No token'}
    </span>
  );
}

export default memo(TokenStatus);
