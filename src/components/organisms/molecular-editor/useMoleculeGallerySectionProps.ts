'use client';

import { useMemo } from 'react';
import type { ComponentProps } from 'react';

import type MoleculeGallerySection from '@/components/organisms/molecular-editor/MoleculeGallerySection';
import type { SavedMolecule } from '@/shared/types/molecule';

type MoleculeGallerySectionProps = ComponentProps<typeof MoleculeGallerySection>;

type UseMoleculeGallerySectionPropsOptions = {
  activeSavedMoleculeId: string | null;
  galleryFeedback: MoleculeGallerySectionProps['galleryFeedback'];
  isSavedMoleculesLoading: boolean;
  isSavedMoleculesMutating: boolean;
  onDeleteCurrentSavedMoleculeFromGallery: () => void;
  onLoadSavedMolecule: (savedMolecule: SavedMolecule) => void;
  onOpenCurrentSavedMoleculeInEditor: () => void;
  onOpenGalleryEditModal: () => void;
  onReloadSavedMolecules: () => void;
  savedMolecules: SavedMolecule[];
  savedMoleculesError: string | null;
};

export default function useMoleculeGallerySectionProps({
  activeSavedMoleculeId,
  galleryFeedback,
  isSavedMoleculesLoading,
  isSavedMoleculesMutating,
  onDeleteCurrentSavedMoleculeFromGallery,
  onLoadSavedMolecule,
  onOpenCurrentSavedMoleculeInEditor,
  onOpenGalleryEditModal,
  onReloadSavedMolecules,
  savedMolecules,
  savedMoleculesError,
}: UseMoleculeGallerySectionPropsOptions): MoleculeGallerySectionProps {
  return useMemo(
    () => ({
      savedMolecules,
      activeSavedMoleculeId,
      galleryFeedback,
      savedMoleculesError,
      isSavedMoleculesLoading,
      isSavedMoleculesMutating,
      onOpenGalleryEditModal,
      onOpenCurrentSavedMoleculeInEditor,
      onDeleteCurrentSavedMoleculeFromGallery,
      onReloadSavedMolecules,
      onLoadSavedMolecule,
    }),
    [
      activeSavedMoleculeId,
      galleryFeedback,
      isSavedMoleculesLoading,
      isSavedMoleculesMutating,
      onDeleteCurrentSavedMoleculeFromGallery,
      onLoadSavedMolecule,
      onOpenCurrentSavedMoleculeInEditor,
      onOpenGalleryEditModal,
      onReloadSavedMolecules,
      savedMolecules,
      savedMoleculesError,
    ],
  );
}
