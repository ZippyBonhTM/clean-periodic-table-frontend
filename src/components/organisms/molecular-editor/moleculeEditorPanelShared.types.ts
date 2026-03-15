'use client';

import type { ComponentProps } from 'react';

import type MoleculeEditorSection from '@/components/organisms/molecular-editor/MoleculeEditorSection';
import type MoleculeEditorToolRail from '@/components/organisms/molecular-editor/MoleculeEditorToolRail';
import type MoleculeEditorTopBar from '@/components/organisms/molecular-editor/MoleculeEditorTopBar';
import type MoleculePaletteRail from '@/components/organisms/molecular-editor/MoleculePaletteRail';
import type MoleculeSummaryPanel from '@/components/molecules/chemistry/MoleculeSummaryPanel';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';

export type EditorViewMode = SavedMoleculeEditorState['activeView'];
export type BondOrder = 1 | 2 | 3;

export type CompositionRow = {
  symbol: string;
  name: string;
  count: number;
};

export type FormulaRow = ComponentProps<typeof MoleculeSummaryPanel>['rows'][number];
export type PaletteRailProps = ComponentProps<typeof MoleculePaletteRail>;
export type TopBarProps = ComponentProps<typeof MoleculeEditorTopBar>;
export type ToolRailProps = ComponentProps<typeof MoleculeEditorToolRail>;
export type MoleculeEditorSectionProps = ComponentProps<typeof MoleculeEditorSection>;
