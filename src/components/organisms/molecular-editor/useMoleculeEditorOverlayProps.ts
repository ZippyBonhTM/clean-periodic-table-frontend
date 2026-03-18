'use client';

import { useMemo } from 'react';
import type { ComponentProps } from 'react';

import type MoleculeEditorOverlays from '@/components/organisms/molecular-editor/MoleculeEditorOverlays';
import type { GalleryFeedback } from '@/components/organisms/molecular-editor/moleculeEditorSession';
import {
  formatMolecularEditorComponentLabel,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type { ChemicalElement } from '@/shared/types/element';

type MoleculeEditorOverlaysProps = ComponentProps<typeof MoleculeEditorOverlays>;

type UseMoleculeEditorOverlayPropsOptions = {
  componentCount: number;
  currentSaveLabel: string;
  elements: ChemicalElement[];
  feedback: GalleryFeedback | null;
  focusedAtomCount: number;
  focusedBondCount: number;
  focusedComponentIndex: number;
  formula: string;
  hasLinkedSelection: boolean;
  isImportModalOpen: boolean;
  isMutating: boolean;
  isSaveModalOpen: boolean;
  moleculeEducationalDescription: string;
  moleculeTitle: string;
  nomenclature: string;
  onCloseImportModal: () => void;
  onCloseSaveModal: () => void;
  onDeleteSelected: () => void;
  onDetachSelection: () => void;
  onEducationalDescriptionChange: (value: string) => void;
  onImport: MoleculeEditorOverlaysProps['importModalProps']['onImport'];
  onMoleculeTitleChange: (value: string) => void;
  onSaveAsNew: () => void;
  onUpdateSelected: () => void;
  pageMode: 'editor' | 'gallery';
};

export default function useMoleculeEditorOverlayProps({
  componentCount,
  currentSaveLabel,
  elements,
  feedback,
  focusedAtomCount,
  focusedBondCount,
  focusedComponentIndex,
  formula,
  hasLinkedSelection,
  isImportModalOpen,
  isMutating,
  isSaveModalOpen,
  moleculeEducationalDescription,
  moleculeTitle,
  nomenclature,
  onCloseImportModal,
  onCloseSaveModal,
  onDeleteSelected,
  onDetachSelection,
  onEducationalDescriptionChange,
  onImport,
  onMoleculeTitleChange,
  onSaveAsNew,
  onUpdateSelected,
  pageMode,
}: UseMoleculeEditorOverlayPropsOptions): MoleculeEditorOverlaysProps {
  const text = useMolecularEditorText();
  const focusedComponentLabel = useMemo(
    () =>
      componentCount > 1
        ? `${formatMolecularEditorComponentLabel(text, focusedComponentIndex)} / ${componentCount}`
        : null,
    [componentCount, focusedComponentIndex, text],
  );

  return useMemo(
    () => ({
      feedback,
      importModalProps: {
        isOpen: isImportModalOpen,
        elements,
        onClose: onCloseImportModal,
        onImport,
      },
      pageMode,
      saveModalProps: {
        context: pageMode === 'gallery' ? 'gallery' : 'editor',
        isOpen: isSaveModalOpen,
        hasLinkedSelection,
        currentSaveLabel,
        moleculeTitle,
        educationalDescription: moleculeEducationalDescription,
        formula,
        nomenclature,
        atomCount: focusedAtomCount,
        bondCount: focusedBondCount,
        componentCount,
        focusedComponentLabel,
        isMutating,
        onClose: onCloseSaveModal,
        onMoleculeTitleChange,
        onEducationalDescriptionChange,
        onSaveAsNew,
        onUpdateSelected,
        onDetachSelection,
        onDeleteSelected,
      },
    }),
    [
      componentCount,
      currentSaveLabel,
      elements,
      feedback,
      focusedAtomCount,
      focusedBondCount,
      focusedComponentLabel,
      formula,
      hasLinkedSelection,
      isImportModalOpen,
      isMutating,
      isSaveModalOpen,
      moleculeEducationalDescription,
      moleculeTitle,
      nomenclature,
      onCloseImportModal,
      onCloseSaveModal,
      onDeleteSelected,
      onDetachSelection,
      onEducationalDescriptionChange,
      onImport,
      onMoleculeTitleChange,
      onSaveAsNew,
      onUpdateSelected,
      pageMode,
    ],
  );
}
