export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAlign = 'center' | 'between' | 'left';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--accent-strong)] bg-[var(--accent-strong)] text-[var(--on-accent)] hover:bg-[var(--accent-strong-hover)] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)] hover:bg-[var(--accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-md px-2 text-[11px]',
  md: 'h-9 rounded-lg px-2.5 text-[11px]',
  lg: 'rounded-xl px-4 py-2 text-sm',
};

const alignStyles: Record<ButtonAlign, string> = {
  center: 'justify-center',
  between: 'justify-between',
  left: 'justify-start text-left',
};

type BuildButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: ButtonAlign;
  uppercase?: boolean;
  className?: string;
};

function buildButtonClass({
  variant = 'primary',
  size = 'lg',
  align = 'center',
  uppercase = false,
  className = '',
}: BuildButtonClassOptions) {
  const caseStyle = uppercase ? 'uppercase tracking-[0.06em]' : '';

  return `inline-flex items-center gap-1.5 font-semibold transition-colors ${sizeStyles[size]} ${alignStyles[align]} ${caseStyle} ${variantStyles[variant]} ${className}`.trim();
}

export { buildButtonClass };
