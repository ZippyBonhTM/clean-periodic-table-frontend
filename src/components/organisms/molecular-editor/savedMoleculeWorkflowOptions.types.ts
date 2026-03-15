'use client';

import type { SavedEditorDraft } from '@/components/organisms/molecular-editor/moleculeEditorSession';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

export type SavedMoleculePageMode = 'editor' | 'gallery';

export type SavedMoleculeMetadataSetters = {
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  setMoleculeEducationalDescription: (value: string) => void;
  setMoleculeName: (value: string) => void;
};

export type SavedMoleculeMutationHandlers = {
  onCreateSavedMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  onDeleteSavedMolecule: (moleculeId: string) => Promise<void>;
  onUpdateSavedMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
};

export type SavedMoleculeUpsertHandlers = Pick<
  SavedMoleculeMutationHandlers,
  'onCreateSavedMolecule' | 'onUpdateSavedMolecule'
>;

export type SavedMoleculeDeleteHandler = Pick<SavedMoleculeMutationHandlers, 'onDeleteSavedMolecule'>;

export type SavedMoleculeEditorBridgeOptions = SavedMoleculeMetadataSetters & {
  applyEditorSnapshot: (snapshot: SavedEditorDraft, notice: string) => void;
  clearHistory: () => void;
  setNomenclatureFallback: (value: string | null) => void;
};

export type SavedMoleculeMutationState = SavedMoleculeMetadataSetters & {
  buildSaveMoleculeInput: () => SaveMoleculeInput;
  resolvedActiveSavedMoleculeId: string | null;
  setIsSaveModalOpen: (isOpen: boolean) => void;
  summaryAtomCount: number;
};
