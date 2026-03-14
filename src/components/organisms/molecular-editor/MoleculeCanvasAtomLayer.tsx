'use client';

import { memo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { resolveCategoryColor } from '@/shared/utils/elementPresentation';
import {
  getUsedBondSlots,
  resolveMaxBondSlots,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

import {
  resolveStickAttachedHydrogenCount,
  resolveStickLabelPlacement,
  shouldHideAtomInStick,
  type EditorViewMode,
} from '@/components/organisms/molecular-editor/moleculeCanvasRenderUtils';

type MoleculeCanvasAtomLayerProps = {
  interactive: boolean;
  mode: EditorViewMode;
  model: MoleculeModel;
  onAtomPointerDown?: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
  selectedAtomId: string | null;
};

const MoleculeCanvasAtomLayer = memo(function MoleculeCanvasAtomLayer({
  interactive,
  mode,
  model,
  onAtomPointerDown,
  selectedAtomId,
}: MoleculeCanvasAtomLayerProps) {
  return (
    <>
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
    </>
  );
});

export default MoleculeCanvasAtomLayer;
