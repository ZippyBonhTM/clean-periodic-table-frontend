import { memo } from 'react';

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

function resolveStatusLabel(status: TokenStatusType): string {
  if (status === 'authenticated') {
    return 'Session active';
  }

  if (status === 'checking') {
    return 'Checking session';
  }

  if (status === 'unverified') {
    return 'Session unverified';
  }

  return 'Not authenticated';
}

function TokenStatus({ status, labels }: TokenStatusProps) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${resolveStatusStyles(status)}`}
    >
      {labels?.[status] ?? resolveStatusLabel(status)}
    </span>
  );
}

export default memo(TokenStatus);
export type { TokenStatusLabels, TokenStatusType };
