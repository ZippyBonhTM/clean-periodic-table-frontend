'use client';

import type { MoleculeAtom, BondOrder } from '@/shared/utils/moleculeEditor';

import type { EditorViewMode } from '@/components/organisms/molecular-editor/moleculeCanvasRender.types';

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

export function isCarbonHydrogenBond(source: MoleculeAtom, target: MoleculeAtom): boolean {
  const firstSymbol = source.element.symbol;
  const secondSymbol = target.element.symbol;

  return (
    (firstSymbol === 'C' && secondSymbol === 'H') ||
    (firstSymbol === 'H' && secondSymbol === 'C')
  );
}
