'use client';

import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

type SavedMoleculesSnapshot = {
  token: string | null;
  data: SavedMolecule[];
  error: string | null;
};

type UseSavedMoleculesInput = {
  token: string | null;
  onTokenRefresh: (token: string) => void;
  onUnauthorized: () => void;
};

type UseSavedMoleculesOutput = {
  data: SavedMolecule[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  reload: () => void;
  createMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  updateMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
  deleteMolecule: (moleculeId: string) => Promise<void>;
};

export type { SavedMoleculesSnapshot, UseSavedMoleculesInput, UseSavedMoleculesOutput };
