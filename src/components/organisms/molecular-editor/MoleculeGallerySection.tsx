'use client';

import Button from '@/components/atoms/Button';
import MoleculeGalleryCard from '@/components/molecules/chemistry/MoleculeGalleryCard';
import MoleculeGallerySectionHeader from '@/components/organisms/molecular-editor/MoleculeGallerySectionHeader';
import MoleculeGallerySyncStatus from '@/components/organisms/molecular-editor/MoleculeGallerySyncStatus';
import type { SavedMolecule } from '@/shared/types/molecule';

type GalleryFeedback = {
  tone: 'info' | 'success' | 'error';
  message: string;
};

type MoleculeGallerySectionProps = {
  savedMolecules: SavedMolecule[];
  activeSavedMoleculeId: string | null;
  galleryFeedback: GalleryFeedback | null;
  savedMoleculesError: string | null;
  isSavedMoleculesLoading: boolean;
  isSavedMoleculesMutating: boolean;
  onOpenGalleryEditModal: () => void;
  onOpenCurrentSavedMoleculeInEditor: () => void;
  onDeleteCurrentSavedMoleculeFromGallery: () => void;
  onReloadSavedMolecules: () => void;
  onLoadSavedMolecule: (savedMolecule: SavedMolecule) => void;
};

export default function MoleculeGallerySection({
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
}: MoleculeGallerySectionProps) {
  const hasCurrentSavedSelection = activeSavedMoleculeId !== null;
  const galleryGridClassName =
    savedMolecules.length <= 1
      ? 'grid gap-3'
      : savedMolecules.length === 2
        ? 'grid gap-3 md:grid-cols-2'
        : 'grid gap-3 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="grid gap-3">
      <section className="surface-panel rounded-[1.75rem] border border-(--border-subtle) p-4 shadow-sm">
        <MoleculeGallerySectionHeader
          hasCurrentSavedSelection={hasCurrentSavedSelection}
          isSavedMoleculesMutating={isSavedMoleculesMutating}
          onDeleteCurrentSavedMoleculeFromGallery={onDeleteCurrentSavedMoleculeFromGallery}
          onOpenCurrentSavedMoleculeInEditor={onOpenCurrentSavedMoleculeInEditor}
          onOpenGalleryEditModal={onOpenGalleryEditModal}
          onReloadSavedMolecules={onReloadSavedMolecules}
          savedCount={savedMolecules.length}
        />

        <MoleculeGallerySyncStatus
          galleryFeedback={galleryFeedback}
          onReloadSavedMolecules={onReloadSavedMolecules}
          savedMoleculesError={savedMoleculesError}
        />

        {isSavedMoleculesLoading ? (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-8 text-center text-sm text-(--text-muted)">
            Loading your saved molecules...
          </div>
        ) : savedMoleculesError !== null ? (
          <div className="mt-4 rounded-[1.5rem] border border-rose-400/30 bg-rose-500/10 px-4 py-5 text-sm text-rose-100">
            <p>{savedMoleculesError}</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={onReloadSavedMolecules}>
              Try Again
            </Button>
          </div>
        ) : savedMolecules.length === 0 ? (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">Your gallery is empty.</p>
            <p className="mt-2 text-sm text-(--text-muted)">
              Save molecules from the editor to build this stick-view library.
            </p>
          </div>
        ) : (
          <div className={`mt-4 ${galleryGridClassName}`}>
            {savedMolecules.map((savedMolecule) => {
              return (
                <MoleculeGalleryCard
                  key={savedMolecule.id}
                  savedMolecule={savedMolecule}
                  isActive={savedMolecule.id === activeSavedMoleculeId}
                  onLoad={onLoadSavedMolecule}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
