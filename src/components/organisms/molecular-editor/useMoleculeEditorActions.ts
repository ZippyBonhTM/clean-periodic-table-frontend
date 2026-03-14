'use client';

import { useEffect } from 'react';

import useMoleculeEditorStructureActions from '@/components/organisms/molecular-editor/useMoleculeEditorStructureActions';
import useMoleculeEditorViewportActions from '@/components/organisms/molecular-editor/useMoleculeEditorViewportActions';
import type {
  MoleculeEditorStructureActions,
  MoleculeEditorViewportActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';

export default function useMoleculeEditorActions<Snapshot>(
  options: UseMoleculeEditorActionsOptions<Snapshot>,
): MoleculeEditorStructureActions & MoleculeEditorViewportActions {
  const structureActions = useMoleculeEditorStructureActions(options);
  const viewportActions = useMoleculeEditorViewportActions(options);

  const {
    isImportModalOpen,
    isSaveModalOpen,
    isTextEditingElement,
    pageMode,
    selectedAtomId,
  } = options;
  const { onRemoveSelectedAtom } = structureActions;

  useEffect(() => {
    if (pageMode !== 'editor') {
      return;
    }

    const handleDeleteKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || isSaveModalOpen || isImportModalOpen) {
        return;
      }

      if (isTextEditingElement(event.target) || selectedAtomId === null) {
        return;
      }

      event.preventDefault();
      onRemoveSelectedAtom();
    };

    window.addEventListener('keydown', handleDeleteKeyDown);

    return () => {
      window.removeEventListener('keydown', handleDeleteKeyDown);
    };
  }, [
    isImportModalOpen,
    isSaveModalOpen,
    isTextEditingElement,
    onRemoveSelectedAtom,
    pageMode,
    selectedAtomId,
  ]);

  return {
    ...structureActions,
    ...viewportActions,
  };
}
