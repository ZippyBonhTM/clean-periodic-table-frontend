'use client';

import { usePathname, useRouter } from 'next/navigation';

import useAppHeaderText from '@/components/shared/header/useAppHeaderText';
import { buildBalanceEquationPath, isBalanceEquationPath } from '@/shared/i18n/appLocaleRouting';
import useAppLocale from '@/shared/i18n/useAppLocale';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type AppHeaderLocaleSwitcherProps = {
  mobile?: boolean;
};

const LOCALE_OPTIONS: AppLocale[] = ['en-US', 'pt-BR'];

function AppHeaderLocaleSwitcher({ mobile = false }: AppHeaderLocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useAppLocale();
  const text = useAppHeaderText();

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);

    if (isBalanceEquationPath(pathname)) {
      router.replace(buildBalanceEquationPath(nextLocale));
    }
  };

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-(--border-subtle) bg-black/15 p-1 ${
        mobile ? 'w-full justify-between' : ''
      }`}
      aria-label={text.localeSwitcher.ariaLabel}
    >
      {LOCALE_OPTIONS.map((option) => {
        const isActive = option === locale;
        const optionText = text.localeSwitcher.options[option];

        return (
          <button
            key={option}
            type="button"
            onClick={() => handleLocaleChange(option)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
              mobile ? 'flex-1' : ''
              } ${
              isActive
                ? 'bg-[var(--surface-2)] text-[var(--text-strong)]'
                : 'text-(--text-muted) hover:text-[var(--text-strong)]'
            }`}
            aria-pressed={isActive}
            aria-label={optionText.label}
            title={optionText.label}
          >
            {optionText.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export default AppHeaderLocaleSwitcher;
