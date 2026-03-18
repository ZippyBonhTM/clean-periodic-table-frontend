import type { ChemicalElement } from '@/shared/types/element';

export type BondOrder = 1 | 2 | 3;

export type MoleculeEditorIssue =
  | { code: 'missingSourceAtom' }
  | { code: 'bondLimitReached'; symbol: string; limit: number }
  | { code: 'targetBondOrderUnsupported'; symbol: string; order: BondOrder }
  | { code: 'noAttachmentPoint' }
  | { code: 'sameAtomBond' }
  | { code: 'missingBondAtom' };

export type MoleculeElementSnapshot = Pick<
  ChemicalElement,
  'number' | 'symbol' | 'name' | 'category' | 'group' | 'shells'
>;

export type MoleculeAtom = {
  id: string;
  element: MoleculeElementSnapshot;
  x: number;
  y: number;
};

export type MoleculeBond = {
  id: string;
  sourceId: string;
  targetId: string;
  order: BondOrder;
};

export type MoleculeModel = {
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
};

export type MoleculeCounts = {
  atomCount: number;
  bondCount: number;
  totalBondOrder: number;
};

export type MoleculeComponent = {
  atomIds: string[];
  bondIds: string[];
  model: MoleculeModel;
  center: {
    x: number;
    y: number;
  };
  heavyAtomCount: number;
};

export type NormalizedMoleculeModel = {
  model: MoleculeModel;
  atomIdsByOriginalId: Map<string, string[]>;
};
