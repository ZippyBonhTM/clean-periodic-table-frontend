'use client';

import { useCallback, useRef, useState } from 'react';

import type { CanvasViewport, EditorViewMode } from '@/components/organisms/molecular-editor/moleculeEditorSession';
import {
  DEFAULT_CANVAS_VIEWPORT,
  EMPTY_MOLECULE,
} from '@/components/organisms/molecular-editor/moleculeEditorConfig';
import type { BondOrder, MoleculeModel } from '@/shared/utils/moleculeEditor';

export default function useMoleculeEditorState() {
  const [molecule, setMolecule] = useState<MoleculeModel>(EMPTY_MOLECULE);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<EditorViewMode>('editor');
  const [bondOrder, setBondOrder] = useState<BondOrder>(1);
  const [isToolRailCollapsed, setIsToolRailCollapsed] = useState(true);
  const [isFormulaPanelOpen, setIsFormulaPanelOpen] = useState(false);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFloatingSaveShortcutExpanded, setIsFloatingSaveShortcutExpanded] = useState(false);
  const [activeSavedMoleculeId, setActiveSavedMoleculeId] = useState<string | null>(null);
  const [focusedComponentIndex, setFocusedComponentIndex] = useState(0);
  const [nomenclatureFallback, setNomenclatureFallback] = useState<string | null>(null);
  const [moleculeName, setMoleculeName] = useState('');
  const [moleculeEducationalDescription, setMoleculeEducationalDescription] = useState('');
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>(DEFAULT_CANVAS_VIEWPORT);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clearPendingCanvasPlacementRef = useRef<() => void>(() => undefined);
  const clearTransientEditorStateRef = useRef<() => void>(() => undefined);

  const onSetActiveView = useCallback((nextView: EditorViewMode) => {
    setIsFloatingSaveShortcutExpanded(false);
    setActiveView(nextView);
  }, []);

  const onSetBondOrder = useCallback((nextBondOrder: BondOrder) => {
    setBondOrder(nextBondOrder);
  }, []);

  const onOpenImportModal = useCallback((onCloseSaveModal: () => void) => {
    setIsFloatingSaveShortcutExpanded(false);
    onCloseSaveModal();
    setIsImportModalOpen(true);
  }, []);

  const onCloseImportModal = useCallback(() => {
    setIsImportModalOpen(false);
  }, []);

  return {
    activeSavedMoleculeId,
    activeView,
    bondOrder,
    canvasViewport,
    clearPendingCanvasPlacementRef,
    clearTransientEditorStateRef,
    editorNotice,
    focusedComponentIndex,
    isFloatingSaveShortcutExpanded,
    isFormulaPanelOpen,
    isImportModalOpen,
    isToolRailCollapsed,
    molecule,
    moleculeEducationalDescription,
    moleculeName,
    nomenclatureFallback,
    onCloseImportModal,
    onOpenImportModal,
    onSetActiveView,
    onSetBondOrder,
    selectedAtomId,
    setActiveSavedMoleculeId,
    setActiveView,
    setBondOrder,
    setCanvasViewport,
    setEditorNotice,
    setFocusedComponentIndex,
    setIsFloatingSaveShortcutExpanded,
    setIsFormulaPanelOpen,
    setIsImportModalOpen,
    setIsToolRailCollapsed,
    setMolecule,
    setMoleculeEducationalDescription,
    setMoleculeName,
    setNomenclatureFallback,
    setSelectedAtomId,
    svgRef,
  };
}
