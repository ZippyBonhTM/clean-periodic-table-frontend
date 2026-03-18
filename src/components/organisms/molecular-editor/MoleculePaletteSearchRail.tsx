'use client';

import type { CSSProperties, RefObject } from 'react';

import MoleculePaletteSearchField from '@/components/organisms/molecular-editor/MoleculePaletteSearchField';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

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
  const text = useMolecularEditorText();

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
              aria-label={isPaletteSearchOpen ? text.palette.closeSearch : text.palette.openSearch}
              title={isPaletteSearchOpen ? text.palette.closeSearch : text.palette.openSearch}
            >
              <SearchIcon />
            </button>
          </div>

          <MoleculePaletteSearchField
            isLandscapeCompactCanvas={isLandscapeCompactCanvas}
            isPaletteSearchOpen={isPaletteSearchOpen}
            onClearPaletteSearch={onClearPaletteSearch}
            onClosePaletteSearch={onClosePaletteSearch}
            onPaletteSearchChange={onPaletteSearchChange}
            paletteQuery={paletteQuery}
            paletteSearchButtonClassName={paletteSearchButtonClassName}
            searchInputRef={searchInputRef}
          />
        </div>
      </div>
    </div>
  );
}
