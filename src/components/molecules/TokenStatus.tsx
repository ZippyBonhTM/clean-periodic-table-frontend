'use client';

import { memo } from 'react';

import useTokenStatusText from '@/components/molecules/useTokenStatusText';

type TokenStatusType = 'authenticated' | 'checking' | 'unverified' | 'anonymous';
type TokenStatusLabels = Record<TokenStatusType, string>;

type TokenStatusProps = {
  status: TokenStatusType;
  labels?: TokenStatusLabels;
};

function resolveStatusStyles(status: TokenStatusType): string {
  if (status === 'authenticated') {
    return 'border-[rgba(16,185,129,0.55)] bg-[rgba(16,185,129,0.18)] text-[var(--text-strong)]';
  }

  if (status === 'checking') {
    return 'border-[rgba(56,189,248,0.6)] bg-[rgba(56,189,248,0.18)] text-[var(--text-strong)]';
  }

  if (status === 'unverified') {
    return 'border-[rgba(245,158,11,0.55)] bg-[rgba(245,158,11,0.18)] text-[var(--text-strong)]';
  }

  return 'border-[rgba(245,158,11,0.48)] bg-[rgba(245,158,11,0.15)] text-[var(--text-strong)]';
}

function TokenStatus({ status, labels }: TokenStatusProps) {
  const text = useTokenStatusText();

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${resolveStatusStyles(status)}`}
    >
      {labels?.[status] ?? text[status]}
    </span>
  );
}

export default memo(TokenStatus);
export type { TokenStatusLabels, TokenStatusType };
