'use client';

import type { CanvasViewport, EditorViewMode } from '@/components/organisms/molecular-editor/moleculeEditorSession';
import type { BondOrder, MoleculeModel } from '@/shared/utils/moleculeEditor';

export const VIEW_OPTIONS: Array<{ mode: EditorViewMode; label: string }> = [
  { mode: 'editor', label: 'Editor' },
  { mode: 'structural', label: 'Structural' },
  { mode: 'simplified', label: 'Simplified' },
  { mode: 'stick', label: 'Stick' },
];

export const BOND_ORDER_OPTIONS: Array<{ order: BondOrder; label: string }> = [
  { order: 1, label: 'Single' },
  { order: 2, label: 'Double' },
  { order: 3, label: 'Triple' },
];

export const DEFAULT_EDITOR_NOTICE =
  'Select an element, then double-click or double-tap the canvas to place it.';

export const EMPTY_MOLECULE: MoleculeModel = {
  atoms: [],
  bonds: [],
};

export const DEFAULT_CANVAS_VIEWPORT: CanvasViewport = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

export function isTextEditingElement(target: EventTarget | null): boolean {
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
