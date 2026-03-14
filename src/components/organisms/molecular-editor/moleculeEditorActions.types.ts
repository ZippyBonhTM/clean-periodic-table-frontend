'use client';

import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  WheelEvent as ReactWheelEvent,
} from 'react';

import type { ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import type { ChemicalElement } from '@/shared/types/element';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import type { BondOrder, MoleculeComponent, MoleculeModel } from '@/shared/utils/moleculeEditor';

export type EditorViewMode = SavedMoleculeEditorState['activeView'];

export type CanvasViewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type GalleryFeedbackTone = 'info' | 'success' | 'error';

export type MoleculeChangeResult = {
  molecule: MoleculeModel;
  selectedAtomId: string | null;
  error?: string;
};

export type UseMoleculeEditorActionsOptions<Snapshot> = {
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

export type MoleculeEditorViewportActions = {
  onCanvasWheel: (event: ReactWheelEvent<SVGSVGElement>) => void;
  onFocusComponent: (componentIndex: number) => void;
  onResetCanvasView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export type MoleculeEditorStructureActions = {
  handleAtomActivate: (atomId: string) => void;
  handleCanvasPlacement: (point: { x: number; y: number }) => void;
  onAddSelectedElement: () => void;
  onClearSelection: () => void;
  onImportExternalMolecule: (compound: ResolvedImportedPubChemCompound) => Promise<void>;
  onRemoveSelectedAtom: () => void;
  onResetMolecule: () => void;
};
