'use client';

import { memo } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import MoleculeSaveModalForm from '@/components/organisms/molecular-editor/MoleculeSaveModalForm';
import MoleculeSaveModalSummary from '@/components/organisms/molecular-editor/MoleculeSaveModalSummary';

type MoleculeSaveModalProps = {
  context: 'editor' | 'gallery';
  isOpen: boolean;
  hasLinkedSelection: boolean;
  currentSaveLabel: string;
  moleculeTitle: string;
  educationalDescription: string;
  formula: string;
  nomenclature: string;
  atomCount: number;
  bondCount: number;
  componentCount: number;
  focusedComponentLabel: string | null;
  isMutating: boolean;
  onClose: () => void;
  onMoleculeTitleChange: (value: string) => void;
  onEducationalDescriptionChange: (value: string) => void;
  onSaveAsNew: () => void;
  onUpdateSelected: () => void;
  onDetachSelection: () => void;
  onDeleteSelected: () => void;
};

function MoleculeSaveModal({
  context,
  isOpen,
  hasLinkedSelection,
  currentSaveLabel,
  moleculeTitle,
  educationalDescription,
  formula,
  nomenclature,
  atomCount,
  bondCount,
  componentCount,
  focusedComponentLabel,
  isMutating,
  onClose,
  onMoleculeTitleChange,
  onEducationalDescriptionChange,
  onSaveAsNew,
  onUpdateSelected,
  onDetachSelection,
  onDeleteSelected,
}: MoleculeSaveModalProps) {
  const isGalleryContext = context === 'gallery';
  const modalTitle = hasLinkedSelection
    ? currentSaveLabel
    : isGalleryContext
      ? 'Edit Gallery Record'
      : 'Save Molecule to Gallery';

  return (
    <FloatingModal
      isOpen={isOpen}
      title={modalTitle}
      onClose={onClose}
      panelClassName="max-w-3xl self-start mt-1 sm:mt-3"
      bodyClassName="pr-1 pb-1"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <MoleculeSaveModalForm
          atomCount={atomCount}
          context={context}
          educationalDescription={educationalDescription}
          hasLinkedSelection={hasLinkedSelection}
          isMutating={isMutating}
          moleculeTitle={moleculeTitle}
          onDeleteSelected={onDeleteSelected}
          onDetachSelection={onDetachSelection}
          onEducationalDescriptionChange={onEducationalDescriptionChange}
          onMoleculeTitleChange={onMoleculeTitleChange}
          onSaveAsNew={onSaveAsNew}
          onUpdateSelected={onUpdateSelected}
        />

        <MoleculeSaveModalSummary
          atomCount={atomCount}
          bondCount={bondCount}
          componentCount={componentCount}
          context={context}
          currentSaveLabel={currentSaveLabel}
          focusedComponentLabel={focusedComponentLabel}
          formula={formula}
          nomenclature={nomenclature}
        />
      </div>
    </FloatingModal>
  );
}

export default memo(MoleculeSaveModal);
