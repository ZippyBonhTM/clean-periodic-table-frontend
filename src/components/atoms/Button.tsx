'use client';

import { forwardRef, memo } from 'react';

import { buildButtonClass } from '@/components/atoms/buttonStyles';
import type { ButtonAlign, ButtonSize, ButtonVariant } from '@/components/atoms/buttonStyles';

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: ButtonAlign;
  uppercase?: boolean;
};

const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      type = 'button',
      variant = 'primary',
      size = 'lg',
      align = 'center',
      uppercase = false,
      disabled = false,
      className = '',
      children,
      ...restProps
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={buildButtonClass({
          variant,
          size,
          align,
          uppercase,
          className,
        })}
        {...restProps}
      >
        {children}
      </button>
    );
  }),
);

Button.displayName = 'Button';

export default Button;
