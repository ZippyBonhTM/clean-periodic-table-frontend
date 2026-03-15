'use client';

import type { CSSProperties, RefObject } from 'react';

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="3.8" />
      <path d="m10.2 10.2 2.6 2.6" />
    </svg>
  );
}

function CloseChipIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

type MoleculePaletteSearchRailProps = {
  isLandscapeCompactCanvas: boolean;
  isPaletteSearchOpen: boolean;
  onClearPaletteSearch: () => void;
  onClosePaletteSearch: () => void;
  onPaletteSearchChange: (value: string) => void;
  onTogglePaletteSearch: () => void;
  paletteQuery: string;
  paletteSearchButtonClassName: string;
  paletteSearchInnerStyle: CSSProperties;
  paletteSearchPanelStyle: CSSProperties;
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  paletteSearchRailStyle: CSSProperties;
  paletteSearchShellClassName: string;
  paletteSearchTriggerStyle: CSSProperties;
  searchInputRef: RefObject<HTMLInputElement | null>;
  shouldShowActivePaletteFilter: boolean;
};

export default function MoleculePaletteSearchRail({
  isLandscapeCompactCanvas,
  isPaletteSearchOpen,
  onClearPaletteSearch,
  onClosePaletteSearch,
  onPaletteSearchChange,
  onTogglePaletteSearch,
  paletteQuery,
  paletteSearchButtonClassName,
  paletteSearchInnerStyle,
  paletteSearchPanelStyle,
  paletteSearchRailRef,
  paletteSearchRailStyle,
  paletteSearchShellClassName,
  paletteSearchTriggerStyle,
  searchInputRef,
  shouldShowActivePaletteFilter,
}: MoleculePaletteSearchRailProps) {
  return (
    <div ref={paletteSearchRailRef} style={paletteSearchRailStyle} className="absolute z-20">
      <div
        style={paletteSearchPanelStyle}
        className={`pointer-events-auto flex flex-nowrap items-stretch overflow-hidden border bg-(--surface-overlay-strong) shadow-lg backdrop-blur-xl origin-left transition-[width,border-color] duration-200 ${paletteSearchShellClassName} ${
          shouldShowActivePaletteFilter ? 'border-(--accent)' : 'border-(--border-subtle)'
        }`}
      >
        <div style={paletteSearchInnerStyle} className="flex h-full flex-nowrap items-stretch">
          <div style={paletteSearchTriggerStyle} className="flex h-full shrink-0 items-center justify-center">
            <button
              type="button"
              onClick={onTogglePaletteSearch}
              className="inline-flex h-full w-full items-center justify-center text-(--text-muted) transition-colors hover:text-foreground"
              aria-label={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
              title={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
            >
              <SearchIcon />
            </button>
          </div>

          <div
            className={`flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden pr-1.5 ${
              isPaletteSearchOpen ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            aria-hidden={!isPaletteSearchOpen}
          >
            <input
              ref={searchInputRef}
              id="molecule-element-search"
              name="molecule-element-search"
              type="text"
              value={paletteQuery}
              onChange={(event) => {
                onPaletteSearchChange(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' || event.key === 'Enter') {
                  onClosePaletteSearch();
                }
              }}
              tabIndex={isPaletteSearchOpen ? undefined : -1}
              placeholder="Search"
              className={`w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-(--text-muted) ${
                isLandscapeCompactCanvas ? 'text-[11px]' : 'text-[13px]'
              }`}
            />

            {paletteQuery.trim().length > 0 ? (
              <button
                type="button"
                onClick={onClearPaletteSearch}
                className={`inline-flex shrink-0 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:text-foreground ${paletteSearchButtonClassName}`}
                aria-label="Clear element search"
                title="Clear element search"
              >
                <CloseChipIcon />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
