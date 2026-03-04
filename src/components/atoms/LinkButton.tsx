'use client';

import Link from 'next/link';
import { memo } from 'react';

import { buildButtonClass } from '@/components/atoms/buttonStyles';
import type { ButtonAlign, ButtonSize, ButtonVariant } from '@/components/atoms/buttonStyles';

type LinkButtonProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: ButtonAlign;
  uppercase?: boolean;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
  target?: string;
  rel?: string;
};

function LinkButton({
  href,
  variant = 'ghost',
  size = 'lg',
  align = 'center',
  uppercase = false,
  className = '',
  children,
  external = false,
  target,
  rel,
}: LinkButtonProps) {
  const styles = buildButtonClass({
    variant,
    size,
    align,
    uppercase,
    className,
  });

  if (external) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={styles}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}

export default memo(LinkButton);
