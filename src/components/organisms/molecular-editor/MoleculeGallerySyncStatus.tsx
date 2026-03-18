'use client';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

type GalleryFeedback = {
  tone: 'info' | 'success' | 'error';
  message: string;
};

type MoleculeGallerySyncStatusProps = {
  galleryFeedback: GalleryFeedback | null;
  onReloadSavedMolecules: () => void;
  savedMoleculesError: string | null;
};

export default function MoleculeGallerySyncStatus({
  galleryFeedback,
  onReloadSavedMolecules,
  savedMoleculesError,
}: MoleculeGallerySyncStatusProps) {
  const text = useMolecularEditorText();

  if (galleryFeedback === null && savedMoleculesError === null) {
    return null;
  }

  return (
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
        {galleryFeedback?.tone === 'success' ? text.gallery.savedStatus : text.gallery.syncStatus}
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
          {text.gallery.retrySync}
        </button>
      ) : null}
    </div>
  );
}
