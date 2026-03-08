'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import Button from '@/components/atoms/Button';
import type { ChemicalElement } from '@/shared/types/element';
import {
  matchesElementQuery,
  resolveCategoryColor,
  resolveElementQueryRank,
} from '@/shared/utils/elementPresentation';
import {
  addAttachedAtom,
  addStandaloneAtom,
  buildCompositionRows,
  buildMolecularFormula,
  connectAtoms,
  findAtom,
  rebalanceMoleculeLayout,
  removeAtom,
  resolveMaxBondSlots,
  summarizeMolecule,
  type BondOrder,
  type MoleculeAtom,
  type MoleculeBond,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

type MolecularEditorProps = {
  elements: ChemicalElement[];
};

type EditorViewMode = 'editor' | 'structural' | 'simplified' | 'stick';

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type CanvasViewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

type CanvasInteraction =
  | {
      type: 'idle';
    }
  | {
      type: 'canvas-press';
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startPoint: {
        x: number;
        y: number;
      };
      startOffsetX: number;
      startOffsetY: number;
      canPan: boolean;
      moved: boolean;
    }
  | {
      type: 'atom-press';
      pointerId: number;
      atomId: string;
      startClientX: number;
      startClientY: number;
      startOffsetX: number;
      startOffsetY: number;
      mode: 'select' | 'pan';
      moved: boolean;
    };

type SavedEditorDraft = {
  molecule: MoleculeModel;
  selectedAtomId: string | null;
  activeView: EditorViewMode;
  bondOrder: BondOrder;
  canvasViewport: CanvasViewport;
};

const VIEW_OPTIONS: Array<{ mode: EditorViewMode; label: string }> = [
  { mode: 'editor', label: 'Editor' },
  { mode: 'structural', label: 'Structural' },
  { mode: 'simplified', label: 'Simplified' },
  { mode: 'stick', label: 'Stick' },
];

const BOND_ORDER_OPTIONS: Array<{ order: BondOrder; label: string }> = [
  { order: 1, label: 'Single' },
  { order: 2, label: 'Double' },
  { order: 3, label: 'Triple' },
];

const EMPTY_MOLECULE: MoleculeModel = {
  atoms: [],
  bonds: [],
};

const DEFAULT_CANVAS_VIEWPORT: CanvasViewport = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const DEFAULT_VIEWBOX = {
  x: -240,
  y: -180,
  width: 480,
  height: 360,
};

const DRAG_THRESHOLD_PX = 6;
const CANVAS_DOUBLE_PRESS_DELAY_MS = 320;
const CANVAS_DOUBLE_PRESS_DISTANCE_PX = 18;
const CANVAS_ZOOM_MIN = 0.5;
const CANVAS_ZOOM_MAX = 3;
const CANVAS_ZOOM_STEP = 1.15;
const PALETTE_GESTURE_STEP_MIN = 18;
const PALETTE_GESTURE_STEP_MAX = 32;
const PALETTE_GESTURE_STEP_RATIO = 0.58;
const PALETTE_MOMENTUM_DECAY = 0.9;
const PALETTE_MOMENTUM_MIN_SPEED = 0.08;
const PALETTE_MOMENTUM_IDLE_RELEASE_MS = 90;
const PALETTE_TILE_LONG_PRESS_MS = 260;
const EDITOR_HISTORY_LIMIT = 80;

function cloneMoleculeModel(model: MoleculeModel): MoleculeModel {
  return {
    atoms: model.atoms.map((atom) => ({ ...atom })),
    bonds: model.bonds.map((bond) => ({ ...bond })),
  };
}

function normalizeSnapshotSelectedAtomId(model: MoleculeModel, selectedAtomId: string | null): string | null {
  return selectedAtomId !== null && model.atoms.some((atom) => atom.id === selectedAtomId) ? selectedAtomId : null;
}

function cloneEditorSnapshot(snapshot: SavedEditorDraft): SavedEditorDraft {
  return {
    molecule: cloneMoleculeModel(snapshot.molecule),
    selectedAtomId: normalizeSnapshotSelectedAtomId(snapshot.molecule, snapshot.selectedAtomId),
    activeView: snapshot.activeView,
    bondOrder: snapshot.bondOrder,
    canvasViewport: {
      offsetX: snapshot.canvasViewport.offsetX,
      offsetY: snapshot.canvasViewport.offsetY,
      scale: snapshot.canvasViewport.scale,
    },
  };
}

function isTextEditingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') !== null
  );
}

function resolveBounds(model: MoleculeModel): Bounds | null {
  if (model.atoms.length === 0) {
    return null;
  }

  return model.atoms.reduce<Bounds>(
    (current, atom) => ({
      minX: Math.min(current.minX, atom.x),
      maxX: Math.max(current.maxX, atom.x),
      minY: Math.min(current.minY, atom.y),
      maxY: Math.max(current.maxY, atom.y),
    }),
    {
      minX: model.atoms[0].x,
      maxX: model.atoms[0].x,
      minY: model.atoms[0].y,
      maxY: model.atoms[0].y,
    },
  );
}

function resolveViewBox(model: MoleculeModel) {
  const bounds = resolveBounds(model);

  if (bounds === null) {
    return DEFAULT_VIEWBOX;
  }

  const margin = 120;
  const width = Math.max(bounds.maxX - bounds.minX + margin * 2, 420);
  const height = Math.max(bounds.maxY - bounds.minY + margin * 2, 320);

  return {
    x: bounds.minX - margin,
    y: bounds.minY - margin,
    width,
    height,
  };
}

function resolveModelVisualCenter(model: MoleculeModel): { x: number; y: number } | null {
  const bounds = resolveBounds(model);

  if (bounds === null) {
    return null;
  }

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

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

function resolveInteractiveViewBox(
  model: MoleculeModel,
  viewport: CanvasViewport,
  frameAspectRatio?: number,
) {
  const baseViewBox = resolveViewBox(model);
  let width = baseViewBox.width / viewport.scale;
  let height = baseViewBox.height / viewport.scale;

  if (frameAspectRatio !== undefined && Number.isFinite(frameAspectRatio) && frameAspectRatio > 0) {
    const currentAspectRatio = width / height;

    if (currentAspectRatio < frameAspectRatio) {
      width = height * frameAspectRatio;
    } else if (currentAspectRatio > frameAspectRatio) {
      height = width / frameAspectRatio;
    }
  }

  const centerX = baseViewBox.x + baseViewBox.width / 2 + viewport.offsetX;
  const centerY = baseViewBox.y + baseViewBox.height / 2 + viewport.offsetY;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

function resolveScaledViewBoxMetrics(
  model: MoleculeModel,
  scale: number,
  frameAspectRatio?: number,
) {
  const baseViewBox = resolveViewBox(model);
  let width = baseViewBox.width / scale;
  let height = baseViewBox.height / scale;

  if (frameAspectRatio !== undefined && Number.isFinite(frameAspectRatio) && frameAspectRatio > 0) {
    const currentAspectRatio = width / height;

    if (currentAspectRatio < frameAspectRatio) {
      width = height * frameAspectRatio;
    } else if (currentAspectRatio > frameAspectRatio) {
      height = width / frameAspectRatio;
    }
  }

  return {
    baseViewBox,
    width,
    height,
    centerX: baseViewBox.x + baseViewBox.width / 2,
    centerY: baseViewBox.y + baseViewBox.height / 2,
  };
}

function preserveViewportAcrossModelChange(
  previousModel: MoleculeModel,
  nextModel: MoleculeModel,
  viewport: CanvasViewport,
  frameAspectRatio?: number,
  anchorPoint?: { x: number; y: number },
): CanvasViewport {
  const previousViewBox = resolveInteractiveViewBox(previousModel, viewport, frameAspectRatio);
  const previousVisualCenter = resolveModelVisualCenter(previousModel);
  const nextVisualCenter = resolveModelVisualCenter(nextModel);
  const previousAnchor = anchorPoint ?? previousVisualCenter ?? {
    x: previousViewBox.x + previousViewBox.width / 2,
    y: previousViewBox.y + previousViewBox.height / 2,
  };
  const nextAnchor = anchorPoint ?? nextVisualCenter ?? previousAnchor;
  const ratioX =
    previousViewBox.width === 0 ? 0.5 : (previousAnchor.x - previousViewBox.x) / previousViewBox.width;
  const ratioY =
    previousViewBox.height === 0 ? 0.5 : (previousAnchor.y - previousViewBox.y) / previousViewBox.height;
  const nextMetrics = resolveScaledViewBoxMetrics(nextModel, viewport.scale, frameAspectRatio);
  const nextX = nextAnchor.x - ratioX * nextMetrics.width;
  const nextY = nextAnchor.y - ratioY * nextMetrics.height;

  return {
    ...viewport,
    offsetX: nextX + nextMetrics.width / 2 - nextMetrics.centerX,
    offsetY: nextY + nextMetrics.height / 2 - nextMetrics.centerY,
  };
}

function resolveNextStandalonePoint(model: MoleculeModel): { x: number; y: number } {
  const bounds = resolveBounds(model);

  if (bounds === null) {
    return { x: 0, y: 0 };
  }

  const atomCount = model.atoms.length;
  const rowOffset = atomCount % 3;

  return {
    x: bounds.maxX + 92,
    y: bounds.minY + rowOffset * 56,
  };
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  return {
    x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
  };
}

function toSvgDelta(
  svg: SVGSVGElement,
  viewBox: { width: number; height: number },
  deltaClientX: number,
  deltaClientY: number,
) {
  const rect = svg.getBoundingClientRect();

  return {
    x: (deltaClientX / rect.width) * viewBox.width,
    y: (deltaClientY / rect.height) * viewBox.height,
  };
}

function clampCanvasScale(scale: number): number {
  return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, scale));
}

function resolveViewportCenter(
  model: MoleculeModel,
  viewport: CanvasViewport,
  frameAspectRatio?: number,
) {
  const viewBox = resolveInteractiveViewBox(model, viewport, frameAspectRatio);

  return {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };
}

function zoomCanvasViewport(
  model: MoleculeModel,
  currentViewport: CanvasViewport,
  nextScale: number,
  anchorPoint: { x: number; y: number },
  frameAspectRatio?: number,
): CanvasViewport {
  const safeScale = clampCanvasScale(nextScale);
  const baseViewBox = resolveViewBox(model);
  const currentViewBox = resolveInteractiveViewBox(model, currentViewport, frameAspectRatio);
  const ratioX =
    currentViewBox.width === 0 ? 0.5 : (anchorPoint.x - currentViewBox.x) / currentViewBox.width;
  const ratioY =
    currentViewBox.height === 0 ? 0.5 : (anchorPoint.y - currentViewBox.y) / currentViewBox.height;
  const nextWidth = baseViewBox.width / safeScale;
  const nextHeight = baseViewBox.height / safeScale;
  const nextX = anchorPoint.x - ratioX * nextWidth;
  const nextY = anchorPoint.y - ratioY * nextHeight;
  const baseCenterX = baseViewBox.x + baseViewBox.width / 2;
  const baseCenterY = baseViewBox.y + baseViewBox.height / 2;

  return {
    offsetX: nextX + nextWidth / 2 - baseCenterX,
    offsetY: nextY + nextHeight / 2 - baseCenterY,
    scale: safeScale,
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

  const attachedBond =
    model.bonds.find((bond) => bond.sourceId === atom.id || bond.targetId === atom.id) ?? null;

  if (attachedBond === null) {
    return false;
  }

  const neighborAtomId = attachedBond.sourceId === atom.id ? attachedBond.targetId : attachedBond.sourceId;
  const neighborAtom = findAtom(model, neighborAtomId);

  return neighborAtom?.element.symbol === 'C';
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

function PaletteArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'left' ? <path d="m10.5 3.5-5 4.5 5 4.5" /> : <path d="m5.5 3.5 5 4.5-5 4.5" />}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="3.8" />
      <path d="m10.2 10.2 2.6 2.6" />
    </svg>
  );
}

function CloseChipIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

function RailToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3.5h10" />
      <path d="M3 8h10" />
      <path d="M3 12.5h10" />
      {collapsed ? <path d="m7 5 3 3-3 3" /> : <path d="m9 5-3 3 3 3" />}
    </svg>
  );
}

function AddAtomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" />
      <path d="M8 3v10" />
      <path d="M3 8h10" />
    </svg>
  );
}

function RemoveAtomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.5 4.5h9" />
      <path d="M6 4.5V3.2h4V4.5" />
      <path d="M5.1 6.2 5.6 12h4.8l.5-5.8" />
      <path d="M7 7.2v3.4" />
      <path d="M9 7.2v3.4" />
    </svg>
  );
}

function ClearSelectionIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" />
      <path d="m5.2 5.2 5.6 5.6" />
    </svg>
  );
}

function ResetEditorIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.5 8a4.5 4.5 0 1 0 1.1-3" />
      <path d="M3.5 3.7v2.5H6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M6.4 4.2 3.8 6.8l2.6 2.6" />
      <path d="M4.1 6.8h4.4a3.4 3.4 0 1 1 0 6.8H6.8" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m9.6 4.2 2.6 2.6-2.6 2.6" />
      <path d="M11.9 6.8H7.5a3.4 3.4 0 1 0 0 6.8h1.7" />
    </svg>
  );
}

function BondOrderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="4" cy="8" r="1.2" />
      <circle cx="12" cy="8" r="1.2" />
      <path d="M5.5 6.5h5" />
      <path d="M5.5 8h5" />
      <path d="M5.5 9.5h5" />
    </svg>
  );
}

function ToolRailButton({
  icon,
  label,
  title,
  collapsed,
  active = false,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  title?: string;
  collapsed: boolean;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const stateClassName = danger
    ? 'border-rose-500/55 bg-rose-500/10 text-rose-200 hover:bg-rose-500/18'
    : active
      ? 'border-(--accent) bg-(--accent)/24 text-foreground'
      : 'border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) hover:border-(--accent) hover:text-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`inline-flex items-center border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${stateClassName} ${
        collapsed
          ? 'mx-auto h-9 w-9 justify-center rounded-xl px-0'
          : 'h-9 w-full justify-start gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {collapsed ? null : <span>{label}</span>}
    </button>
  );
}

function PaletteTile({
  element,
  paletteIndex,
  isSelected,
  isCentered,
  isCompact = false,
  buttonRef,
}: {
  element: ChemicalElement;
  paletteIndex: number;
  isSelected: boolean;
  isCentered: boolean;
  isCompact?: boolean;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}) {
  const color = resolveCategoryColor(element.category).rgb;
  const atomicNumberLabel = String(element.number);
  const atomicNumberBadgeClassName = element.number >= 100 ? 'min-w-[18px] text-[6px]' : 'min-w-[16px] text-[7px]';
  const isEmphasized = isSelected || isCentered;
  const selectedTileClassName = isCompact
    ? 'z-20 h-7 w-24 scale-[1.01] shadow-[0_8px_16px_rgba(0,0,0,0.16)]'
    : 'z-20 h-10 w-32 scale-[1.01] shadow-[0_10px_20px_rgba(0,0,0,0.18)] sm:h-10 sm:w-33.5 lg:h-11 lg:w-37';
  const centeredTileClassName = isCompact
    ? 'z-10 h-7 w-7 scale-[1.08] opacity-100 shadow-[0_10px_16px_rgba(0,0,0,0.18)]'
    : 'z-10 h-10 w-10 scale-[1.12] opacity-100 shadow-[0_12px_20px_rgba(0,0,0,0.2)] sm:h-10 sm:w-10 lg:h-11 lg:w-11';
  const idleTileClassName = isCompact
    ? 'h-7 w-7 opacity-88'
    : 'h-10 w-10 opacity-88 sm:h-10 sm:w-10 lg:h-11 lg:w-11';
  const selectedLeftRailClassName = isCompact ? 'absolute inset-y-0 left-0 w-7' : 'absolute inset-y-0 left-0 w-10 sm:w-10 lg:w-11';
  const selectedLeftContentClassName = isCompact
    ? 'flex h-full flex-col items-center justify-end px-0.5 pb-0.5 pt-2 text-center'
    : 'flex h-full flex-col items-center justify-end px-1 pb-1 pt-2.5 text-center';
  const selectedNameClassName = isCompact
    ? 'mt-0.5 max-w-full truncate text-[5px] font-semibold leading-tight text-(--text-muted)'
    : 'mt-0.5 max-w-full truncate text-[7px] font-semibold leading-tight text-(--text-muted) sm:text-[7px]';
  const selectedDataPanelClassName = isCompact
    ? 'absolute inset-y-0 left-7 right-0 border-l border-(--border-subtle)/85 bg-(--surface-overlay-subtle) shadow-[-1px_0_0_var(--surface-hairline)]'
    : 'absolute inset-y-0 left-10 right-0 border-l border-(--border-subtle)/85 bg-(--surface-overlay-subtle) shadow-[-1px_0_0_var(--surface-hairline)] sm:left-10 lg:left-11';
  const selectedTableClassName = isCompact
    ? 'h-full w-full table-fixed border-collapse text-[6px] leading-none text-(--text-muted)'
    : 'h-full w-full table-fixed border-collapse text-[7px] leading-none text-(--text-muted) sm:text-[8px] lg:text-[9px]';
  const selectedKeyClassName = isCompact
    ? 'w-5 px-1 py-0.5 text-left font-semibold uppercase tracking-[0.04em] text-(--text-muted)'
    : 'w-6 px-1.5 py-0.75 text-left font-semibold uppercase tracking-[0.06em] text-(--text-muted) sm:w-6.5';
  const selectedValueClassName = isCompact
    ? 'truncate px-1 py-0.5 text-right font-semibold text-foreground'
    : 'truncate px-1.5 py-0.75 text-right font-semibold text-foreground';
  const idleContentClassName = isCompact
    ? 'flex h-full flex-col items-center justify-end px-0.5 pb-0.5 pt-2 text-center'
    : 'flex h-full flex-col items-center justify-end px-1 pb-1 pt-2.5 text-center';
  const idleNameClassName = isCompact
    ? 'mt-0.5 max-w-full truncate text-[5px] font-semibold leading-tight text-(--text-muted)'
    : 'mt-0.5 max-w-full truncate text-[7px] font-semibold leading-tight text-(--text-muted) sm:text-[7px]';

  return (
    <button
      ref={buttonRef}
      type="button"
      data-palette-index={paletteIndex}
      className={`relative shrink-0 overflow-hidden rounded-xl border text-left text-foreground transition-[width,transform,box-shadow,background,opacity] duration-150 ease-out ${
        isSelected
          ? selectedTileClassName
          : isCentered
            ? centeredTileClassName
            : idleTileClassName
      }`}
      title={`${element.name} (${element.symbol})`}
      style={{
        background: `linear-gradient(145deg, rgba(${color}, ${isEmphasized ? '0.26' : '0.2'}), rgba(${color}, 0.06) 58%, var(--tile-gradient-tail))`,
        borderColor: `rgba(${color}, ${isEmphasized ? '0.82' : '0.6'})`,
        boxShadow: isSelected
          ? `0 0 0 1px var(--neon-border), 0 0 14px rgba(${color}, 0.26)`
          : isCentered
            ? `0 0 0 1px var(--neon-border), 0 0 12px rgba(${color}, 0.2)`
            : `0 0 0 1px var(--neon-border), 0 0 8px rgba(${color}, 0.18)`,
      }}
      aria-label={`Select ${element.name}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 inline-flex items-center justify-center rounded-full border px-1 py-px font-semibold leading-none tabular-nums text-(--text-muted) ${atomicNumberBadgeClassName} ${
          isSelected
            ? 'border-(--border-subtle)/70 bg-(--surface-overlay-badge-strong)'
            : 'border-(--border-subtle)/65 bg-(--surface-overlay-badge)'
        }`}
      >
        {atomicNumberLabel}
      </span>
      {isSelected ? (
        <>
          <div className={selectedLeftRailClassName}>
            <div className={selectedLeftContentClassName}>
              <p className="text-xs font-black leading-none tracking-tight sm:text-sm lg:text-base">{element.symbol}</p>
              <p className={selectedNameClassName}>
                {element.name}
              </p>
            </div>
          </div>

          <div className={selectedDataPanelClassName}>
            <table className={selectedTableClassName}>
              <tbody>
                <tr className="bg-(--surface-row-soft)">
                  <th className={selectedKeyClassName}>
                    Sh
                  </th>
                  <td className={selectedValueClassName}>
                    {element.shells.join('-')}
                  </td>
                </tr>
                <tr className="bg-(--surface-row-strong)">
                  <th className={selectedKeyClassName}>
                    B
                  </th>
                  <td className={selectedValueClassName}>
                    {resolveMaxBondSlots(element)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className={idleContentClassName}>
            <p className="text-xs font-black leading-none tracking-tight sm:text-sm lg:text-base">{element.symbol}</p>
            <p className={idleNameClassName}>
              {element.name}
            </p>
          </div>
        </>
      )}
    </button>
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
  const stroke = mode === 'stick' ? 'color-mix(in oklab, var(--text-strong) 92%, white)' : 'var(--text-strong)';
  const strokeWidth = mode === 'stick' ? 3.5 : 2.75;

  return (
    <g aria-hidden="true">
      {offsets.map((offset) => {
        const inset = resolveBondLineInset(bond.order, offset);
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
            opacity={offset === 0 ? (mode === 'editor' ? 0.92 : 1) : mode === 'editor' ? 0.76 : 0.84}
          />
        );
      })}
    </g>
  );
}

function EditorCanvas({
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
}: {
  model: MoleculeModel;
  mode: EditorViewMode;
  viewBox: { x: number; y: number; width: number; height: number };
  selectedAtomId: string | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onCanvasPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerCancel: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  onAtomPointerDown: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
}) {
  const modelCenter = resolveModelCenter(model);

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className="absolute inset-0 h-full w-full touch-none select-none"
      style={{ touchAction: 'none', userSelect: 'none' }}
      role="img"
      aria-label="Molecule editor canvas"
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onPointerCancel={onCanvasPointerCancel}
      onWheel={onCanvasWheel}
    >
      <defs>
        <pattern id="molecule-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--grid-stroke)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#molecule-grid)" />

      {model.bonds.map((bond) => {
        const source = findAtom(model, bond.sourceId);
        const target = findAtom(model, bond.targetId);

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
        const fill = showEditorBadge
          ? `rgba(${color}, 0.22)`
          : `color-mix(in oklab, rgba(${color}, 0.16) 60%, var(--surface-2))`;
        const textFill = 'var(--text-strong)';

        return (
          <g
            key={atom.id}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAtomPointerDown(atom.id, event);
            }}
            className={mode === 'editor' ? 'cursor-pointer' : undefined}
          >
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
          </g>
        );
      })}

    </svg>
  );
}

function MolecularEditor({ elements }: MolecularEditorProps) {
  const [molecule, setMolecule] = useState<MoleculeModel>(EMPTY_MOLECULE);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<EditorViewMode>('editor');
  const [bondOrder, setBondOrder] = useState<BondOrder>(1);
  const [historyPast, setHistoryPast] = useState<SavedEditorDraft[]>([]);
  const [historyFuture, setHistoryFuture] = useState<SavedEditorDraft[]>([]);
  const [isToolRailCollapsed, setIsToolRailCollapsed] = useState(true);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isPaletteSearchExpanded, setIsPaletteSearchExpanded] = useState(false);
  const [isFormulaPanelOpen, setIsFormulaPanelOpen] = useState(false);
  const [centerPaletteIndex, setCenterPaletteIndex] = useState(0);
  const [expandedPaletteIndex, setExpandedPaletteIndex] = useState(0);
  const [isPaletteMoving, setIsPaletteMoving] = useState(false);
  const [isPalettePointerActive, setIsPalettePointerActive] = useState(false);
  const [editorNotice, setEditorNotice] = useState('Select an element, then double-click or double-tap the canvas to place it.');
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>(DEFAULT_CANVAS_VIEWPORT);
  const [paletteEdgePadding, setPaletteEdgePadding] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const paletteViewportRef = useRef<HTMLDivElement | null>(null);
  const paletteItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const centerPaletteIndexRef = useRef(0);
  const topControlsRef = useRef<HTMLDivElement | null>(null);
  const topOverlayRef = useRef<HTMLDivElement | null>(null);
  const paletteSearchRailRef = useRef<HTMLDivElement | null>(null);
  const bottomNoticeRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const interactionRef = useRef<CanvasInteraction>({ type: 'idle' });
  const pendingCanvasPlacementRef = useRef<{
    timestamp: number;
    clientX: number;
    clientY: number;
    pointerType: string;
  } | null>(null);
  const paletteInteractionRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startScrollLeft: 0,
    startedAt: 0,
    lastClientX: 0,
    lastTimestamp: 0,
    velocity: 0,
    moved: false,
    pressedIndex: null as number | null,
  });
  const paletteMomentumFrameRef = useRef<number | null>(null);
  const paletteSnapTimeoutRef = useRef<number | null>(null);
  const paletteSettleTimeoutRef = useRef<number | null>(null);
  const suppressPaletteClickRef = useRef(false);
  const paletteSearchFocusTimeoutRef = useRef<number | null>(null);
  const [topControlsHeight, setTopControlsHeight] = useState(0);
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const [paletteSearchRailHeight, setPaletteSearchRailHeight] = useState(0);
  const [bottomNoticeHeight, setBottomNoticeHeight] = useState(0);
  const [canvasFrameSize, setCanvasFrameSize] = useState({ width: 0, height: 0 });
  const [windowWidth, setWindowWidth] = useState(0);

  const filteredElements = useMemo(() => {
    const normalizedQuery = paletteQuery.trim();

    if (normalizedQuery.length === 0) {
      return elements;
    }

    return elements
      .filter((element) => matchesElementQuery(element, normalizedQuery))
      .sort((first, second) => {
        const firstRank = resolveElementQueryRank(first, normalizedQuery);
        const secondRank = resolveElementQueryRank(second, normalizedQuery);

        if (firstRank !== secondRank) {
          return firstRank - secondRank;
        }

        return first.number - second.number;
      });
  }, [elements, paletteQuery]);

  const resolvedExpandedPaletteIndex =
    filteredElements.length === 0 ? 0 : Math.min(expandedPaletteIndex, filteredElements.length - 1);
  const resolvedCenterPaletteIndex =
    filteredElements.length === 0 ? 0 : Math.min(centerPaletteIndex, filteredElements.length - 1);
  const activeElement = filteredElements[resolvedExpandedPaletteIndex] ?? null;
  const activeElementMaxBondSlots = activeElement === null ? null : resolveMaxBondSlots(activeElement);
  const summary = useMemo(() => summarizeMolecule(molecule), [molecule]);
  const formula = useMemo(() => buildMolecularFormula(molecule), [molecule]);
  const formulaDisplayValue = summary.atomCount === 0 ? 'N/A' : formula;
  const formulaStatsRows = useMemo(
    () => [
      { label: 'Formula', value: formulaDisplayValue },
      { label: 'Atoms', value: String(summary.atomCount) },
      { label: 'Bonds', value: String(summary.bondCount) },
      { label: 'Slots', value: String(summary.totalBondOrder) },
    ],
    [formulaDisplayValue, summary.atomCount, summary.bondCount, summary.totalBondOrder],
  );
  const canUndo = historyPast.length > 0;
  const canRedo = historyFuture.length > 0;
  const compositionRows = useMemo(() => buildCompositionRows(molecule), [molecule]);
  const interactiveViewBox = useMemo(
    () =>
      resolveInteractiveViewBox(
        molecule,
        canvasViewport,
        canvasFrameSize.width > 0 && canvasFrameSize.height > 0
          ? canvasFrameSize.width / canvasFrameSize.height
          : undefined,
      ),
    [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule],
  );
  const canvasFrameAspectRatio =
    canvasFrameSize.width > 0 && canvasFrameSize.height > 0
      ? canvasFrameSize.width / canvasFrameSize.height
      : undefined;
  const hasActivePaletteFilter = paletteQuery.trim().length > 0;
  const isPaletteSearchOpen = isPaletteSearchExpanded;
  const zoomPercent = Math.round(canvasViewport.scale * 100);

  const syncCenterPaletteIndex = useCallback((index: number) => {
    centerPaletteIndexRef.current = index;
    setCenterPaletteIndex((currentIndex) => (currentIndex === index ? currentIndex : index));
  }, []);

  const clearTransientEditorState = useCallback(() => {
    pendingCanvasPlacementRef.current = null;
    interactionRef.current = { type: 'idle' };
  }, []);

  const buildEditorSnapshot = useCallback(
    (
      overrides?: Partial<SavedEditorDraft>,
    ): SavedEditorDraft => {
      const snapshot: SavedEditorDraft = {
        molecule: cloneMoleculeModel(overrides?.molecule ?? molecule),
        selectedAtomId: normalizeSnapshotSelectedAtomId(
          overrides?.molecule ?? molecule,
          overrides?.selectedAtomId ?? selectedAtomId,
        ),
        activeView: overrides?.activeView ?? activeView,
        bondOrder: overrides?.bondOrder ?? bondOrder,
        canvasViewport: {
          offsetX: overrides?.canvasViewport?.offsetX ?? canvasViewport.offsetX,
          offsetY: overrides?.canvasViewport?.offsetY ?? canvasViewport.offsetY,
          scale: overrides?.canvasViewport?.scale ?? canvasViewport.scale,
        },
      };

      return snapshot;
    },
    [activeView, bondOrder, canvasViewport.offsetX, canvasViewport.offsetY, canvasViewport.scale, molecule, selectedAtomId],
  );

  const pushHistorySnapshot = useCallback((snapshot: SavedEditorDraft) => {
    const nextSnapshot = cloneEditorSnapshot(snapshot);
    setHistoryPast((currentPast) => [...currentPast.slice(-(EDITOR_HISTORY_LIMIT - 1)), nextSnapshot]);
    setHistoryFuture([]);
  }, []);

  const applyEditorSnapshot = useCallback(
    (snapshot: SavedEditorDraft, notice: string) => {
      const nextSnapshot = cloneEditorSnapshot(snapshot);
      clearTransientEditorState();
      setMolecule(nextSnapshot.molecule);
      setSelectedAtomId(nextSnapshot.selectedAtomId);
      setActiveView(nextSnapshot.activeView);
      setBondOrder(nextSnapshot.bondOrder);
      setCanvasViewport(nextSnapshot.canvasViewport);
      setEditorNotice(notice);
    },
    [clearTransientEditorState],
  );

  const onUndo = useCallback(() => {
    if (historyPast.length === 0) {
      return;
    }

    const previousSnapshot = historyPast[historyPast.length - 1];
    const currentSnapshot = buildEditorSnapshot();

    setHistoryPast((currentPast) => currentPast.slice(0, -1));
    setHistoryFuture((currentFuture) => [...currentFuture.slice(-(EDITOR_HISTORY_LIMIT - 1)), currentSnapshot]);
    applyEditorSnapshot(previousSnapshot, 'Undo applied.');
  }, [applyEditorSnapshot, buildEditorSnapshot, historyPast]);

  const onRedo = useCallback(() => {
    if (historyFuture.length === 0) {
      return;
    }

    const nextSnapshot = historyFuture[historyFuture.length - 1];
    const currentSnapshot = buildEditorSnapshot();

    setHistoryFuture((currentFuture) => currentFuture.slice(0, -1));
    setHistoryPast((currentPast) => [...currentPast.slice(-(EDITOR_HISTORY_LIMIT - 1)), currentSnapshot]);
    applyEditorSnapshot(nextSnapshot, 'Redo applied.');
  }, [applyEditorSnapshot, buildEditorSnapshot, historyFuture]);

  const resetPaletteSearchViewport = useCallback(() => {
    setExpandedPaletteIndex(0);
    syncCenterPaletteIndex(0);
    setIsPaletteMoving(false);
    setIsPalettePointerActive(false);
  }, [syncCenterPaletteIndex]);

  const onPaletteSearchChange = useCallback((nextQuery: string) => {
    setPaletteQuery(nextQuery);
    resetPaletteSearchViewport();
  }, [resetPaletteSearchViewport]);

  const onClearPaletteSearch = useCallback(() => {
    setPaletteQuery('');
    resetPaletteSearchViewport();
  }, [resetPaletteSearchViewport]);

  const onTogglePaletteSearch = useCallback(() => {
    setIsPaletteSearchExpanded((current) => !current);
  }, []);

  const clampPaletteIndex = useCallback(
    (index: number) => {
      if (filteredElements.length === 0) {
        return 0;
      }

      return Math.max(0, Math.min(filteredElements.length - 1, index));
    },
    [filteredElements.length],
  );

  const resolvePaletteGestureStep = useCallback(() => {
    const currentButton =
      paletteItemRefs.current[centerPaletteIndexRef.current] ?? paletteItemRefs.current[resolvedExpandedPaletteIndex];
    const baseWidth = currentButton?.clientWidth ?? 40;

    return Math.max(
      PALETTE_GESTURE_STEP_MIN,
      Math.min(PALETTE_GESTURE_STEP_MAX, Math.round(baseWidth * PALETTE_GESTURE_STEP_RATIO)),
    );
  }, [resolvedExpandedPaletteIndex]);

  const centerPaletteElement = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const viewport = paletteViewportRef.current;
      const elementButton = paletteItemRefs.current[index];

      if (viewport === null || elementButton === null) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const buttonRect = elementButton.getBoundingClientRect();
      const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
      const nextScrollLeft = Math.max(0, buttonCenter - viewport.clientWidth / 2);

      if (behavior === 'auto') {
        viewport.scrollLeft = nextScrollLeft;
        return;
      }

      viewport.scrollTo({
        left: nextScrollLeft,
        behavior,
      });
    },
    [],
  );

  const resolveNearestPaletteIndex = useCallback(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null || filteredElements.length === 0) {
      return 0;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < filteredElements.length; index += 1) {
      const elementButton = paletteItemRefs.current[index];

      if (elementButton === null || elementButton === undefined) {
        continue;
      }

      const buttonRect = elementButton.getBoundingClientRect();
      const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
      const distance = Math.abs(buttonCenter - center);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return nearestIndex;
  }, [filteredElements.length]);

  const cancelPaletteMomentum = useCallback(() => {
    if (paletteMomentumFrameRef.current !== null) {
      cancelAnimationFrame(paletteMomentumFrameRef.current);
      paletteMomentumFrameRef.current = null;
    }

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
      paletteSnapTimeoutRef.current = null;
    }

    if (paletteSettleTimeoutRef.current !== null) {
      window.clearTimeout(paletteSettleTimeoutRef.current);
      paletteSettleTimeoutRef.current = null;
    }
  }, []);

  const settlePaletteSelection = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      cancelPaletteMomentum();
      syncCenterPaletteIndex(index);
      centerPaletteElement(index, behavior);

      const finalizeSelection = () => {
        setExpandedPaletteIndex(index);
        setIsPaletteMoving(false);
      };

      if (behavior === 'auto') {
        finalizeSelection();
        return;
      }

      paletteSettleTimeoutRef.current = window.setTimeout(finalizeSelection, 140);
    },
    [cancelPaletteMomentum, centerPaletteElement, syncCenterPaletteIndex],
  );

  const goToPreviousPaletteElement = useCallback(() => {
    if (filteredElements.length === 0) {
      return;
    }

    const nextIndex =
      resolvedExpandedPaletteIndex === 0 ? filteredElements.length - 1 : resolvedExpandedPaletteIndex - 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [filteredElements.length, resolvedExpandedPaletteIndex, settlePaletteSelection]);

  const goToNextPaletteElement = useCallback(() => {
    if (filteredElements.length === 0) {
      return;
    }

    const nextIndex =
      resolvedExpandedPaletteIndex === filteredElements.length - 1 ? 0 : resolvedExpandedPaletteIndex + 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [filteredElements.length, resolvedExpandedPaletteIndex, settlePaletteSelection]);

  const snapPaletteToNearest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = resolveNearestPaletteIndex();
      settlePaletteSelection(nextIndex, behavior);
    },
    [resolveNearestPaletteIndex, settlePaletteSelection],
  );

  const settlePaletteToCurrentCenter = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current);
      settlePaletteSelection(nextIndex, behavior);
    },
    [clampPaletteIndex, settlePaletteSelection],
  );

  const startPaletteMomentum = useCallback(
    (initialVelocity: number) => {
      if (filteredElements.length === 0) {
        setIsPaletteMoving(false);
        return;
      }

      let velocity = initialVelocity;
      let carry = 0;

      if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
        settlePaletteToCurrentCenter('auto');
        return;
      }

      cancelPaletteMomentum();
      let lastTimestamp = performance.now();
      const gestureStep = resolvePaletteGestureStep();

      const step = (timestamp: number) => {
        const deltaTime = Math.min(32, Math.max(8, timestamp - lastTimestamp));
        lastTimestamp = timestamp;
        carry += velocity * (deltaTime / 16);
        velocity *= Math.pow(PALETTE_MOMENTUM_DECAY, deltaTime / 16);

        const stepCount = Math.floor(Math.abs(carry) / gestureStep);

        if (stepCount > 0) {
          const stepDirection = carry < 0 ? -1 : 1;
          const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current + stepDirection * stepCount);

          if (nextIndex !== centerPaletteIndexRef.current) {
            syncCenterPaletteIndex(nextIndex);
            centerPaletteElement(nextIndex, 'auto');
          }

          carry -= Math.sign(carry) * stepCount * gestureStep;
        }

        if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
          cancelPaletteMomentum();
          settlePaletteToCurrentCenter('auto');
          return;
        }

        paletteMomentumFrameRef.current = requestAnimationFrame(step);
      };

      paletteMomentumFrameRef.current = requestAnimationFrame(step);
    },
    [cancelPaletteMomentum, centerPaletteElement, clampPaletteIndex, filteredElements.length, resolvePaletteGestureStep, settlePaletteToCurrentCenter, syncCenterPaletteIndex],
  );

  const commitMoleculeChange = useCallback(
    (
      previousMolecule: MoleculeModel,
      result: {
        molecule: MoleculeModel;
        selectedAtomId: string | null;
        error?: string;
      },
      successMessage: string,
      anchorPoint?: { x: number; y: number },
    ) => {
      const nextSelectedAtomId = normalizeSnapshotSelectedAtomId(result.molecule, result.selectedAtomId);
      const shouldRecordHistory =
        result.molecule !== previousMolecule || nextSelectedAtomId !== normalizeSnapshotSelectedAtomId(molecule, selectedAtomId);

      if (shouldRecordHistory) {
        pushHistorySnapshot(buildEditorSnapshot());
      }

      if (shouldRecordHistory) {
        const nextViewport = preserveViewportAcrossModelChange(
          previousMolecule,
          result.molecule,
          canvasViewport,
          canvasFrameAspectRatio,
          anchorPoint,
        );

        setCanvasViewport(nextViewport);
        setMolecule(result.molecule);
        setSelectedAtomId(nextSelectedAtomId);
      }
      setEditorNotice(result.error ?? successMessage);
    },
    [buildEditorSnapshot, canvasFrameAspectRatio, canvasViewport, molecule, pushHistorySnapshot, selectedAtomId],
  );

  const onAddSelectedElement = useCallback(() => {
    if (activeElement === null) {
      setEditorNotice('No element matches the current search.');
      return;
    }

    if (molecule.atoms.length === 0 || selectedAtomId === null) {
      const nextPoint = resolveNextStandalonePoint(molecule);
      const result = addStandaloneAtom(molecule, activeElement, nextPoint);
      commitMoleculeChange(molecule, result, `${activeElement.symbol} added to the canvas.`, nextPoint);
      return;
    }

    const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
    commitMoleculeChange(molecule, result, `${activeElement.symbol} attached with a bond order of ${bondOrder}.`);
  }, [activeElement, bondOrder, commitMoleculeChange, molecule, selectedAtomId]);

  const commitCanvasPlacement = useCallback(
    (point: { x: number; y: number }) => {
      if (activeView !== 'editor') {
        return;
      }

      if (activeElement === null) {
        setEditorNotice('Choose an element before placing atoms.');
        return;
      }

      if (selectedAtomId === null) {
        const result = addStandaloneAtom(molecule, activeElement, point);
        commitMoleculeChange(molecule, result, `${activeElement.symbol} placed on the canvas.`, point);
        return;
      }

      const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
      commitMoleculeChange(molecule, result, `${activeElement.symbol} attached to the selected atom.`);
    },
    [activeElement, activeView, bondOrder, commitMoleculeChange, molecule, selectedAtomId],
  );

  const onSetActiveView = useCallback(
    (nextView: EditorViewMode) => {
      setActiveView(nextView);
    },
    [],
  );

  const onSetBondOrder = useCallback(
    (nextBondOrder: BondOrder) => {
      setBondOrder(nextBondOrder);
    },
    [],
  );

  const onClearSelection = useCallback(() => {
    setSelectedAtomId(null);
    setEditorNotice('Selection cleared.');
  }, []);

  const commitAtomSelection = useCallback(
    (atomId: string) => {
      if (selectedAtomId === null) {
        setSelectedAtomId(atomId);
        setEditorNotice('Atom selected. Double-click or double-tap the canvas to attach the active element, or tap another atom to create a bond.');
        return;
      }

      if (selectedAtomId === atomId) {
        setSelectedAtomId(null);
        setEditorNotice('Selection cleared.');
        return;
      }

      const result = connectAtoms(molecule, selectedAtomId, atomId, bondOrder);
      commitMoleculeChange(molecule, result, `Bond updated to order ${bondOrder}.`);
    },
    [bondOrder, commitMoleculeChange, molecule, selectedAtomId],
  );

  const queueCanvasPlacement = useCallback(
    (point: { x: number; y: number }, pointerType: string, clientX: number, clientY: number) => {
      const now = performance.now();
      const pendingPlacement = pendingCanvasPlacementRef.current;
      const isRepeatedPlacement =
        pendingPlacement !== null &&
        pendingPlacement.pointerType === pointerType &&
        now - pendingPlacement.timestamp <= CANVAS_DOUBLE_PRESS_DELAY_MS &&
        Math.hypot(clientX - pendingPlacement.clientX, clientY - pendingPlacement.clientY) <=
          CANVAS_DOUBLE_PRESS_DISTANCE_PX;

      if (isRepeatedPlacement) {
        pendingCanvasPlacementRef.current = null;
        commitCanvasPlacement(point);
        return;
      }

      pendingCanvasPlacementRef.current = {
        timestamp: now,
        clientX,
        clientY,
        pointerType,
      };
      setEditorNotice(
        pointerType === 'touch'
          ? 'Double-tap the canvas to place or attach the active element.'
          : 'Double-click the canvas to place or attach the active element.',
      );
    },
    [commitCanvasPlacement],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);

      interactionRef.current = {
        type: 'canvas-press',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPoint: toSvgPoint(event.currentTarget, event.clientX, event.clientY),
        startOffsetX: canvasViewport.offsetX,
        startOffsetY: canvasViewport.offsetY,
        canPan: true,
        moved: false,
      };
    },
    [activeView, canvasViewport.offsetX, canvasViewport.offsetY],
  );

  const onCanvasPointerMove = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const interaction = interactionRef.current;

    if (interaction.type === 'idle' || interaction.pointerId !== event.pointerId) {
      return;
    }

    const svg = svgRef.current;

    if (svg === null) {
      return;
    }

    const deltaClientX = event.clientX - interaction.startClientX;
    const deltaClientY = event.clientY - interaction.startClientY;
    const distance = Math.hypot(deltaClientX, deltaClientY);

    if (interaction.type === 'canvas-press') {
      if (!interaction.canPan) {
        if (distance >= DRAG_THRESHOLD_PX && !interaction.moved) {
          interactionRef.current = {
            ...interaction,
            moved: true,
          };
        }

        return;
      }

      if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
        return;
      }

      event.preventDefault();

      const delta = toSvgDelta(svg, svg.viewBox.baseVal, deltaClientX, deltaClientY);
      interactionRef.current = {
        ...interaction,
        moved: true,
      };

      setCanvasViewport((current) => ({
        ...current,
        offsetX: interaction.startOffsetX - delta.x,
        offsetY: interaction.startOffsetY - delta.y,
      }));
      return;
    }

    if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
      return;
    }

    const nextMode = interaction.mode === 'pan' || distance >= DRAG_THRESHOLD_PX ? 'pan' : interaction.mode;

    if (nextMode !== 'pan') {
      return;
    }

    event.preventDefault();
    interactionRef.current = {
      ...interaction,
      mode: 'pan',
      moved: true,
    };
    const delta = toSvgDelta(svg, svg.viewBox.baseVal, deltaClientX, deltaClientY);

    setCanvasViewport((current) => ({
      ...current,
      offsetX: interaction.startOffsetX - delta.x,
      offsetY: interaction.startOffsetY - delta.y,
    }));
  }, []);

  const onCanvasPointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const interaction = interactionRef.current;

      if (interaction.type === 'idle' || interaction.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      interactionRef.current = { type: 'idle' };

      if (interaction.type === 'canvas-press') {
        if (!interaction.moved) {
          queueCanvasPlacement(interaction.startPoint, event.pointerType, event.clientX, event.clientY);
        }

        return;
      }

      if (!interaction.moved && interaction.mode === 'select') {
        commitAtomSelection(interaction.atomId);
      }
    },
    [commitAtomSelection, queueCanvasPlacement],
  );

  const onCanvasPointerCancel = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      pendingCanvasPlacementRef.current = null;
      interactionRef.current = { type: 'idle' };
    },
    [],
  );

  const onCanvasWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        const nextScale = clampCanvasScale(
          canvasViewport.scale * (event.deltaY > 0 ? 1 / CANVAS_ZOOM_STEP : CANVAS_ZOOM_STEP),
        );

        if (nextScale === canvasViewport.scale) {
          return;
        }

        const anchorPoint = toSvgPoint(event.currentTarget, event.clientX, event.clientY);
        setCanvasViewport(
          zoomCanvasViewport(
            molecule,
            canvasViewport,
            nextScale,
            anchorPoint,
            canvasFrameSize.width > 0 && canvasFrameSize.height > 0
              ? canvasFrameSize.width / canvasFrameSize.height
              : undefined,
          ),
        );
        return;
      }

      const svg = svgRef.current;

      if (svg === null) {
        return;
      }

      const delta = toSvgDelta(svg, svg.viewBox.baseVal, event.deltaX, event.deltaY);
      setCanvasViewport((current) => ({
        ...current,
        offsetX: current.offsetX + delta.x,
        offsetY: current.offsetY + delta.y,
      }));
    },
    [activeView, canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule],
  );

  const onAtomPointerDown = useCallback(
    (atomId: string, event: ReactPointerEvent<SVGGElement>) => {
      const atom = findAtom(molecule, atomId);

      if (atom === null) {
        return;
      }

      const svg = svgRef.current;

      if (svg === null) {
        return;
      }

      svg.setPointerCapture(event.pointerId);
      pendingCanvasPlacementRef.current = null;

      interactionRef.current = {
        type: 'atom-press',
        pointerId: event.pointerId,
        atomId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: canvasViewport.offsetX,
        startOffsetY: canvasViewport.offsetY,
        mode: event.ctrlKey ? 'pan' : 'select',
        moved: false,
      };
    },
    [canvasViewport.offsetX, canvasViewport.offsetY, molecule],
  );

  const onRemoveSelectedAtom = useCallback(() => {
    if (selectedAtomId === null) {
      setEditorNotice('Select an atom before removing it.');
      return;
    }

    const neighborBond =
      molecule.bonds.find((bond) => bond.sourceId === selectedAtomId || bond.targetId === selectedAtomId) ?? null;
    const fallbackAnchorAtomId =
      neighborBond === null
        ? undefined
        : neighborBond.sourceId === selectedAtomId
          ? neighborBond.targetId
          : neighborBond.sourceId;
    const nextMolecule = removeAtom(molecule, selectedAtomId);
    const rebalancedMolecule =
      nextMolecule.atoms.length === 0
        ? nextMolecule
        : rebalanceMoleculeLayout(
            nextMolecule,
            fallbackAnchorAtomId !== undefined && fallbackAnchorAtomId !== selectedAtomId
              ? fallbackAnchorAtomId
              : nextMolecule.atoms[0]?.id,
          );
    const nextViewport = preserveViewportAcrossModelChange(
      molecule,
      rebalancedMolecule,
      canvasViewport,
      canvasFrameAspectRatio,
    );

    setCanvasViewport(nextViewport);
    pushHistorySnapshot(buildEditorSnapshot());
    setMolecule(rebalancedMolecule);
    setSelectedAtomId(null);
    setEditorNotice('Selected atom removed.');
  }, [buildEditorSnapshot, canvasFrameAspectRatio, canvasViewport, molecule, pushHistorySnapshot, selectedAtomId]);

  const onResetMolecule = useCallback(() => {
    const isAlreadyPristine =
      molecule.atoms.length === 0 &&
      selectedAtomId === null &&
      activeView === 'editor' &&
      bondOrder === 1 &&
      canvasViewport.offsetX === DEFAULT_CANVAS_VIEWPORT.offsetX &&
      canvasViewport.offsetY === DEFAULT_CANVAS_VIEWPORT.offsetY &&
      canvasViewport.scale === DEFAULT_CANVAS_VIEWPORT.scale;

    if (isAlreadyPristine) {
      setEditorNotice('Editor already reset.');
      return;
    }

    pushHistorySnapshot(buildEditorSnapshot());
    clearTransientEditorState();
    setMolecule(EMPTY_MOLECULE);
    setSelectedAtomId(null);
    setActiveView('editor');
    setBondOrder(1);
    setCanvasViewport(DEFAULT_CANVAS_VIEWPORT);
    setEditorNotice('Editor reset.');
  }, [activeView, bondOrder, buildEditorSnapshot, canvasViewport.offsetX, canvasViewport.offsetY, canvasViewport.scale, clearTransientEditorState, molecule.atoms.length, pushHistorySnapshot, selectedAtomId]);

  const onZoomOut = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale / CANVAS_ZOOM_STEP,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule]);

  const onZoomIn = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale * CANVAS_ZOOM_STEP,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule]);

  const onResetCanvasView = useCallback(() => {
    setCanvasViewport(DEFAULT_CANVAS_VIEWPORT);
    setEditorNotice('Canvas view reset.');
  }, []);

  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);

    return () => {
      window.removeEventListener('resize', updateWindowWidth);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
        return;
      }

      if (isTextEditingElement(event.target)) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        onRedo();
        return;
      }

      onUndo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onRedo, onUndo]);

  useEffect(() => {
    if (paletteSearchFocusTimeoutRef.current !== null) {
      window.clearTimeout(paletteSearchFocusTimeoutRef.current);
      paletteSearchFocusTimeoutRef.current = null;
    }

    if (!isPaletteSearchOpen || searchInputRef.current === null) {
      return;
    }

    paletteSearchFocusTimeoutRef.current = window.setTimeout(() => {
      searchInputRef.current?.focus();
      paletteSearchFocusTimeoutRef.current = null;
    }, 160);

    return () => {
      if (paletteSearchFocusTimeoutRef.current !== null) {
        window.clearTimeout(paletteSearchFocusTimeoutRef.current);
        paletteSearchFocusTimeoutRef.current = null;
      }
    };
  }, [isPaletteSearchOpen]);

  useEffect(() => {
    if (!isPaletteSearchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const searchRailElement = paletteSearchRailRef.current;

      if (searchRailElement === null || searchRailElement.contains(event.target as Node)) {
        return;
      }

      setIsPaletteSearchExpanded(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isPaletteSearchOpen]);

  useEffect(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null) {
      return;
    }

    let frameId = 0;
    const updatePadding = () => {
      const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];
      const selectedWidth = selectedButton?.clientWidth ?? 0;
      const nextPadding = Math.max(0, Math.round(viewport.clientWidth / 2 - selectedWidth / 2));

      setPaletteEdgePadding((currentPadding) =>
        currentPadding === nextPadding ? currentPadding : nextPadding,
      );
    };

    frameId = window.requestAnimationFrame(updatePadding);
    const resizeObserver = new ResizeObserver(() => {
      updatePadding();
    });

    resizeObserver.observe(viewport);
    const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];

    if (selectedButton !== null && selectedButton !== undefined) {
      resizeObserver.observe(selectedButton);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [filteredElements.length, resolvedExpandedPaletteIndex]);

  useEffect(() => {
    return () => {
      cancelPaletteMomentum();
    };
  }, [cancelPaletteMomentum]);

  useEffect(() => {
    centerPaletteIndexRef.current = resolvedCenterPaletteIndex;
  }, [resolvedCenterPaletteIndex]);

  useEffect(() => {
    if (isPaletteMoving) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      syncCenterPaletteIndex(resolvedExpandedPaletteIndex);
      centerPaletteElement(resolvedExpandedPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, filteredElements, isPaletteMoving, paletteEdgePadding, resolvedExpandedPaletteIndex, syncCenterPaletteIndex]);

  useEffect(() => {
    if (!isPaletteMoving && !isPalettePointerActive) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      centerPaletteElement(resolvedCenterPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, isPaletteMoving, isPalettePointerActive, resolvedCenterPaletteIndex]);

  const onPaletteScroll = useCallback(() => {
    if (isPalettePointerActive || isPaletteMoving) {
      return;
    }

    const nextIndex = resolveNearestPaletteIndex();
    syncCenterPaletteIndex(nextIndex);

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
    }

    paletteSnapTimeoutRef.current = window.setTimeout(() => {
      snapPaletteToNearest();
    }, 120);
  }, [isPaletteMoving, isPalettePointerActive, resolveNearestPaletteIndex, snapPaletteToNearest, syncCenterPaletteIndex]);

  const onPalettePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const viewport = paletteViewportRef.current;

    if (viewport === null) {
      return;
    }

    event.preventDefault();
    cancelPaletteMomentum();
    setIsPaletteMoving(true);
    setIsPalettePointerActive(true);
    suppressPaletteClickRef.current = false;
    viewport.setPointerCapture(event.pointerId);
    const pressedIndexAttr =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-palette-index]')?.dataset.paletteIndex : undefined;
    const pressedIndex =
      pressedIndexAttr === undefined ? null : Number.parseInt(pressedIndexAttr, 10);
    paletteInteractionRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
      startedAt: performance.now(),
      lastClientX: event.clientX,
      lastTimestamp: performance.now(),
      velocity: 0,
      moved: false,
      pressedIndex: Number.isNaN(pressedIndex ?? Number.NaN) ? null : pressedIndex,
    };
  }, [cancelPaletteMomentum]);

  const onPalettePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;
      const interaction = paletteInteractionRef.current;

      if (viewport === null || interaction.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - interaction.startClientX;
      const distance = Math.abs(deltaX);

      if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
        return;
      }

      event.preventDefault();
      setIsPaletteMoving(true);
      suppressPaletteClickRef.current = true;
      const now = performance.now();
      const deltaTime = Math.max(8, now - interaction.lastTimestamp);
      const instantaneousVelocity = -(event.clientX - interaction.lastClientX) / Math.max(0.5, deltaTime / 16);
      const gestureStep = resolvePaletteGestureStep();
      const stepCount = Math.floor(Math.abs(deltaX) / gestureStep);

      if (stepCount === 0) {
        paletteInteractionRef.current = {
          ...interaction,
          lastClientX: event.clientX,
          lastTimestamp: now,
          velocity: interaction.velocity * 0.7 + instantaneousVelocity * 0.3,
        };
        return;
      }

      const stepDirection = deltaX > 0 ? -1 : 1;
      const previousIndex = centerPaletteIndexRef.current;
      const nextIndex = clampPaletteIndex(previousIndex + stepDirection * stepCount);
      const didAdvance = nextIndex !== previousIndex;

      if (didAdvance) {
        syncCenterPaletteIndex(nextIndex);
        centerPaletteElement(nextIndex, 'auto');
      }

      paletteInteractionRef.current = {
        ...interaction,
        startClientX: interaction.startClientX + Math.sign(deltaX) * gestureStep * stepCount,
        lastClientX: event.clientX,
        lastTimestamp: now,
        velocity: interaction.velocity * 0.64 + instantaneousVelocity * 0.36,
        moved: didAdvance || interaction.moved,
      };
    },
    [centerPaletteElement, clampPaletteIndex, resolvePaletteGestureStep, syncCenterPaletteIndex],
  );

  const onPalettePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = paletteViewportRef.current;
    const interaction = paletteInteractionRef.current;

    if (viewport === null || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    setIsPalettePointerActive(false);
    const releaseTimestamp = performance.now();
    const timeSinceLastMove = releaseTimestamp - interaction.lastTimestamp;
    const shouldCarryMomentum = timeSinceLastMove <= PALETTE_MOMENTUM_IDLE_RELEASE_MS;
    const pressedTileIndex = interaction.pressedIndex;
    const wasShortTilePress =
      pressedTileIndex !== null && releaseTimestamp - interaction.startedAt < PALETTE_TILE_LONG_PRESS_MS;
    paletteInteractionRef.current = {
      pointerId: -1,
      startClientX: 0,
      startScrollLeft: 0,
      startedAt: 0,
      lastClientX: 0,
      lastTimestamp: 0,
      velocity: 0,
      moved: false,
      pressedIndex: null,
    };

    if (interaction.moved) {
      const releaseVelocity = shouldCarryMomentum ? interaction.velocity : 0;

      if (Math.abs(releaseVelocity) < PALETTE_MOMENTUM_MIN_SPEED) {
        settlePaletteToCurrentCenter('auto');
      } else {
        startPaletteMomentum(releaseVelocity);
      }

      window.setTimeout(() => {
        suppressPaletteClickRef.current = false;
      }, 40);
      return;
    }

    setIsPaletteMoving(false);

    if (pressedTileIndex !== null && wasShortTilePress) {
      settlePaletteSelection(pressedTileIndex, 'smooth');
      return;
    }

    settlePaletteToCurrentCenter('auto');
  }, [settlePaletteSelection, settlePaletteToCurrentCenter, startPaletteMomentum]);

  const onPalettePointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = paletteViewportRef.current;

    if (viewport !== null && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    setIsPalettePointerActive(false);
    paletteInteractionRef.current = {
      pointerId: -1,
      startClientX: 0,
      startScrollLeft: 0,
      startedAt: 0,
      lastClientX: 0,
      lastTimestamp: 0,
      velocity: 0,
      moved: false,
      pressedIndex: null,
    };
    setIsPaletteMoving(false);
    settlePaletteToCurrentCenter('auto');
  }, [settlePaletteToCurrentCenter]);

  useEffect(() => {
    const topControlsElement = topControlsRef.current;
    const overlayElement = topOverlayRef.current;
    const searchRailElement = paletteSearchRailRef.current;
    const bottomNoticeElement = bottomNoticeRef.current;
    const canvasElement = canvasFrameRef.current;

    if (
      topControlsElement === null &&
      overlayElement === null &&
      searchRailElement === null &&
      bottomNoticeElement === null &&
      canvasElement === null
    ) {
      return;
    }

    const updateMeasurements = () => {
      if (topControlsElement !== null) {
        const nextTopControlsHeight = Math.round(topControlsElement.getBoundingClientRect().height);
        setTopControlsHeight((currentHeight) =>
          currentHeight === nextTopControlsHeight ? currentHeight : nextTopControlsHeight,
        );
      }

      if (overlayElement !== null) {
        const nextOverlayHeight = Math.round(overlayElement.getBoundingClientRect().height);
        setTopOverlayHeight((currentHeight) =>
          currentHeight === nextOverlayHeight ? currentHeight : nextOverlayHeight,
        );
      }

      if (searchRailElement !== null) {
        const nextSearchRailHeight = Math.round(searchRailElement.getBoundingClientRect().height);
        setPaletteSearchRailHeight((currentHeight) =>
          currentHeight === nextSearchRailHeight ? currentHeight : nextSearchRailHeight,
        );
      }

      if (bottomNoticeElement !== null) {
        const nextBottomNoticeHeight = Math.round(bottomNoticeElement.getBoundingClientRect().height);
        setBottomNoticeHeight((currentHeight) =>
          currentHeight === nextBottomNoticeHeight ? currentHeight : nextBottomNoticeHeight,
        );
      }

      if (canvasElement !== null) {
        const rect = canvasElement.getBoundingClientRect();
        const nextWidth = Math.round(rect.width);
        const nextHeight = Math.round(rect.height);

        setCanvasFrameSize((currentSize) =>
          currentSize.width === nextWidth && currentSize.height === nextHeight
            ? currentSize
            : { width: nextWidth, height: nextHeight },
        );
      }
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (topControlsElement !== null) {
      resizeObserver.observe(topControlsElement);
    }

    if (overlayElement !== null) {
      resizeObserver.observe(overlayElement);
    }

    if (searchRailElement !== null) {
      resizeObserver.observe(searchRailElement);
    }

    if (bottomNoticeElement !== null) {
      resizeObserver.observe(bottomNoticeElement);
    }

    if (canvasElement !== null) {
      resizeObserver.observe(canvasElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeView]);

  const isCompactCanvas = canvasFrameSize.width > 0 && canvasFrameSize.width < 640;
  const isWideCanvas = canvasFrameSize.width >= 1024;
  const isSimplifiedView = activeView === 'simplified';
  const editorVerticalGap = 8;
  const isLandscapeCompactCanvas =
    !isSimplifiedView &&
    canvasFrameSize.width > 0 &&
    canvasFrameSize.height > 0 &&
    canvasFrameSize.width > canvasFrameSize.height &&
    canvasFrameSize.height < 360;
  const viewportMainHeightCss = 'var(--app-viewport-main-height, 100svh)';
  const viewportMainGutterCss = 'var(--app-viewport-main-gutter, 0px)';
  const viewportMainTopGutterCss = `calc(${viewportMainGutterCss} + 4px)`;
  const canvasPanelHeightCss = `max(280px, calc(${viewportMainHeightCss} - ${topControlsHeight + editorVerticalGap}px - ${viewportMainTopGutterCss}))`;
  const canvasPanelStyle: CSSProperties = {
    height: canvasPanelHeightCss,
    minHeight: canvasPanelHeightCss,
    maxHeight: canvasPanelHeightCss,
  };
  const editorSectionStyle: CSSProperties = {
    height: viewportMainHeightCss,
    minHeight: viewportMainHeightCss,
    maxHeight: viewportMainHeightCss,
    paddingTop: viewportMainTopGutterCss,
  };
  const canvasContentInsetTop = topOverlayHeight > 0 ? topOverlayHeight + 16 : 96;
  const paletteSearchRailGap = paletteSearchRailHeight > 0 ? (isLandscapeCompactCanvas ? 6 : 8) : 0;
  const paletteSearchRailOffset = paletteSearchRailHeight + paletteSearchRailGap;
  const toolRailTop = canvasContentInsetTop + paletteSearchRailOffset;
  const toolRailStyle: CSSProperties = {
    top: toolRailTop,
    maxHeight: `calc(100% - ${toolRailTop + 12}px)`,
  };
  const simplifiedHorizontalPadding = isWideCanvas ? 32 : isCompactCanvas ? 14 : 22;
  const simplifiedTopPadding =
    canvasContentInsetTop + paletteSearchRailOffset + (isCompactCanvas ? 12 : 16);
  const simplifiedBottomPadding = isWideCanvas ? 36 : isCompactCanvas ? 24 : 30;
  const simplifiedViewStyle: CSSProperties = {
    paddingTop: simplifiedTopPadding,
    paddingLeft: simplifiedHorizontalPadding,
    paddingRight: simplifiedHorizontalPadding,
    paddingBottom: simplifiedBottomPadding,
    WebkitOverflowScrolling: 'touch',
  };
  const effectiveToolRailCollapsed = isLandscapeCompactCanvas || isToolRailCollapsed;
  const showExpandedToolRailContent = !effectiveToolRailCollapsed;

  const topControlsRowClassName = isLandscapeCompactCanvas
    ? 'flex flex-wrap items-center justify-between gap-1.5'
    : 'flex flex-wrap items-center justify-between gap-2';
  const viewModeTabsClassName = isLandscapeCompactCanvas
    ? 'flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
    : 'flex items-center gap-1 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-1 shadow-lg backdrop-blur-xl';
  const viewModeButtonClassName = isLandscapeCompactCanvas
    ? 'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold transition-colors'
    : 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition-colors';
  const zoomControlsClassName = isLandscapeCompactCanvas
    ? 'ml-auto flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
    : 'ml-auto flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl';
  const zoomControlsVisibilityClassName = isSimplifiedView ? 'pointer-events-none invisible' : '';
  const topOverlayClassName = isLandscapeCompactCanvas
    ? 'absolute inset-x-2 top-2 z-30'
    : 'absolute inset-x-3 top-3 z-30';
  const toolRailCollapsedWidthClassName = isLandscapeCompactCanvas ? 'w-10' : 'w-12';
  const toolRailExpandedWidthClassName = isLandscapeCompactCanvas
    ? 'w-[min(56vw,8.5rem)]'
    : 'w-[min(72vw,224px)] sm:w-52';
  const paletteSearchShellClassName = isLandscapeCompactCanvas
    ? 'h-6 rounded-xl'
    : 'h-7 rounded-xl';
  const toolRailInsetPx = 12;
  const toolRailCollapsedWidthPx = isLandscapeCompactCanvas ? 40 : 48;
  const paletteSearchTriggerWidthPx = isLandscapeCompactCanvas ? 40 : 48;
  const paletteSearchClosedWidthPx = toolRailCollapsedWidthPx;
  const toolRailExpandedWidthPx = isLandscapeCompactCanvas
    ? Math.round(Math.min((windowWidth > 0 ? windowWidth : 240) * 0.56, 136))
    : windowWidth >= 640
      ? 208
      : Math.round(Math.min((windowWidth > 0 ? windowWidth : 320) * 0.72, 224));
  const paletteSearchExpandedWidthPx = Math.round(
    toolRailExpandedWidthPx,
  );
  const paletteSearchRailStyle: CSSProperties = {
    top: canvasContentInsetTop,
    left: `${toolRailInsetPx + (toolRailCollapsedWidthPx - paletteSearchClosedWidthPx) / 2}px`,
  };
  const paletteSearchPanelStyle: CSSProperties = {
    width: `${isPaletteSearchOpen ? paletteSearchExpandedWidthPx : paletteSearchClosedWidthPx}px`,
  };
  const paletteSearchInnerStyle: CSSProperties = {
    width: `${paletteSearchExpandedWidthPx}px`,
  };
  const paletteSearchTriggerStyle: CSSProperties = {
    width: `${paletteSearchTriggerWidthPx}px`,
  };
  const paletteSearchButtonClassName = isLandscapeCompactCanvas ? 'h-5 w-5' : 'h-5.5 w-5.5';
  const paletteViewportWrapperClassName = isLandscapeCompactCanvas
    ? 'relative overflow-hidden px-0.5'
    : 'relative overflow-hidden px-1';
  const paletteRowClassName = isLandscapeCompactCanvas
    ? 'flex h-7 items-center gap-0.5'
    : 'flex h-9 items-center gap-1 sm:h-10 sm:gap-1.5 lg:h-11 lg:gap-2';
  const compactBottomOverlayClassName = isLandscapeCompactCanvas
    ? 'pointer-events-none absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-2'
    : 'pointer-events-none absolute bottom-3 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-3';
  const compactBottomNoticeClassName = isLandscapeCompactCanvas
    ? 'pointer-events-auto max-w-[min(88vw,460px)] rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-panel) px-2.5 py-1.5 text-[11px] text-(--text-muted) shadow-lg backdrop-blur-xl'
    : 'pointer-events-auto max-w-[min(92vw,620px)] rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-panel) px-3 py-2 text-xs text-(--text-muted) shadow-lg backdrop-blur-xl sm:text-[13px]';
  const toolRailBodyClassName = effectiveToolRailCollapsed
    ? 'flex flex-1 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2'
    : 'flex-1 space-y-2.5 overflow-y-auto p-2';
  const collapsedToolRailSectionClassName = 'flex w-full flex-col items-center gap-2';
  const expandedToolRailSectionClassName = 'space-y-1.5';
  const formulaPanelBottom = bottomNoticeHeight > 0 ? bottomNoticeHeight + (isLandscapeCompactCanvas ? 8 : 16) : isLandscapeCompactCanvas ? 10 : 56;
  const formulaPanelStyle: CSSProperties = {
    bottom: `${formulaPanelBottom}px`,
  };
  const formulaPanelHeightClassName = isLandscapeCompactCanvas ? 'h-[64px]' : 'h-[76px] sm:h-[84px]';
  const formulaPanelCollapsedWidthClassName = isLandscapeCompactCanvas ? 'w-7' : 'w-8 sm:w-9';
  const formulaPanelExpandedWidthClassName = isLandscapeCompactCanvas
    ? 'w-[min(52vw,8.5rem)]'
    : 'w-[min(58vw,10rem)] sm:w-40 lg:w-44';
  const formulaPanelWidthClassName = isFormulaPanelOpen ? formulaPanelExpandedWidthClassName : formulaPanelCollapsedWidthClassName;
  const formulaPanelButtonClassName = isLandscapeCompactCanvas ? 'w-7 text-[6px]' : 'w-8 text-[7px] sm:w-9 sm:text-[8px]';
  const canvasPanelClassName = 'surface-panel relative overflow-hidden rounded-3xl border border-(--border-subtle) shadow-sm';
  const canvasFrameClassName = 'relative h-full w-full';
  const toolRailVisibilityClassName = isSimplifiedView ? 'pointer-events-none opacity-0' : 'opacity-100';

  return (
    <section className="flex min-h-0 flex-col gap-2 overflow-visible" style={editorSectionStyle}>
      <div ref={topControlsRef} className={topControlsRowClassName}>
        <div className={viewModeTabsClassName}>
          {VIEW_OPTIONS.map((option, index) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => onSetActiveView(option.mode)}
              className={`${viewModeButtonClassName} ${
                activeView === option.mode
                  ? 'border border-(--accent) bg-(--accent)/22 text-foreground'
                  : 'border border-transparent text-(--text-muted) hover:border-(--accent) hover:text-foreground'
              }`}
              aria-label={option.label}
              title={option.label}
            >
              <span className="sm:hidden">{index + 1}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        <div
          className={`${zoomControlsClassName} ${zoomControlsVisibilityClassName}`}
          aria-hidden={isSimplifiedView}
        >
            <button
              type="button"
              onClick={onZoomOut}
              className={`inline-flex items-center justify-center rounded-lg px-1 font-black text-foreground transition-colors hover:border-(--accent) hover:text-foreground ${
                isLandscapeCompactCanvas ? 'h-6 min-w-6 text-[13px]' : 'h-7 min-w-7 text-sm'
              }`}
              aria-label="Zoom out"
              title="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              onClick={onResetCanvasView}
              className={`inline-flex items-center justify-center rounded-lg px-1 font-semibold text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground ${
                isLandscapeCompactCanvas ? 'h-6 min-w-8 text-[9px]' : 'h-7 min-w-10 text-[10px]'
              }`}
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              onClick={onZoomIn}
              className={`inline-flex items-center justify-center rounded-lg px-1 font-black text-foreground transition-colors hover:border-(--accent) hover:text-foreground ${
                isLandscapeCompactCanvas ? 'h-6 min-w-6 text-[13px]' : 'h-7 min-w-7 text-sm'
              }`}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            {isLandscapeCompactCanvas ? null : (
              <button
                type="button"
                onClick={onResetCanvasView}
                className="inline-flex h-7 items-center justify-center rounded-lg px-1 text-[10px] font-semibold uppercase text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground"
              >
                FIT
              </button>
            )}
        </div>
      </div>

      <div
        className={canvasPanelClassName}
        style={canvasPanelStyle}
      >
        <div ref={topOverlayRef} className={topOverlayClassName}>
          <div className={paletteViewportWrapperClassName}>
            <div
              ref={paletteViewportRef}
              className="flex min-w-0 cursor-grab snap-x snap-mandatory items-center overflow-x-auto overflow-y-visible active:cursor-grabbing"
              style={{
                touchAction: 'none',
                scrollbarWidth: 'none',
                overscrollBehaviorX: 'contain',
                scrollSnapType: isPaletteMoving ? 'none' : 'x proximity',
                WebkitOverflowScrolling: 'touch',
                scrollPaddingInline: `${paletteEdgePadding}px`,
              }}
              onScroll={onPaletteScroll}
              onPointerDown={onPalettePointerDown}
              onPointerMove={onPalettePointerMove}
              onPointerUp={onPalettePointerUp}
              onPointerCancel={onPalettePointerCancel}
            >
              <div className={paletteRowClassName}>
                <div
                  aria-hidden="true"
                  className="shrink-0"
                  style={{ width: `${paletteEdgePadding}px` }}
                />
                {filteredElements.map((element, index) => (
                  <div key={`${element.number}-${element.symbol}`} className="relative flex snap-center snap-always">
                    <PaletteTile
                      buttonRef={(node) => {
                        paletteItemRefs.current[index] = node;
                      }}
                      element={element}
                      paletteIndex={index}
                      isCompact={isLandscapeCompactCanvas}
                      isSelected={!isPaletteMoving && !isPalettePointerActive && index === resolvedExpandedPaletteIndex}
                      isCentered={index === resolvedCenterPaletteIndex}
                    />
                  </div>
                ))}
                <div
                  aria-hidden="true"
                  className="shrink-0"
                  style={{ width: `${paletteEdgePadding}px` }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-(--surface-overlay-strong) px-0 backdrop-blur-xl ${
                isLandscapeCompactCanvas ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9'
              }`}
              onClick={goToPreviousPaletteElement}
              disabled={filteredElements.length === 0}
              aria-label="Select previous element"
            >
              <PaletteArrowIcon direction="left" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-(--surface-overlay-strong) px-0 backdrop-blur-xl ${
                isLandscapeCompactCanvas ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9'
              }`}
              onClick={goToNextPaletteElement}
              disabled={filteredElements.length === 0}
              aria-label="Select next element"
            >
              <PaletteArrowIcon direction="right" />
            </Button>
          </div>
        </div>

        <div
          ref={paletteSearchRailRef}
          style={paletteSearchRailStyle}
          className="absolute z-20"
        >
          <div
            style={paletteSearchPanelStyle}
            className={`pointer-events-auto flex flex-nowrap items-stretch overflow-hidden border bg-(--surface-overlay-strong) shadow-lg backdrop-blur-xl origin-left transition-[width,border-color] duration-200 ${paletteSearchShellClassName} ${
              hasActivePaletteFilter ? 'border-(--accent)' : 'border-(--border-subtle)'
            }`}
          >
            <div style={paletteSearchInnerStyle} className="flex h-full flex-nowrap items-stretch">
              <div style={paletteSearchTriggerStyle} className="flex h-full shrink-0 items-center justify-center">
                <button
                  type="button"
                  onClick={onTogglePaletteSearch}
                  className="inline-flex h-full w-full items-center justify-center text-(--text-muted) transition-colors hover:text-foreground"
                  aria-label={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
                  title={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
                >
                  <SearchIcon />
                </button>
              </div>

              <div
                className={`flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden pr-1.5 ${
                  isPaletteSearchOpen ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
                aria-hidden={!isPaletteSearchOpen}
              >
                <input
                  ref={searchInputRef}
                  id="molecule-element-search"
                  name="molecule-element-search"
                  type="text"
                  value={paletteQuery}
                  onChange={(event) => {
                    onPaletteSearchChange(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' || event.key === 'Enter') {
                      setIsPaletteSearchExpanded(false);
                    }
                  }}
                  tabIndex={isPaletteSearchOpen ? undefined : -1}
                  placeholder="Search"
                  className={`w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-(--text-muted) ${
                    isLandscapeCompactCanvas ? 'text-[11px]' : 'text-[13px]'
                  }`}
                />

                {paletteQuery.trim().length > 0 ? (
                  <button
                    type="button"
                    onClick={onClearPaletteSearch}
                    className={`inline-flex shrink-0 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:text-foreground ${paletteSearchButtonClassName}`}
                    aria-label="Clear element search"
                    title="Clear element search"
                  >
                    <CloseChipIcon />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside
          style={toolRailStyle}
          aria-hidden={isSimplifiedView}
          className={`absolute left-3 z-20 flex flex-col overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-rail) shadow-xl backdrop-blur-xl transition-opacity duration-200 ${
            effectiveToolRailCollapsed ? toolRailCollapsedWidthClassName : toolRailExpandedWidthClassName
          } ${toolRailVisibilityClassName}`}
        >
          <div className={`flex min-h-12 items-center border-b border-(--border-subtle)/70 p-2 ${effectiveToolRailCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
            {showExpandedToolRailContent ? (
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                Tools
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setIsToolRailCollapsed((current) => !current)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground"
              aria-label={effectiveToolRailCollapsed ? 'Expand tool rail' : 'Collapse tool rail'}
              title={effectiveToolRailCollapsed ? 'Expand tool rail' : 'Collapse tool rail'}
            >
              <RailToggleIcon collapsed={effectiveToolRailCollapsed} />
            </button>
          </div>

          <div className={toolRailBodyClassName}>
            <div className={effectiveToolRailCollapsed ? collapsedToolRailSectionClassName : expandedToolRailSectionClassName}>
              {showExpandedToolRailContent ? (
                <div className="flex items-center gap-2 px-1">
                  <BondOrderIcon />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                    Bond Order
                  </p>
                </div>
              ) : null}
              <div className={`grid ${effectiveToolRailCollapsed ? 'w-full grid-cols-1 place-items-center gap-2' : 'grid-cols-3 gap-1.5'}`}>
                {BOND_ORDER_OPTIONS.map((option) => (
                  (() => {
                    const isDisabled =
                      selectedAtomId === null &&
                      activeElementMaxBondSlots !== null &&
                      option.order > activeElementMaxBondSlots;
                    const disabledTitle =
                      activeElement !== null && activeElementMaxBondSlots !== null
                        ? `${activeElement.symbol} commonly supports up to ${activeElementMaxBondSlots} bond slot${
                            activeElementMaxBondSlots === 1 ? '' : 's'
                          }.`
                        : `${option.label} bond`;

                    return (
                      <button
                        key={option.order}
                        type="button"
                        onClick={() => onSetBondOrder(option.order)}
                        disabled={isDisabled}
                        title={isDisabled ? disabledTitle : `${option.label} bond`}
                        aria-label={isDisabled ? disabledTitle : `${option.label} bond`}
                        className={`border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                          isDisabled
                            ? 'border-(--border-subtle) bg-(--surface-2)/55 text-(--text-muted)'
                            : bondOrder === option.order
                              ? 'border-(--accent) bg-(--accent)/22 text-foreground'
                              : 'border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) hover:border-(--accent) hover:text-foreground'
                        } ${effectiveToolRailCollapsed ? 'mx-auto h-9 w-9 rounded-xl text-sm font-black' : 'h-9 rounded-xl px-0 text-sm font-black'}`}
                      >
                        {option.order}
                      </button>
                    );
                  })()
                ))}
              </div>
            </div>

            <div className={effectiveToolRailCollapsed ? collapsedToolRailSectionClassName : expandedToolRailSectionClassName}>
              <ToolRailButton
                icon={<UndoIcon />}
                label="Undo"
                title="Undo change (Ctrl/Cmd+Z)"
                collapsed={effectiveToolRailCollapsed}
                disabled={!canUndo}
                onClick={onUndo}
              />
              <ToolRailButton
                icon={<RedoIcon />}
                label="Redo"
                title="Redo change (Ctrl/Cmd+Shift+Z)"
                collapsed={effectiveToolRailCollapsed}
                disabled={!canRedo}
                onClick={onRedo}
              />
              <ToolRailButton
                icon={<AddAtomIcon />}
                label="Add selected element"
                collapsed={effectiveToolRailCollapsed}
                disabled={activeElement === null}
                onClick={onAddSelectedElement}
              />
              <ToolRailButton
                icon={<RemoveAtomIcon />}
                label="Remove selected atom"
                collapsed={effectiveToolRailCollapsed}
                disabled={selectedAtomId === null}
                onClick={onRemoveSelectedAtom}
              />
              <ToolRailButton
                icon={<ClearSelectionIcon />}
                label="Clear selection"
                collapsed={effectiveToolRailCollapsed}
                disabled={selectedAtomId === null}
                onClick={onClearSelection}
              />
              <ToolRailButton
                icon={<ResetEditorIcon />}
                label="Reset editor"
                collapsed={effectiveToolRailCollapsed}
                danger
                onClick={onResetMolecule}
              />
            </div>
          </div>
        </aside>

        <div
          ref={canvasFrameRef}
          className={canvasFrameClassName}
        >
          {isSimplifiedView ? (
            <div
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              style={simplifiedViewStyle}
            >
              <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-start gap-2.5 sm:gap-4 lg:justify-center">
                <div className="rounded-[24px] border border-(--border-subtle) bg-(--surface-overlay-soft) px-3.5 py-4 text-center shadow-sm backdrop-blur-sm sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted) sm:text-[11px]">
                    Simplified
                  </p>
                  <p className="mt-2.5 wrap-break-word text-[clamp(1.5rem,8vw,4.5rem)] font-black leading-[0.96] tracking-[0.03em] text-foreground">
                    {formula}
                  </p>
                  <p className="mx-auto mt-2.5 max-w-2xl text-[11px] leading-relaxed text-(--text-muted) sm:mt-4 sm:text-sm">
                    Compact composition view for the current molecule.
                  </p>
                </div>

                {compositionRows.length > 0 ? (
                  <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {compositionRows.map((row) => (
                      <div
                        key={row.symbol}
                        className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3.5 py-3 shadow-sm backdrop-blur-sm"
                      >
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)">
                          {row.name}
                        </dt>
                        <dd className="mt-2 flex items-end justify-between gap-3">
                          <span className="text-xl font-black text-foreground sm:text-2xl">{row.symbol}</span>
                          <span className="text-base font-semibold text-foreground sm:text-lg">{row.count}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="rounded-2xl border border-dashed border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-5 text-center text-sm text-(--text-muted)">
                    Add atoms to generate a simplified formula.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EditorCanvas
              model={molecule}
              mode={activeView}
              viewBox={interactiveViewBox}
              selectedAtomId={selectedAtomId}
              svgRef={svgRef}
              onCanvasPointerDown={onCanvasPointerDown}
              onCanvasPointerMove={onCanvasPointerMove}
              onCanvasPointerUp={onCanvasPointerUp}
              onCanvasPointerCancel={onCanvasPointerCancel}
              onCanvasWheel={onCanvasWheel}
              onAtomPointerDown={onAtomPointerDown}
            />
          )}
        </div>

        {isSimplifiedView ? null : (
          <div className={compactBottomOverlayClassName}>
            <div ref={bottomNoticeRef} className={compactBottomNoticeClassName}>
              {editorNotice}
            </div>
          </div>
        )}

        {isSimplifiedView ? null : (
          <div className="absolute right-3 z-20" style={formulaPanelStyle}>
            <div
              className={`relative overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) shadow-lg backdrop-blur-xl transition-[width,opacity] duration-300 ${formulaPanelHeightClassName} ${formulaPanelWidthClassName} ${
                isFormulaPanelOpen ? 'opacity-100' : 'opacity-95'
              }`}
            >
              <div className={`absolute inset-y-0 right-0 flex items-stretch ${formulaPanelExpandedWidthClassName}`}>
                <div
                  className={`min-w-0 flex-1 overflow-hidden transition-opacity duration-200 ${
                    isFormulaPanelOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden={!isFormulaPanelOpen}
                >
                  <table className={`h-full w-full table-fixed border-collapse text-left text-(--text-muted) ${isLandscapeCompactCanvas ? 'text-[7px]' : 'text-[8px] sm:text-[9px]'}`}>
                    <tbody className="h-full">
                        {formulaStatsRows.map((row, index) => (
                          <tr key={row.label} className={index % 2 === 0 ? 'bg-(--surface-zebra-odd)' : 'bg-(--surface-zebra-even)'}>
                            <th className={`border-r border-(--border-subtle)/35 font-semibold uppercase tracking-[0.08em] text-(--text-muted) ${isLandscapeCompactCanvas ? 'w-[39%] px-1 py-[2px]' : 'w-[42%] px-1.5 py-[3px]'}`}>
                              {row.label}
                            </th>
                            <td
                              className={`font-semibold text-foreground ${
                                row.label === 'Formula' ? 'break-words text-right leading-tight' : 'text-right'
                              } ${isLandscapeCompactCanvas ? 'px-1 py-[2px]' : 'px-1.5 py-[3px]'}`}
                            >
                              {row.value}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormulaPanelOpen((current) => !current)}
                  className={`inline-flex h-full shrink-0 items-center justify-center border-l border-(--border-subtle)/70 font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition-colors hover:text-foreground ${formulaPanelButtonClassName}`}
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  aria-label={isFormulaPanelOpen ? 'Hide summary' : 'Show summary'}
                  title={isFormulaPanelOpen ? 'Hide summary' : 'Show summary'}
                >
                  SUMMARY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(MolecularEditor);
