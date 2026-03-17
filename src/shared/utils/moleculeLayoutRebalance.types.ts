import type { MoleculeAtom, MoleculeModel } from '@/shared/utils/moleculeEditor';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph';

export type LayoutBranchFn = (
  atomId: string,
  parentAtomId: string | null,
  incomingAngle?: number,
  preferredChildAngles?: number[],
) => void;

export type SharedLayoutParams = {
  model: MoleculeModel;
  componentAtomIds: Set<string>;
  neighborMap: Map<string, NeighborLink[]>;
  originalPositions: Map<string, { x: number; y: number }>;
  nextPositions: Map<string, { x: number; y: number }>;
  visited: Set<string>;
  layoutBranch: LayoutBranchFn;
};

export type CycleLayoutParams = SharedLayoutParams;

export type BackboneLayoutParams = SharedLayoutParams & {
  atomById: Map<string, MoleculeAtom>;
  anchorPosition: { x: number; y: number };
  resolvedAnchorAtomId: string;
};
