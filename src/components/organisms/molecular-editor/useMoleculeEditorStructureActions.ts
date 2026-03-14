'use client';

import { useCallback } from 'react';

import { preserveViewportAcrossModelChange, resolveNextStandalonePoint } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type { ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import type {
  MoleculeChangeResult,
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import {
  addAttachedAtom,
  addStandaloneAtom,
  connectAtoms,
  dedupeBondConnections,
  rebalanceMoleculeLayout,
  removeAtom,
  syncMoleculeIdCounter,
} from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorStructureActionsOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'activeElement'
  | 'activeView'
  | 'applyEditorSnapshot'
  | 'bondOrder'
  | 'buildHistorySnapshot'
  | 'canvasFrameAspectRatio'
  | 'canvasViewport'
  | 'clearPendingCanvasPlacementRef'
  | 'clearTransientEditorStateRef'
  | 'cloneMoleculeModel'
  | 'defaultCanvasViewport'
  | 'emptyMolecule'
  | 'molecule'
  | 'normalizeSelectedAtomId'
  | 'pushHistorySnapshot'
  | 'selectedAtomId'
  | 'setActiveSavedMoleculeId'
  | 'setActiveView'
  | 'setBondOrder'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setFocusedComponentIndex'
  | 'setIsImportModalOpen'
  | 'setMolecule'
  | 'setMoleculeEducationalDescription'
  | 'setMoleculeName'
  | 'setNomenclatureFallback'
  | 'setSelectedAtomId'
  | 'showGalleryFeedback'
>;

export default function useMoleculeEditorStructureActions<Snapshot>({
  activeElement,
  activeView,
  applyEditorSnapshot,
  bondOrder,
  buildHistorySnapshot,
  canvasFrameAspectRatio,
  canvasViewport,
  clearPendingCanvasPlacementRef,
  clearTransientEditorStateRef,
  cloneMoleculeModel,
  defaultCanvasViewport,
  emptyMolecule,
  molecule,
  normalizeSelectedAtomId,
  pushHistorySnapshot,
  selectedAtomId,
  setActiveSavedMoleculeId,
  setActiveView,
  setBondOrder,
  setCanvasViewport,
  setEditorNotice,
  setFocusedComponentIndex,
  setIsImportModalOpen,
  setMolecule,
  setMoleculeEducationalDescription,
  setMoleculeName,
  setNomenclatureFallback,
  setSelectedAtomId,
  showGalleryFeedback,
}: UseMoleculeEditorStructureActionsOptions<Snapshot>): MoleculeEditorStructureActions {
  const commitMoleculeChange = useCallback(
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
      setEditorNotice(result.error ?? successMessage);
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
    ],
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
  }, [activeElement, bondOrder, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice]);

  const handleCanvasPlacement = useCallback(
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
    [activeElement, activeView, bondOrder, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice],
  );

  const handleAtomActivate = useCallback(
    (atomId: string) => {
      clearPendingCanvasPlacementRef.current();

      if (selectedAtomId === null) {
        setSelectedAtomId(atomId);
        setEditorNotice('Atom selected. Tap another atom to create a bond, or use the tools to attach the active element.');
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
    [bondOrder, clearPendingCanvasPlacementRef, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice, setSelectedAtomId],
  );

  const onClearSelection = useCallback(() => {
    clearPendingCanvasPlacementRef.current();
    setSelectedAtomId(null);
    setEditorNotice('Selection cleared.');
  }, [clearPendingCanvasPlacementRef, setEditorNotice, setSelectedAtomId]);

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
    const sanitizedMolecule = dedupeBondConnections(rebalancedMolecule);

    setCanvasViewport(nextViewport);
    pushHistorySnapshot(buildHistorySnapshot());
    setMolecule(sanitizedMolecule);
    setSelectedAtomId(null);
    setEditorNotice('Selected atom removed.');
  }, [
    buildHistorySnapshot,
    canvasFrameAspectRatio,
    canvasViewport,
    molecule,
    pushHistorySnapshot,
    selectedAtomId,
    setCanvasViewport,
    setEditorNotice,
    setMolecule,
    setSelectedAtomId,
  ]);

  const onResetMolecule = useCallback(() => {
    const isAlreadyPristine =
      molecule.atoms.length === 0 &&
      selectedAtomId === null &&
      activeView === 'editor' &&
      bondOrder === 1 &&
      canvasViewport.offsetX === defaultCanvasViewport.offsetX &&
      canvasViewport.offsetY === defaultCanvasViewport.offsetY &&
      canvasViewport.scale === defaultCanvasViewport.scale;

    if (isAlreadyPristine) {
      setEditorNotice('Editor already reset.');
      return;
    }

    pushHistorySnapshot(buildHistorySnapshot());
    clearTransientEditorStateRef.current();
    setMolecule(emptyMolecule);
    setSelectedAtomId(null);
    setFocusedComponentIndex(0);
    setNomenclatureFallback(null);
    setActiveView('editor');
    setBondOrder(1);
    setCanvasViewport(defaultCanvasViewport);
    setEditorNotice('Editor reset.');
  }, [
    activeView,
    bondOrder,
    buildHistorySnapshot,
    canvasViewport.offsetX,
    canvasViewport.offsetY,
    canvasViewport.scale,
    clearTransientEditorStateRef,
    defaultCanvasViewport,
    emptyMolecule,
    molecule.atoms.length,
    pushHistorySnapshot,
    selectedAtomId,
    setActiveView,
    setBondOrder,
    setCanvasViewport,
    setEditorNotice,
    setFocusedComponentIndex,
    setMolecule,
    setNomenclatureFallback,
    setSelectedAtomId,
  ]);

  const onImportExternalMolecule = useCallback(
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

  return {
    handleAtomActivate,
    handleCanvasPlacement,
    onAddSelectedElement,
    onClearSelection,
    onImportExternalMolecule,
    onRemoveSelectedAtom,
    onResetMolecule,
  };
}
