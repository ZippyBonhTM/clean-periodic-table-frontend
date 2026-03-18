'use client';

import { memo } from 'react';

import Button from '@/components/atoms/Button';
import useAppLocale from '@/shared/i18n/useAppLocale';
import type { AppTheme } from '@/shared/hooks/useTheme';

type ThemeToggleProps = {
  theme: AppTheme;
  onToggleTheme: () => void;
};

function ThemeToggle({ theme, onToggleTheme }: ThemeToggleProps) {
  const { locale } = useAppLocale();
  const labels =
    locale === 'pt-BR'
      ? {
          light: 'Claro',
          dark: 'Escuro',
          switchToLight: 'Trocar para o tema claro',
          switchToDark: 'Trocar para o tema escuro',
        }
      : {
          light: 'Light',
          dark: 'Dark',
          switchToLight: 'Switch to light theme',
          switchToDark: 'Switch to dark theme',
        };
  const nextThemeLabel = theme === 'dark' ? labels.light : labels.dark;
  const buttonLabel = theme === 'dark' ? labels.switchToLight : labels.switchToDark;

  return (
    <Button
      variant="ghost"
      onClick={onToggleTheme}
      className="min-w-24 px-3 py-2 text-xs uppercase tracking-[0.12em]"
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      {nextThemeLabel}
    </Button>
  );
}

export default memo(ThemeToggle);
