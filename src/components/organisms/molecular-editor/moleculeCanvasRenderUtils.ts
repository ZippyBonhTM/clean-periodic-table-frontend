'use client';

import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import {
  findAtom,
  type BondOrder,
  type MoleculeAtom,
  type MoleculeBond,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

export type EditorViewMode = SavedMoleculeEditorState['activeView'];

export function resolveModelCenter(model: MoleculeModel): { x: number; y: number } {
  if (model.atoms.length === 0) {
    return { x: 0, y: 0 };
  }

  const sums = model.atoms.reduce(
    (current, atom) => ({
      x: current.x + atom.x,
      y: current.y + atom.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: sums.x / model.atoms.length,
    y: sums.y / model.atoms.length,
  };
}

export function resolveBondOffsets(order: BondOrder): number[] {
  if (order === 1) {
    return [0];
  }

  if (order === 2) {
    return [0, 6];
  }

  return [-8, 0, 8];
}

export function resolveBondLineInset(order: BondOrder, offset: number): number {
  if (order === 1 || offset === 0) {
    return 0;
  }

  if (order === 2) {
    return 12;
  }

  return 14;
}

export function resolveAtomVisualRadius(mode: EditorViewMode): number {
  if (mode === 'editor') {
    return 17;
  }

  if (mode === 'stick') {
    return 0;
  }

  return 12;
}

export function resolveBondEndpointInset(mode: EditorViewMode, order: BondOrder, offset: number): number {
  if (mode === 'stick') {
    return resolveBondLineInset(order, offset);
  }

  const atomRadius = resolveAtomVisualRadius(mode);
  const radialOffset = Math.min(Math.abs(offset), atomRadius - 1);
  const circleIntersectionInset = Math.sqrt(Math.max(0, atomRadius * atomRadius - radialOffset * radialOffset));

  return Math.max(resolveBondLineInset(order, offset), circleIntersectionInset + 1.5);
}

export function resolveSecondaryBondOffsetDirection(
  source: MoleculeAtom,
  target: MoleculeAtom,
  referencePoint: { x: number; y: number },
): 1 | -1 {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = -dy / distance;
  const ny = dx / distance;
  const midpoint = {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };
  const testOffset = 6;
  const positivePoint = {
    x: midpoint.x + nx * testOffset,
    y: midpoint.y + ny * testOffset,
  };
  const negativePoint = {
    x: midpoint.x - nx * testOffset,
    y: midpoint.y - ny * testOffset,
  };
  const positiveDistance = Math.hypot(referencePoint.x - positivePoint.x, referencePoint.y - positivePoint.y);
  const negativeDistance = Math.hypot(referencePoint.x - negativePoint.x, referencePoint.y - negativePoint.y);

  return positiveDistance <= negativeDistance ? 1 : -1;
}

export function shouldHideHydrogenInStick(model: MoleculeModel, atom: MoleculeAtom): boolean {
  if (atom.element.symbol !== 'H') {
    return false;
  }

  const attachedBonds = model.bonds.filter((bond) => bond.sourceId === atom.id || bond.targetId === atom.id);

  if (attachedBonds.length !== 1) {
    return false;
  }

  const attachedBond = attachedBonds[0];
  const neighborAtomId = attachedBond.sourceId === atom.id ? attachedBond.targetId : attachedBond.sourceId;
  const neighborAtom = findAtom(model, neighborAtomId);

  if (neighborAtom === null) {
    return false;
  }

  if (neighborAtom.element.symbol === 'C') {
    return true;
  }

  if (neighborAtom.element.symbol === 'H' || attachedBond.order !== 1) {
    return false;
  }

  return model.bonds.some((bond) => {
    if (bond.sourceId !== neighborAtom.id && bond.targetId !== neighborAtom.id) {
      return false;
    }

    const bondedAtomId = bond.sourceId === neighborAtom.id ? bond.targetId : bond.sourceId;

    if (bondedAtomId === atom.id) {
      return false;
    }

    const bondedAtom = findAtom(model, bondedAtomId);
    return bondedAtom !== null && bondedAtom.element.symbol !== 'H';
  });
}

export function resolveStickAttachedHydrogenCount(model: MoleculeModel, atom: MoleculeAtom): number {
  if (atom.element.symbol === 'C' || atom.element.symbol === 'H') {
    return 0;
  }

  return model.bonds.reduce((count, bond) => {
    if (bond.sourceId !== atom.id && bond.targetId !== atom.id) {
      return count;
    }

    const neighborAtomId = bond.sourceId === atom.id ? bond.targetId : bond.sourceId;
    const neighborAtom = findAtom(model, neighborAtomId);

    if (neighborAtom === null || !shouldHideHydrogenInStick(model, neighborAtom)) {
      return count;
    }

    return count + 1;
  }, 0);
}

export function resolveStickVisibleNeighborAtoms(model: MoleculeModel, atom: MoleculeAtom): MoleculeAtom[] {
  return model.bonds.flatMap((bond) => {
    if (bond.sourceId !== atom.id && bond.targetId !== atom.id) {
      return [];
    }

    const neighborAtomId = bond.sourceId === atom.id ? bond.targetId : bond.sourceId;
    const neighborAtom = findAtom(model, neighborAtomId);

    if (neighborAtom === null || shouldHideHydrogenInStick(model, neighborAtom)) {
      return [];
    }

    return [neighborAtom];
  });
}

export function resolveEstimatedStickLabelSize(atom: MoleculeAtom, hydrogenCount: number): {
  width: number;
  height: number;
} {
  const symbolWidth = atom.element.symbol.length === 1 ? 10 : 16;
  const hydrogenWidth =
    hydrogenCount === 0
      ? 0
      : hydrogenCount === 1
        ? 10
        : 14 + Math.max(0, String(hydrogenCount).length - 1) * 4;

  return {
    width: symbolWidth + hydrogenWidth,
    height: hydrogenCount > 1 ? 16 : 14,
  };
}

export function resolveStickLabelPlacement(
  model: MoleculeModel,
  atom: MoleculeAtom,
  hydrogenCount: number,
): {
  x: number;
  y: number;
} {
  const visibleNeighbors = resolveStickVisibleNeighborAtoms(model, atom);

  if (visibleNeighbors.length === 0) {
    return {
      x: atom.x,
      y: atom.y,
    };
  }

  const averageVector = visibleNeighbors.reduce(
    (current, neighborAtom) => ({
      x: current.x + (neighborAtom.x - atom.x),
      y: current.y + (neighborAtom.y - atom.y),
    }),
    { x: 0, y: 0 },
  );
  const vectorLength = Math.hypot(averageVector.x, averageVector.y);

  if (vectorLength === 0) {
    return {
      x: atom.x,
      y: atom.y,
    };
  }

  const outwardUnitX = -(averageVector.x / vectorLength);
  const outwardUnitY = -(averageVector.y / vectorLength);
  const labelSize = resolveEstimatedStickLabelSize(atom, hydrogenCount);
  const labelProjectionRadius =
    Math.abs(outwardUnitX) * (labelSize.width / 2) + Math.abs(outwardUnitY) * (labelSize.height / 2);
  const offsetDistance = labelProjectionRadius + (hydrogenCount > 0 ? 6 : 5);

  return {
    x: atom.x + outwardUnitX * offsetDistance,
    y: atom.y + outwardUnitY * offsetDistance,
  };
}

export function shouldHideAtomInStick(model: MoleculeModel, atom: MoleculeAtom): boolean {
  if (atom.element.symbol === 'C') {
    return true;
  }

  return shouldHideHydrogenInStick(model, atom);
}

export function shouldHideBondInStick(model: MoleculeModel, bond: MoleculeBond): boolean {
  const sourceAtom = findAtom(model, bond.sourceId);
  const targetAtom = findAtom(model, bond.targetId);

  if (sourceAtom === null || targetAtom === null) {
    return false;
  }

  return shouldHideHydrogenInStick(model, sourceAtom) || shouldHideHydrogenInStick(model, targetAtom);
}

export function isCarbonHydrogenBond(source: MoleculeAtom, target: MoleculeAtom): boolean {
  const firstSymbol = source.element.symbol;
  const secondSymbol = target.element.symbol;

  return (
    (firstSymbol === 'C' && secondSymbol === 'H') ||
    (firstSymbol === 'H' && secondSymbol === 'C')
  );
}
