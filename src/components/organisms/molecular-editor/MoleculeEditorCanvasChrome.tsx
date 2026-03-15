'use client';

import type { CSSProperties, ComponentProps, RefObject } from 'react';

import MoleculeEditorToolRail from '@/components/organisms/molecular-editor/MoleculeEditorToolRail';
import MoleculePaletteRail from '@/components/organisms/molecular-editor/MoleculePaletteRail';
import MoleculePaletteSearchRail from '@/components/organisms/molecular-editor/MoleculePaletteSearchRail';

type MoleculeEditorCanvasChromeProps = {
  isLandscapeCompactCanvas: boolean;
  isPaletteSearchOpen: boolean;
  onClearPaletteSearch: () => void;
  onClosePaletteSearch: () => void;
  onPaletteSearchChange: (value: string) => void;
  onTogglePaletteSearch: () => void;
  paletteQuery: string;
  paletteRailProps: ComponentProps<typeof MoleculePaletteRail>;
  paletteSearchButtonClassName: string;
  paletteSearchInnerStyle: CSSProperties;
  paletteSearchPanelStyle: CSSProperties;
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  paletteSearchRailStyle: CSSProperties;
  paletteSearchShellClassName: string;
  paletteSearchTriggerStyle: CSSProperties;
  searchInputRef: RefObject<HTMLInputElement | null>;
  shouldShowActivePaletteFilter: boolean;
  toolRailProps: ComponentProps<typeof MoleculeEditorToolRail>;
};

export default function MoleculeEditorCanvasChrome({
  isLandscapeCompactCanvas,
  isPaletteSearchOpen,
  onClearPaletteSearch,
  onClosePaletteSearch,
  onPaletteSearchChange,
  onTogglePaletteSearch,
  paletteQuery,
  paletteRailProps,
  paletteSearchButtonClassName,
  paletteSearchInnerStyle,
  paletteSearchPanelStyle,
  paletteSearchRailRef,
  paletteSearchRailStyle,
  paletteSearchShellClassName,
  paletteSearchTriggerStyle,
  searchInputRef,
  shouldShowActivePaletteFilter,
  toolRailProps,
}: MoleculeEditorCanvasChromeProps) {
  return (
    <>
      <MoleculePaletteRail {...paletteRailProps} />

      <MoleculePaletteSearchRail
        isLandscapeCompactCanvas={isLandscapeCompactCanvas}
        isPaletteSearchOpen={isPaletteSearchOpen}
        onClearPaletteSearch={onClearPaletteSearch}
        onClosePaletteSearch={onClosePaletteSearch}
        onPaletteSearchChange={onPaletteSearchChange}
        onTogglePaletteSearch={onTogglePaletteSearch}
        paletteQuery={paletteQuery}
        paletteSearchButtonClassName={paletteSearchButtonClassName}
        paletteSearchInnerStyle={paletteSearchInnerStyle}
        paletteSearchPanelStyle={paletteSearchPanelStyle}
        paletteSearchRailRef={paletteSearchRailRef}
        paletteSearchRailStyle={paletteSearchRailStyle}
        paletteSearchShellClassName={paletteSearchShellClassName}
        paletteSearchTriggerStyle={paletteSearchTriggerStyle}
        searchInputRef={searchInputRef}
        shouldShowActivePaletteFilter={shouldShowActivePaletteFilter}
      />

      <MoleculeEditorToolRail {...toolRailProps} />
    </>
  );
}
