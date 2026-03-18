'use client';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
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
  const text = useMolecularEditorText();

  return (
    <div className={effectiveToolRailCollapsed ? collapsedSectionClassName : expandedSectionClassName}>
      <MoleculeEditorToolRailButton
        icon={<SaveGalleryIcon />}
        label={text.toolRail.saveAsNew}
        title={text.toolRail.saveDialog}
        collapsed={effectiveToolRailCollapsed}
        active={isSaveModalOpen}
        disabled={summaryAtomCount === 0}
        onClick={onOpenSaveModal}
      />
      <MoleculeEditorToolRailButton
        icon={<UndoIcon />}
        label={text.toolRail.undo}
        title={text.toolRail.undoTitle}
        collapsed={effectiveToolRailCollapsed}
        disabled={!canUndo}
        onClick={onUndo}
      />
      <MoleculeEditorToolRailButton
        icon={<RedoIcon />}
        label={text.toolRail.redo}
        title={text.toolRail.redoTitle}
        collapsed={effectiveToolRailCollapsed}
        disabled={!canRedo}
        onClick={onRedo}
      />
      <MoleculeEditorToolRailButton
        icon={<AddAtomIcon />}
        label={text.toolRail.addSelectedElement}
        collapsed={effectiveToolRailCollapsed}
        disabled={activeElementSymbol === null}
        onClick={onAddSelectedElement}
      />
      <MoleculeEditorToolRailButton
        icon={<RemoveAtomIcon />}
        label={text.toolRail.removeSelectedAtom}
        collapsed={effectiveToolRailCollapsed}
        disabled={selectedAtomId === null}
        onClick={onRemoveSelectedAtom}
      />
      <MoleculeEditorToolRailButton
        icon={<ClearSelectionIcon />}
        label={text.toolRail.clearSelection}
        collapsed={effectiveToolRailCollapsed}
        disabled={selectedAtomId === null}
        onClick={onClearSelection}
      />
      <MoleculeEditorToolRailButton
        icon={<ResetEditorIcon />}
        label={text.toolRail.resetEditor}
        collapsed={effectiveToolRailCollapsed}
        danger
        onClick={onResetMolecule}
      />
    </div>
  );
}
