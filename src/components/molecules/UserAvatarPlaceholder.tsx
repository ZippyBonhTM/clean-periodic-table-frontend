import { memo } from 'react';

type UserAvatarPlaceholderProps = {
  hasToken: boolean;
};

function UserAvatarPlaceholder({ hasToken }: UserAvatarPlaceholderProps) {
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-[0.08em] ${
        hasToken
          ? 'border-[rgba(16,185,129,0.55)] bg-[rgba(16,185,129,0.12)] text-[var(--text-strong)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)]'
      }`}
      title="User avatar placeholder"
      aria-label="User avatar placeholder"
    >
      UI
    </div>
  );
}

export default memo(UserAvatarPlaceholder);
