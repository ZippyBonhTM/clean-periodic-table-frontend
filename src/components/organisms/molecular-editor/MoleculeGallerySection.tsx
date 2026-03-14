'use client';


import Button from '@/components/atoms/Button';
import MoleculeGalleryCard from '@/components/molecules/chemistry/MoleculeGalleryCard';
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
              Molecule Gallery
            </p>
            <h2 className="mt-1 text-lg font-black text-foreground">Stick View Library</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-(--border-subtle) bg-(--surface-overlay-soft) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
              {savedMolecules.length} saved
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasCurrentSavedSelection}
              onClick={onOpenGalleryEditModal}
            >
              Edit Details
            </Button>
            <Button
              variant={hasCurrentSavedSelection ? 'primary' : 'secondary'}
              size="sm"
              disabled={!hasCurrentSavedSelection}
              onClick={onOpenCurrentSavedMoleculeInEditor}
            >
              Open in Editor
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasCurrentSavedSelection || isSavedMoleculesMutating}
              onClick={onDeleteCurrentSavedMoleculeFromGallery}
              className="border-rose-500/45 bg-rose-500/8 text-rose-200 hover:border-rose-400 hover:bg-rose-500/14 hover:text-rose-100"
            >
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={onReloadSavedMolecules}>
              Refresh
            </Button>
          </div>
        </div>

        {galleryFeedback !== null || savedMoleculesError !== null ? (
          <div
            className={`mt-4 rounded-[1.35rem] border px-4 py-3 ${
              galleryFeedback?.tone === 'error' || savedMoleculesError !== null
                ? 'border-rose-400/35 bg-rose-500/10'
                : galleryFeedback?.tone === 'success'
                  ? 'border-emerald-400/35 bg-emerald-500/10'
                  : 'border-(--border-subtle) bg-(--surface-overlay-subtle)'
            }`}
          >
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                galleryFeedback?.tone === 'error' || savedMoleculesError !== null
                  ? 'text-rose-200'
                  : galleryFeedback?.tone === 'success'
                    ? 'text-emerald-200'
                    : 'text-(--text-muted)'
              }`}
            >
              {galleryFeedback?.tone === 'success' ? 'Saved' : 'Sync Status'}
            </p>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                galleryFeedback?.tone === 'error' || savedMoleculesError !== null
                  ? 'text-rose-100'
                  : galleryFeedback?.tone === 'success'
                    ? 'text-emerald-100'
                    : 'text-(--text-muted)'
              }`}
            >
              {savedMoleculesError ?? galleryFeedback?.message}
            </p>
            {savedMoleculesError !== null ? (
              <button
                type="button"
                onClick={onReloadSavedMolecules}
                className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-(--accent) transition-colors hover:text-foreground"
              >
                Retry gallery sync
              </button>
            ) : null}
          </div>
        ) : null}

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
