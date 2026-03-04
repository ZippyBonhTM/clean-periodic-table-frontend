import { memo } from 'react';

type TokenStatusProps = {
  hasToken: boolean;
};

function TokenStatus({ hasToken }: TokenStatusProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        hasToken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {hasToken ? 'Token loaded' : 'Not authenticated'}
    </span>
  );
}

export default memo(TokenStatus);
