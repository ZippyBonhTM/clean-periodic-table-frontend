'use client';

import { memo } from 'react';

import Button from '@/components/atoms/Button';
import type { AppTheme } from '@/shared/hooks/useTheme';

type ThemeToggleProps = {
  theme: AppTheme;
  onToggleTheme: () => void;
};

function ThemeToggle({ theme, onToggleTheme }: ThemeToggleProps) {
  return (
    <Button variant="ghost" onClick={onToggleTheme} className="min-w-24 px-3 py-2 text-xs uppercase tracking-[0.12em]">
      {theme === 'dark' ? 'Light' : 'Night'}
    </Button>
  );
}

export default memo(ThemeToggle);
