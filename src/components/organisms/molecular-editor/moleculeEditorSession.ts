'use client';

import type { SavedMolecule, SavedMoleculeEditorState } from '@/shared/types/molecule';
import {
  buildCompositionRows,
  buildMolecularFormula,
  buildSystematicMoleculeName,
  dedupeBondConnections,
  normalizeMoleculeModel,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
  summarizeMolecule,
  type BondOrder,
  type MoleculeComponent,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

export type EditorViewMode = SavedMoleculeEditorState['activeView'];

export type CanvasViewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type SavedEditorDraft = {
  molecule: MoleculeModel;
  selectedAtomId: string | null;
  nomenclatureFallback: string | null;
  activeView: EditorViewMode;
  bondOrder: BondOrder;
  canvasViewport: CanvasViewport;
};

export type GalleryFeedbackTone = 'info' | 'success' | 'error';

export type GalleryFeedback = {
  tone: GalleryFeedbackTone;
  message: string;
};

export function cloneMoleculeModel(model: MoleculeModel): MoleculeModel {
  return dedupeBondConnections({
    atoms: model.atoms.map((atom) => ({ ...atom })),
    bonds: model.bonds.map((bond) => ({ ...bond })),
  });
}

export function normalizeSnapshotSelectedAtomId(
  model: MoleculeModel,
  selectedAtomId: string | null,
): string | null {
  return selectedAtomId !== null && model.atoms.some((atom) => atom.id === selectedAtomId) ? selectedAtomId : null;
}

export function cloneEditorSnapshot(snapshot: SavedEditorDraft): SavedEditorDraft {
  return {
    molecule: cloneMoleculeModel(snapshot.molecule),
    selectedAtomId: normalizeSnapshotSelectedAtomId(snapshot.molecule, snapshot.selectedAtomId),
    nomenclatureFallback: snapshot.nomenclatureFallback,
    activeView: snapshot.activeView,
    bondOrder: snapshot.bondOrder,
    canvasViewport: {
      offsetX: snapshot.canvasViewport.offsetX,
      offsetY: snapshot.canvasViewport.offsetY,
      scale: snapshot.canvasViewport.scale,
    },
  };
}

export function normalizeSavedMoleculeRecord(savedMolecule: SavedMolecule): SavedMolecule {
  const normalized = normalizeMoleculeModel(savedMolecule.molecule);
  const normalizedModel = normalized.model;
  const components = resolveMoleculeComponents(normalizedModel);
  const primaryComponent = components[resolvePrimaryMoleculeComponentIndex(components)]?.model ?? normalizedModel;
  const selectedAtomId =
    savedMolecule.editorState.selectedAtomId === null
      ? null
      : normalized.atomIdsByOriginalId.get(savedMolecule.editorState.selectedAtomId)?.[0] ?? null;
  const normalizedSummary = summarizeMolecule(normalizedModel);
  const systematicName = buildSystematicMoleculeName(primaryComponent);

  return {
    ...savedMolecule,
    molecule: normalizedModel,
    editorState: {
      ...savedMolecule.editorState,
      selectedAtomId,
    },
    summary: {
      systematicName,
      componentCount: components.length,
      formula: buildMolecularFormula(normalizedModel),
      atomCount: normalizedSummary.atomCount,
      bondCount: normalizedSummary.bondCount,
      totalBondOrder: normalizedSummary.totalBondOrder,
      composition: buildCompositionRows(normalizedModel),
    },
  };
}

export function resolveMoleculeComponentIndexByAtomId(
  components: MoleculeComponent[],
  atomId: string | null,
): number | null {
  if (atomId === null) {
    return null;
  }

  const componentIndex = components.findIndex((component) => component.atomIds.includes(atomId));
  return componentIndex === -1 ? null : componentIndex;
}

export function resolveDefaultFocusedComponentIndex(
  model: MoleculeModel,
  selectedAtomId: string | null,
): number {
  const components = resolveMoleculeComponents(model);
  const selectedComponentIndex = resolveMoleculeComponentIndexByAtomId(components, selectedAtomId);

  if (selectedComponentIndex !== null) {
    return selectedComponentIndex;
  }

  return resolvePrimaryMoleculeComponentIndex(components);
}

export function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
