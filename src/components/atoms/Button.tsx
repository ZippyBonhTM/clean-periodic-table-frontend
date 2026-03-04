'use client';

import { memo } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--accent-strong)] bg-[var(--accent-strong)] text-[var(--on-accent)] hover:bg-[var(--accent-strong-hover)] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)] hover:bg-[var(--accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:opacity-50 disabled:cursor-not-allowed',
};

function Button({
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${variantStyles[variant]} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export default memo(Button);
