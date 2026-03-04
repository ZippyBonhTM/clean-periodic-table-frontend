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
    'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-300 disabled:cursor-not-allowed',
  secondary:
    'bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:bg-amber-300 disabled:cursor-not-allowed',
  ghost:
    'border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
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
