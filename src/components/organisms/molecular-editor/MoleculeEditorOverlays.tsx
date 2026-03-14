'use client';

import type { ComponentProps } from 'react';

import MoleculeEditorFeedbackToast from '@/components/organisms/molecular-editor/MoleculeEditorFeedbackToast';
import MoleculeImportModal from '@/components/organisms/molecular-editor/MoleculeImportModal';
import MoleculeSaveModal from '@/components/organisms/molecular-editor/MoleculeSaveModal';
import type { GalleryFeedback } from '@/components/organisms/molecular-editor/moleculeEditorSession';

type MoleculeEditorOverlaysProps = {
  feedback: GalleryFeedback | null;
  importModalProps: ComponentProps<typeof MoleculeImportModal>;
  pageMode: 'editor' | 'gallery';
  saveModalProps: ComponentProps<typeof MoleculeSaveModal>;
};

export default function MoleculeEditorOverlays({
  feedback,
  importModalProps,
  pageMode,
  saveModalProps,
}: MoleculeEditorOverlaysProps) {
  return (
    <>
      {pageMode === 'editor' ? <MoleculeImportModal {...importModalProps} /> : null}

      <MoleculeSaveModal {...saveModalProps} />

      <MoleculeEditorFeedbackToast feedback={feedback} pageMode={pageMode} />
    </>
  );
}
