'use client';

import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

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
