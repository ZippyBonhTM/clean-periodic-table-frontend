'use client';

import MoleculeEditorToolRailButton from '@/components/organisms/molecular-editor/MoleculeEditorToolRailButton';
import {
  AddAtomIcon,
  ClearSelectionIcon,
  RedoIcon,
  RemoveAtomIcon,
  ResetEditorIcon,
  SaveGalleryIcon,
  UndoIcon,
} from '@/components/organisms/molecular-editor/moleculeEditorToolRailIcons';

type MoleculeEditorToolRailActionsProps = {
  activeElementSymbol: string | null;
  canRedo: boolean;
  canUndo: boolean;
  collapsedSectionClassName: string;
  effectiveToolRailCollapsed: boolean;
  expandedSectionClassName: string;
  isSaveModalOpen: boolean;
  onAddSelectedElement: () => void;
  onClearSelection: () => void;
  onOpenSaveModal: () => void;
  onRedo: () => void;
  onRemoveSelectedAtom: () => void;
  onResetMolecule: () => void;
  onUndo: () => void;
  selectedAtomId: string | null;
  summaryAtomCount: number;
};

export default function MoleculeEditorToolRailActions({
  activeElementSymbol,
  canRedo,
  canUndo,
  collapsedSectionClassName,
  effectiveToolRailCollapsed,
  expandedSectionClassName,
  isSaveModalOpen,
  onAddSelectedElement,
  onClearSelection,
  onOpenSaveModal,
  onRedo,
  onRemoveSelectedAtom,
  onResetMolecule,
  onUndo,
  selectedAtomId,
  summaryAtomCount,
}: MoleculeEditorToolRailActionsProps) {
  return (
    <div className={effectiveToolRailCollapsed ? collapsedSectionClassName : expandedSectionClassName}>
      <MoleculeEditorToolRailButton
        icon={<SaveGalleryIcon />}
        label="Save as New"
        title="Open gallery save dialog"
        collapsed={effectiveToolRailCollapsed}
        active={isSaveModalOpen}
        disabled={summaryAtomCount === 0}
        onClick={onOpenSaveModal}
      />
      <MoleculeEditorToolRailButton
        icon={<UndoIcon />}
        label="Undo"
        title="Undo change (Ctrl/Cmd+Z)"
        collapsed={effectiveToolRailCollapsed}
        disabled={!canUndo}
        onClick={onUndo}
      />
      <MoleculeEditorToolRailButton
        icon={<RedoIcon />}
        label="Redo"
        title="Redo change (Ctrl/Cmd+Shift+Z)"
        collapsed={effectiveToolRailCollapsed}
        disabled={!canRedo}
        onClick={onRedo}
      />
      <MoleculeEditorToolRailButton
        icon={<AddAtomIcon />}
        label="Add selected element"
        collapsed={effectiveToolRailCollapsed}
        disabled={activeElementSymbol === null}
        onClick={onAddSelectedElement}
      />
      <MoleculeEditorToolRailButton
        icon={<RemoveAtomIcon />}
        label="Remove selected atom"
        collapsed={effectiveToolRailCollapsed}
        disabled={selectedAtomId === null}
        onClick={onRemoveSelectedAtom}
      />
      <MoleculeEditorToolRailButton
        icon={<ClearSelectionIcon />}
        label="Clear selection"
        collapsed={effectiveToolRailCollapsed}
        disabled={selectedAtomId === null}
        onClick={onClearSelection}
      />
      <MoleculeEditorToolRailButton
        icon={<ResetEditorIcon />}
        label="Reset editor"
        collapsed={effectiveToolRailCollapsed}
        danger
        onClick={onResetMolecule}
      />
    </div>
  );
}
