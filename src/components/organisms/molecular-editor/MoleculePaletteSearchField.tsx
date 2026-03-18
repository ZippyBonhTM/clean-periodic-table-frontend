'use client';

import type { RefObject } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

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

type MoleculePaletteSearchFieldProps = {
  isLandscapeCompactCanvas: boolean;
  isPaletteSearchOpen: boolean;
  onClearPaletteSearch: () => void;
  onClosePaletteSearch: () => void;
  onPaletteSearchChange: (value: string) => void;
  paletteQuery: string;
  paletteSearchButtonClassName: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export default function MoleculePaletteSearchField({
  isLandscapeCompactCanvas,
  isPaletteSearchOpen,
  onClearPaletteSearch,
  onClosePaletteSearch,
  onPaletteSearchChange,
  paletteQuery,
  paletteSearchButtonClassName,
  searchInputRef,
}: MoleculePaletteSearchFieldProps) {
  const text = useMolecularEditorText();

  return (
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
        placeholder={text.palette.searchPlaceholder}
        className={`w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-(--text-muted) ${
          isLandscapeCompactCanvas ? 'text-[11px]' : 'text-[13px]'
        }`}
      />

      {paletteQuery.trim().length > 0 ? (
        <button
          type="button"
          onClick={onClearPaletteSearch}
          className={`inline-flex shrink-0 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:text-foreground ${paletteSearchButtonClassName}`}
          aria-label={text.palette.clearSearch}
          title={text.palette.clearSearch}
        >
          <CloseChipIcon />
        </button>
      ) : null}
    </div>
  );
}
