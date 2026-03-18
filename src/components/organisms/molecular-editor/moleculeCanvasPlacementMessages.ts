'use client';

import type { MolecularEditorTextCatalog } from '@/components/organisms/molecular-editor/molecularEditorText';

export function resolveCanvasSelectionClearNotice(text: MolecularEditorTextCatalog, pointerType: string) {
  return pointerType === 'touch'
    ? text.notices.doubleTapSelectionClear
    : text.notices.doubleClickSelectionClear;
}

export function resolveCanvasPlacementNotice(text: MolecularEditorTextCatalog, pointerType: string) {
  return pointerType === 'touch'
    ? text.notices.doubleTapPlacement
    : text.notices.doubleClickPlacement;
}
