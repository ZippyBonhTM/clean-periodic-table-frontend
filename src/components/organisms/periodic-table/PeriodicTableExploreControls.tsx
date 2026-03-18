'use client';

import type { RefObject } from 'react';

import Button from '@/components/atoms/Button';
import {
  formatPeriodicElementsSummary,
  getPeriodicViewLabel,
} from '@/components/organisms/periodic-table/periodicTableText';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import type { PeriodicViewMode } from './periodicTable.types';
import { VIEW_OPTIONS } from './periodicTable.types';

function WideChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 16 10"
      aria-hidden="true"
      className={`h-1.5 w-2.5 transition-transform duration-200 [transform-origin:50%_50%] ${
        isOpen ? 'rotate-180' : 'rotate-0'
      }`}
      fill="none"
    >
      <path
        d="M1.25 2.25L8 8L14.75 2.25"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PeriodicTableExploreControlsProps = {
  query: string;
  deferredQuery: string;
  isPendingTransition: boolean;
  totalElements: number;
  visibleElementsCount: number;
  viewMode: PeriodicViewMode;
  isViewMenuOpen: boolean;
  isSortMenuOpen: boolean;
  currentSortLabel: string;
  onQueryChange: (value: string) => void;
  onToggleSortMenu: () => void;
  onLuckySearch: () => void;
  onClearQuery: () => void;
  onToggleViewMenu: () => void;
  onSelectViewMode: (mode: PeriodicViewMode) => void;
  sortToggleRef: RefObject<HTMLButtonElement | null>;
  viewToggleRef: RefObject<HTMLButtonElement | null>;
};

export default function PeriodicTableExploreControls({
  query,
  deferredQuery,
  isPendingTransition,
  totalElements,
  visibleElementsCount,
  viewMode,
  isViewMenuOpen,
  isSortMenuOpen,
  currentSortLabel,
  onQueryChange,
  onToggleSortMenu,
  onLuckySearch,
  onClearQuery,
  onToggleViewMenu,
  onSelectViewMode,
  sortToggleRef,
  viewToggleRef,
}: PeriodicTableExploreControlsProps) {
  const text = usePeriodicTableText();

  return (
    <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] overflow-visible [contain:none] p-4 md:p-5">
      <div className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start">
        <div className="min-w-0 min-[768px]:flex-[1_1_360px]">
          <label
            htmlFor="element-search"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]"
          >
            {text.explore.searchLabel}
          </label>
          <input
            id="element-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={text.explore.searchPlaceholder}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)]"
          />

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="relative">
              <label
                htmlFor="sort-mode-toggle"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]"
              >
                {text.explore.sortLabel}
              </label>
              <Button
                id="sort-mode-toggle"
                type="button"
                ref={sortToggleRef}
                variant="ghost"
                size="md"
                align="between"
                className="min-w-[172px] whitespace-nowrap"
                onClick={onToggleSortMenu}
                aria-expanded={isSortMenuOpen}
                aria-label={text.menus.toggleSort}
              >
                <span>{currentSortLabel}</span>
                <WideChevron isOpen={isSortMenuOpen} />
              </Button>
            </div>

            <Button type="button" variant="ghost" size="md" onClick={onLuckySearch}>
              {text.explore.luckySearch}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={onClearQuery}>
              {text.explore.clear}
            </Button>

            <div className="relative min-[768px]:hidden">
              <Button
                type="button"
                ref={viewToggleRef}
                variant="ghost"
                size="md"
                align="between"
                className="min-w-[108px] whitespace-nowrap"
                onClick={onToggleViewMenu}
                aria-expanded={isViewMenuOpen}
                aria-label={text.menus.toggleView}
              >
                {text.explore.viewLabel}
                <WideChevron isOpen={isViewMenuOpen} />
              </Button>
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {formatPeriodicElementsSummary(text, visibleElementsCount, totalElements)}
          </p>
          {query !== deferredQuery || isPendingTransition ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{text.explore.updatingView}</p>
          ) : null}
        </div>

        <div className="hidden min-[768px]:ml-auto min-[768px]:w-fit min-[768px]:shrink-0 min-[768px]:block">
          <div className="rounded-xl border border-[var(--border-subtle)] px-2.5 py-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {text.explore.viewLabel}
            </p>
            <div className="flex flex-col items-start gap-1.5">
              {VIEW_OPTIONS.map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={mode === viewMode ? 'secondary' : 'ghost'}
                  size="sm"
                  align="left"
                  onClick={() => onSelectViewMode(mode)}
                  className="w-full"
                >
                  {getPeriodicViewLabel(text, mode)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
