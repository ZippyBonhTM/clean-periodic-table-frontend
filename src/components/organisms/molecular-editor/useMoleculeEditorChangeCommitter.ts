'use client';

import { useCallback } from 'react';

import {
  formatMolecularEditorIssueMessage,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import { preserveViewportAcrossModelChange } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type {
  MoleculeChangeResult,
  MoleculeEditorChangeCommitter,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import { dedupeBondConnections } from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorChangeCommitterOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'buildHistorySnapshot'
  | 'canvasFrameAspectRatio'
  | 'canvasViewport'
  | 'clearPendingCanvasPlacementRef'
  | 'molecule'
  | 'normalizeSelectedAtomId'
  | 'pushHistorySnapshot'
  | 'selectedAtomId'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setMolecule'
  | 'setNomenclatureFallback'
  | 'setSelectedAtomId'
>;

export default function useMoleculeEditorChangeCommitter<Snapshot>({
  buildHistorySnapshot,
  canvasFrameAspectRatio,
  canvasViewport,
  clearPendingCanvasPlacementRef,
  molecule,
  normalizeSelectedAtomId,
  pushHistorySnapshot,
  selectedAtomId,
  setCanvasViewport,
  setEditorNotice,
  setMolecule,
  setNomenclatureFallback,
  setSelectedAtomId,
}: UseMoleculeEditorChangeCommitterOptions<Snapshot>): MoleculeEditorChangeCommitter<Snapshot> {
  const text = useMolecularEditorText();

  return useCallback(
    (
      previousMolecule: UseMoleculeEditorActionsOptions<Snapshot>['molecule'],
      result: MoleculeChangeResult,
      successMessage: string,
      anchorPoint?: { x: number; y: number },
    ) => {
      clearPendingCanvasPlacementRef.current();
      const nextMolecule = dedupeBondConnections(result.molecule);
      const nextSelectedAtomId = normalizeSelectedAtomId(nextMolecule, result.selectedAtomId);
      const previousSelectedAtomId = normalizeSelectedAtomId(molecule, selectedAtomId);
      const didMoleculeChange = nextMolecule !== previousMolecule;
      const didSelectionChange = nextSelectedAtomId !== previousSelectedAtomId;

      if (didMoleculeChange) {
        pushHistorySnapshot(buildHistorySnapshot());
      }

      if (didMoleculeChange) {
        const nextViewport = preserveViewportAcrossModelChange(
          previousMolecule,
          nextMolecule,
          canvasViewport,
          canvasFrameAspectRatio,
          anchorPoint,
        );

        setCanvasViewport(nextViewport);
        setMolecule(nextMolecule);
        setNomenclatureFallback(null);
      }

      if (didMoleculeChange || didSelectionChange) {
        setSelectedAtomId(nextSelectedAtomId);
      }

      setEditorNotice(result.issue !== undefined ? formatMolecularEditorIssueMessage(text, result.issue) : successMessage);
    },
    [
      buildHistorySnapshot,
      canvasFrameAspectRatio,
      canvasViewport,
      clearPendingCanvasPlacementRef,
      molecule,
      normalizeSelectedAtomId,
      pushHistorySnapshot,
      selectedAtomId,
      setCanvasViewport,
      setEditorNotice,
      setMolecule,
      setNomenclatureFallback,
      setSelectedAtomId,
      text,
    ],
  );
}
