'use client';

import { memo } from 'react';

import type { MoleculeAtom, MoleculeModel } from '@/shared/utils/moleculeEditor';

import {
  isCarbonHydrogenBond,
  resolveBondEndpointInset,
  resolveBondOffsets,
  resolveSecondaryBondOffsetDirection,
  shouldHideBondInStick,
  type EditorViewMode,
} from '@/components/organisms/molecular-editor/moleculeCanvasRenderUtils';

type MoleculeCanvasBondLayerProps = {
  atomById: Map<string, MoleculeAtom>;
  mode: EditorViewMode;
  model: MoleculeModel;
  modelCenter: { x: number; y: number };
};

function BondLines({
  bond,
  source,
  target,
  modelCenter,
  mode,
}: {
  bond: MoleculeModel['bonds'][number];
  source: MoleculeAtom;
  target: MoleculeAtom;
  modelCenter: { x: number; y: number };
  mode: EditorViewMode;
}) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = -dy / distance;
  const ny = dx / distance;
  const doubleBondOffsetDirection =
    bond.order === 2 ? resolveSecondaryBondOffsetDirection(source, target, modelCenter) : 1;
  const offsets =
    bond.order === 2 ? [0, 6 * doubleBondOffsetDirection] : resolveBondOffsets(bond.order);
  const isCarbonHydrogen = isCarbonHydrogenBond(source, target);
  const stroke =
    mode === 'stick'
      ? 'color-mix(in oklab, var(--text-strong) 92%, white)'
      : isCarbonHydrogen
        ? 'color-mix(in oklab, var(--text-strong) 48%, var(--grid-stroke))'
        : 'var(--text-strong)';
  const strokeWidth =
    mode === 'stick'
      ? 3.5
      : isCarbonHydrogen
        ? 2.15
        : 2.75;

  return (
    <g aria-hidden="true">
      {offsets.map((offset) => {
        const inset = resolveBondEndpointInset(mode, bond.order, offset);
        const insetX = (dx / distance) * inset;
        const insetY = (dy / distance) * inset;

        return (
          <line
            key={`${bond.id}-${offset}`}
            x1={source.x + nx * offset + insetX}
            y1={source.y + ny * offset + insetY}
            x2={target.x + nx * offset - insetX}
            y2={target.y + ny * offset - insetY}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={
              isCarbonHydrogen
                ? offset === 0
                  ? mode === 'editor'
                    ? 0.66
                    : 0.74
                  : mode === 'editor'
                    ? 0.54
                    : 0.62
                : offset === 0
                  ? mode === 'editor'
                    ? 0.92
                    : 1
                  : mode === 'editor'
                    ? 0.76
                    : 0.84
            }
          />
        );
      })}
    </g>
  );
}

const MoleculeCanvasBondLayer = memo(function MoleculeCanvasBondLayer({
  atomById,
  mode,
  model,
  modelCenter,
}: MoleculeCanvasBondLayerProps) {
  return (
    <>
      {model.bonds.map((bond) => {
        const source = atomById.get(bond.sourceId) ?? null;
        const target = atomById.get(bond.targetId) ?? null;

        if (source === null || target === null || (mode === 'stick' && shouldHideBondInStick(model, bond))) {
          return null;
        }

        return (
          <BondLines
            key={bond.id}
            bond={bond}
            source={source}
            target={target}
            modelCenter={modelCenter}
            mode={mode}
          />
        );
      })}
    </>
  );
});

export default MoleculeCanvasBondLayer;
