'use client';

import { useMemo } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent as ReactWheelEvent,
} from 'react';

import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import { resolveCategoryColor } from '@/shared/utils/elementPresentation';
import {
  findAtom,
  getUsedBondSlots,
  resolveMaxBondSlots,
  type BondOrder,
  type MoleculeAtom,
  type MoleculeBond,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

function resolveModelCenter(model: MoleculeModel): { x: number; y: number } {
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

function resolveBondOffsets(order: BondOrder): number[] {
  if (order === 1) {
    return [0];
  }

  if (order === 2) {
    return [0, 6];
  }

  return [-8, 0, 8];
}

function resolveBondLineInset(order: BondOrder, offset: number): number {
  if (order === 1 || offset === 0) {
    return 0;
  }

  if (order === 2) {
    return 12;
  }

  return 14;
}

function resolveAtomVisualRadius(mode: EditorViewMode): number {
  if (mode === 'editor') {
    return 17;
  }

  if (mode === 'stick') {
    return 0;
  }

  return 12;
}

function resolveBondEndpointInset(mode: EditorViewMode, order: BondOrder, offset: number): number {
  if (mode === 'stick') {
    return resolveBondLineInset(order, offset);
  }

  const atomRadius = resolveAtomVisualRadius(mode);
  const radialOffset = Math.min(Math.abs(offset), atomRadius - 1);
  const circleIntersectionInset = Math.sqrt(Math.max(0, atomRadius * atomRadius - radialOffset * radialOffset));

  return Math.max(resolveBondLineInset(order, offset), circleIntersectionInset + 1.5);
}

function resolveSecondaryBondOffsetDirection(
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

function shouldHideHydrogenInStick(model: MoleculeModel, atom: MoleculeAtom): boolean {
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

function resolveStickAttachedHydrogenCount(model: MoleculeModel, atom: MoleculeAtom): number {
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

function resolveStickVisibleNeighborAtoms(model: MoleculeModel, atom: MoleculeAtom): MoleculeAtom[] {
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

function resolveEstimatedStickLabelSize(atom: MoleculeAtom, hydrogenCount: number): {
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

function resolveStickLabelPlacement(
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

function shouldHideAtomInStick(model: MoleculeModel, atom: MoleculeAtom): boolean {
  if (atom.element.symbol === 'C') {
    return true;
  }

  return shouldHideHydrogenInStick(model, atom);
}

function shouldHideBondInStick(model: MoleculeModel, bond: MoleculeBond): boolean {
  const sourceAtom = findAtom(model, bond.sourceId);
  const targetAtom = findAtom(model, bond.targetId);

  if (sourceAtom === null || targetAtom === null) {
    return false;
  }

  return shouldHideHydrogenInStick(model, sourceAtom) || shouldHideHydrogenInStick(model, targetAtom);
}

function isCarbonHydrogenBond(source: MoleculeAtom, target: MoleculeAtom): boolean {
  const firstSymbol = source.element.symbol;
  const secondSymbol = target.element.symbol;

  return (
    (firstSymbol === 'C' && secondSymbol === 'H') ||
    (firstSymbol === 'H' && secondSymbol === 'C')
  );
}

function BondLines({
  bond,
  source,
  target,
  modelCenter,
  mode,
}: {
  bond: MoleculeBond;
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

type EditorCanvasProps = {
  model: MoleculeModel;
  mode: EditorViewMode;
  viewBox: { x: number; y: number; width: number; height: number };
  selectedAtomId: string | null;
  svgRef?: RefObject<SVGSVGElement | null>;
  onCanvasPointerDown?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerMove?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerUp?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerCancel?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasWheel?: (event: ReactWheelEvent<SVGSVGElement>) => void;
  onAtomPointerDown?: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
  interactive?: boolean;
  showGrid?: boolean;
  ariaLabel?: string;
};

export default function EditorCanvas({
  model,
  mode,
  viewBox,
  selectedAtomId,
  svgRef,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasPointerCancel,
  onCanvasWheel,
  onAtomPointerDown,
  interactive = true,
  showGrid = true,
  ariaLabel = 'Molecule editor canvas',
}: EditorCanvasProps) {
  const atomById = useMemo(() => {
    return new Map(model.atoms.map((atom) => [atom.id, atom]));
  }, [model.atoms]);
  const modelCenter = resolveModelCenter(model);

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={`absolute inset-0 h-full w-full select-none ${interactive ? 'touch-none' : 'pointer-events-none'}`}
      style={{ touchAction: interactive ? 'none' : 'auto', userSelect: 'none' }}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={interactive ? onCanvasPointerDown : undefined}
      onPointerMove={interactive ? onCanvasPointerMove : undefined}
      onPointerUp={interactive ? onCanvasPointerUp : undefined}
      onPointerCancel={interactive ? onCanvasPointerCancel : undefined}
      onWheel={interactive ? onCanvasWheel : undefined}
    >
      {showGrid ? (
        <>
          <defs>
            <pattern id="molecule-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--grid-stroke)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#molecule-grid)" />
        </>
      ) : null}

      {model.bonds.map((bond) => {
        const source = atomById.get(bond.sourceId) ?? null;
        const target = atomById.get(bond.targetId) ?? null;

        if (source === null || target === null || (mode === 'stick' && shouldHideBondInStick(model, bond))) {
          return null;
        }

        return <BondLines key={bond.id} bond={bond} source={source} target={target} modelCenter={modelCenter} mode={mode} />;
      })}

      {model.atoms.map((atom) => {
        const isSelected = atom.id === selectedAtomId;
        const color = resolveCategoryColor(atom.element.category).rgb;
        const hideInStick = mode === 'stick' && shouldHideAtomInStick(model, atom);

        if (hideInStick) {
          return null;
        }

        const showEditorBadge = mode === 'editor';
        const showStructuralBadge = mode === 'structural';
        const atomRadius = showEditorBadge ? 17 : 12;
        const strokeWidth = isSelected ? 4 : 2;
        const maxBondSlots = showEditorBadge ? resolveMaxBondSlots(atom.element) : 0;
        const usedBondSlots = showEditorBadge ? getUsedBondSlots(model, atom.id) : 0;
        const hasOpenValence = showEditorBadge && maxBondSlots > usedBondSlots;
        const fill = showEditorBadge
          ? `rgba(${color}, 0.22)`
          : `color-mix(in oklab, rgba(${color}, 0.16) 60%, var(--surface-2))`;
        const textFill = 'var(--text-strong)';
        const stickAttachedHydrogenCount = mode === 'stick' ? resolveStickAttachedHydrogenCount(model, atom) : 0;
        const stickLabelPlacement =
          mode === 'stick' ? resolveStickLabelPlacement(model, atom, stickAttachedHydrogenCount) : null;

        return (
          <g
            key={atom.id}
            onPointerDown={
              interactive && onAtomPointerDown !== undefined
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onAtomPointerDown(atom.id, event);
                  }
                : undefined
            }
            className={mode === 'editor' ? 'cursor-pointer' : undefined}
          >
            {mode === 'stick' ? (
              <>
                <circle cx={atom.x} cy={atom.y} r={18} fill="transparent" stroke="none" pointerEvents="all" />
                <text
                  x={stickLabelPlacement?.x ?? atom.x}
                  y={stickLabelPlacement?.y ?? atom.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fontWeight={isSelected ? '900' : '800'}
                  fill={isSelected ? 'var(--accent-strong)' : textFill}
                  stroke="var(--surface-1)"
                  strokeWidth="4"
                  paintOrder="stroke"
                  letterSpacing={stickAttachedHydrogenCount > 0 ? '-0.01em' : undefined}
                >
                  {atom.element.symbol}
                  {stickAttachedHydrogenCount > 0 ? (
                    <>
                      <tspan dx="0.5">H</tspan>
                      {stickAttachedHydrogenCount > 1 ? (
                        <tspan fontSize="10" baselineShift="sub">
                          {stickAttachedHydrogenCount}
                        </tspan>
                      ) : null}
                    </>
                  ) : null}
                </text>
              </>
            ) : (
              <>
                {hasOpenValence ? (
                  <circle
                    cx={atom.x}
                    cy={atom.y}
                    r={atomRadius + 5}
                    fill="none"
                    stroke="rgba(245, 158, 11, 0.92)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                ) : null}
                <circle
                  cx={atom.x}
                  cy={atom.y}
                  r={atomRadius}
                  fill={fill}
                  stroke={isSelected ? 'var(--accent-strong)' : `rgba(${color}, 0.5)`}
                  strokeWidth={strokeWidth}
                />
                {showEditorBadge ? (
                  <text
                    x={atom.x}
                    y={atom.y + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill={textFill}
                  >
                    {atom.element.symbol}
                  </text>
                ) : showStructuralBadge ? (
                  <text
                    x={atom.x}
                    y={atom.y + 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={textFill}
                  >
                    {atom.element.symbol}
                  </text>
                ) : (
                  <text
                    x={atom.x}
                    y={atom.y + 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={textFill}
                  >
                    {atom.element.symbol}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
