'use client';

import { useCallback } from 'react';

import type { ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import type { UseMoleculeEditorActionsOptions } from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import { syncMoleculeIdCounter } from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorImportActionsOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'applyEditorSnapshot'
  | 'buildHistorySnapshot'
  | 'cloneMoleculeModel'
  | 'defaultCanvasViewport'
  | 'pushHistorySnapshot'
  | 'setActiveSavedMoleculeId'
  | 'setIsImportModalOpen'
  | 'setMoleculeEducationalDescription'
  | 'setMoleculeName'
  | 'setNomenclatureFallback'
  | 'showGalleryFeedback'
>;

export default function useMoleculeEditorImportActions<Snapshot>({
  applyEditorSnapshot,
  buildHistorySnapshot,
  cloneMoleculeModel,
  defaultCanvasViewport,
  pushHistorySnapshot,
  setActiveSavedMoleculeId,
  setIsImportModalOpen,
  setMoleculeEducationalDescription,
  setMoleculeName,
  setNomenclatureFallback,
  showGalleryFeedback,
}: UseMoleculeEditorImportActionsOptions<Snapshot>) {
  return useCallback(
    async (compound: ResolvedImportedPubChemCompound) => {
      const importedMolecule = cloneMoleculeModel(compound.molecule);

      syncMoleculeIdCounter(importedMolecule);
      pushHistorySnapshot(buildHistorySnapshot());
      applyEditorSnapshot(
        {
          molecule: importedMolecule,
          selectedAtomId: null,
          nomenclatureFallback: compound.iupacName ?? null,
          activeView: 'editor',
          bondOrder: 1,
          canvasViewport: defaultCanvasViewport,
        } as Snapshot,
        `${compound.title} imported from PubChem.`,
      );
      setActiveSavedMoleculeId(null);
      setNomenclatureFallback(compound.iupacName ?? null);
      setMoleculeName(compound.title);
      setMoleculeEducationalDescription('');
      setIsImportModalOpen(false);
      showGalleryFeedback(
        'info',
        compound.importMode === 'main' && compound.omittedFragmentCount > 0
          ? `${compound.title} imported from PubChem. ${compound.omittedFragmentCount} detached fragment${
              compound.omittedFragmentCount === 1 ? '' : 's'
            } omitted so the main molecule stays editable.`
          : compound.importMode === 'all' && compound.componentCount > 1
            ? `${compound.title} imported from PubChem as a ${compound.componentCount}-component work.`
            : `${compound.title} imported from PubChem. Save it to keep this draft.`,
      );
    },
    [
      applyEditorSnapshot,
      buildHistorySnapshot,
      cloneMoleculeModel,
      defaultCanvasViewport,
      pushHistorySnapshot,
      setActiveSavedMoleculeId,
      setIsImportModalOpen,
      setMoleculeEducationalDescription,
      setMoleculeName,
      setNomenclatureFallback,
      showGalleryFeedback,
    ],
  );
}
