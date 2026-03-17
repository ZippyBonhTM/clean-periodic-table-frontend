'use client';

import type { MoleculeAtom, MoleculeModel } from '@/shared/utils/moleculeEditor';

import { resolveStickVisibleNeighborAtoms } from '@/components/organisms/molecular-editor/moleculeCanvasStickVisibility';

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
