'use client';

import { useCallback, useEffect } from 'react';
import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  WheelEvent as ReactWheelEvent,
} from 'react';

import {
  preserveViewportAcrossModelChange,
  resolveInteractiveViewBox,
  resolveNextStandalonePoint,
  resolveScaledViewBoxMetrics,
  resolveViewBox,
} from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type { ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import type { ChemicalElement } from '@/shared/types/element';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import {
  addAttachedAtom,
  addStandaloneAtom,
  connectAtoms,
  dedupeBondConnections,
  rebalanceMoleculeLayout,
  removeAtom,
  syncMoleculeIdCounter,
  type BondOrder,
  type MoleculeComponent,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type CanvasViewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

type GalleryFeedbackTone = 'info' | 'success' | 'error';

type UseMoleculeEditorActionsOptions<Snapshot> = {
  activeElement: ChemicalElement | null;
  activeView: EditorViewMode;
  applyEditorSnapshot: (snapshot: Snapshot, notice: string) => void;
  bondOrder: BondOrder;
  buildHistorySnapshot: () => Snapshot;
  canvasFrameAspectRatio?: number;
  canvasFrameSize: {
    width: number;
    height: number;
  };
  canvasViewport: CanvasViewport;
  clearPendingCanvasPlacementRef: MutableRefObject<() => void>;
  clearTransientEditorStateRef: MutableRefObject<() => void>;
  cloneMoleculeModel: (model: MoleculeModel) => MoleculeModel;
  defaultCanvasViewport: CanvasViewport;
  emptyMolecule: MoleculeModel;
  isImportModalOpen: boolean;
  isSaveModalOpen: boolean;
  isTextEditingElement: (target: EventTarget | null) => boolean;
  molecule: MoleculeModel;
  moleculeComponents: MoleculeComponent[];
  normalizeSelectedAtomId: (model: MoleculeModel, selectedAtomId: string | null) => string | null;
  pageMode: 'editor' | 'gallery';
  pushHistorySnapshot: (snapshot: Snapshot) => void;
  selectedAtomId: string | null;
  setActiveSavedMoleculeId: Dispatch<SetStateAction<string | null>>;
  setActiveView: Dispatch<SetStateAction<EditorViewMode>>;
  setBondOrder: Dispatch<SetStateAction<BondOrder>>;
  setCanvasViewport: Dispatch<SetStateAction<CanvasViewport>>;
  setEditorNotice: Dispatch<SetStateAction<string | null>>;
  setFocusedComponentIndex: Dispatch<SetStateAction<number>>;
  setIsImportModalOpen: Dispatch<SetStateAction<boolean>>;
  setMolecule: Dispatch<SetStateAction<MoleculeModel>>;
  setMoleculeEducationalDescription: Dispatch<SetStateAction<string>>;
  setMoleculeName: Dispatch<SetStateAction<string>>;
  setNomenclatureFallback: Dispatch<SetStateAction<string | null>>;
  setSelectedAtomId: Dispatch<SetStateAction<string | null>>;
  showGalleryFeedback: (
    tone: GalleryFeedbackTone,
    message: string,
    options?: {
      persist?: boolean;
    },
  ) => void;
};

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
  return Math.min(3, Math.max(0.5, scale));
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

export default function useMoleculeEditorActions<Snapshot>({
  activeElement,
  activeView,
  applyEditorSnapshot,
  bondOrder,
  buildHistorySnapshot,
  canvasFrameAspectRatio,
  canvasFrameSize,
  canvasViewport,
  clearPendingCanvasPlacementRef,
  clearTransientEditorStateRef,
  cloneMoleculeModel,
  defaultCanvasViewport,
  emptyMolecule,
  isImportModalOpen,
  isSaveModalOpen,
  isTextEditingElement,
  molecule,
  moleculeComponents,
  normalizeSelectedAtomId,
  pageMode,
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
}: UseMoleculeEditorActionsOptions<Snapshot>) {
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

  const onFocusComponent = useCallback(
    (componentIndex: number) => {
      const component = moleculeComponents[componentIndex];

      if (component === undefined) {
        return;
      }

      setFocusedComponentIndex(componentIndex);
      setSelectedAtomId(null);
      setEditorNotice(`Mol ${componentIndex + 1} focused.`);

      const nextViewportMetrics = resolveScaledViewBoxMetrics(
        molecule,
        canvasViewport.scale,
        canvasFrameAspectRatio,
      );

      setCanvasViewport((currentViewport) => ({
        ...currentViewport,
        offsetX: component.center.x - nextViewportMetrics.centerX,
        offsetY: component.center.y - nextViewportMetrics.centerY,
      }));
    },
    [
      canvasFrameAspectRatio,
      canvasViewport.scale,
      molecule,
      moleculeComponents,
      setCanvasViewport,
      setEditorNotice,
      setFocusedComponentIndex,
      setSelectedAtomId,
    ],
  );

  const onClearSelection = useCallback(() => {
    clearPendingCanvasPlacementRef.current();
    setSelectedAtomId(null);
    setEditorNotice('Selection cleared.');
  }, [clearPendingCanvasPlacementRef, setEditorNotice, setSelectedAtomId]);

  const onCanvasWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        const nextScale = clampCanvasScale(
          canvasViewport.scale * (event.deltaY > 0 ? 1 / 1.15 : 1.15),
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

      const delta = toSvgDelta(event.currentTarget, event.currentTarget.viewBox.baseVal, event.deltaX, event.deltaY);
      setCanvasViewport((current) => ({
        ...current,
        offsetX: current.offsetX + delta.x,
        offsetY: current.offsetY + delta.y,
      }));
    },
    [activeView, canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule, setCanvasViewport],
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

  const onZoomOut = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale / 1.15,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule, setCanvasViewport]);

  const onZoomIn = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale * 1.15,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule, setCanvasViewport]);

  const onResetCanvasView = useCallback(() => {
    setCanvasViewport(defaultCanvasViewport);
    setEditorNotice('Canvas view reset.');
  }, [defaultCanvasViewport, setCanvasViewport, setEditorNotice]);

  return {
    handleAtomActivate,
    handleCanvasPlacement,
    onAddSelectedElement,
    onCanvasWheel,
    onClearSelection,
    onFocusComponent,
    onImportExternalMolecule,
    onRemoveSelectedAtom,
    onResetCanvasView,
    onResetMolecule,
    onZoomIn,
    onZoomOut,
  };
}
