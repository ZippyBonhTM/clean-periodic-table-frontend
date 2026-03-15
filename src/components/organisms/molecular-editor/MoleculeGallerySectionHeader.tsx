'use client';

import Button from '@/components/atoms/Button';

type MoleculeGallerySectionHeaderProps = {
  hasCurrentSavedSelection: boolean;
  isSavedMoleculesMutating: boolean;
  onDeleteCurrentSavedMoleculeFromGallery: () => void;
  onOpenCurrentSavedMoleculeInEditor: () => void;
  onOpenGalleryEditModal: () => void;
  onReloadSavedMolecules: () => void;
  savedCount: number;
};

export default function MoleculeGallerySectionHeader({
  hasCurrentSavedSelection,
  isSavedMoleculesMutating,
  onDeleteCurrentSavedMoleculeFromGallery,
  onOpenCurrentSavedMoleculeInEditor,
  onOpenGalleryEditModal,
  onReloadSavedMolecules,
  savedCount,
}: MoleculeGallerySectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
          Molecule Gallery
        </p>
        <h2 className="mt-1 text-lg font-black text-foreground">Stick View Library</h2>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-(--border-subtle) bg-(--surface-overlay-soft) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
          {savedCount} saved
        </span>
        <Button variant="secondary" size="sm" disabled={!hasCurrentSavedSelection} onClick={onOpenGalleryEditModal}>
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
  );
}
