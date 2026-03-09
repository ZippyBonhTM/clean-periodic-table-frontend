import type { BondOrder, MoleculeModel } from '@/shared/utils/moleculeEditor';

export type MoleculeEditorViewMode = 'editor' | 'structural' | 'simplified' | 'stick';

export type SavedMoleculeEditorState = {
  selectedAtomId: string | null;
  activeView: MoleculeEditorViewMode;
  bondOrder: BondOrder;
  canvasViewport: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
};

export type SavedMoleculeCompositionEntry = {
  symbol: string;
  name: string;
  count: number;
};

export type SavedMoleculeSummary = {
  formula: string;
  atomCount: number;
  bondCount: number;
  totalBondOrder: number;
  composition: SavedMoleculeCompositionEntry[];
};

export type SavedMolecule = {
  id: string;
  name: string | null;
  educationalDescription: string | null;
  molecule: MoleculeModel;
  editorState: SavedMoleculeEditorState;
  summary: SavedMoleculeSummary;
  createdAt: string;
  updatedAt: string;
};

export type SaveMoleculeInput = {
  name: string | null;
  educationalDescription: string | null;
  molecule: MoleculeModel;
  editorState: SavedMoleculeEditorState;
};
