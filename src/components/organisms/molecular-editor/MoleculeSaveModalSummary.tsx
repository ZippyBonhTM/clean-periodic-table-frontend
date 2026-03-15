'use client';

type MoleculeSaveModalSummaryProps = {
  atomCount: number;
  bondCount: number;
  componentCount: number;
  context: 'editor' | 'gallery';
  currentSaveLabel: string;
  focusedComponentLabel: string | null;
  formula: string;
  nomenclature: string;
};

export default function MoleculeSaveModalSummary({
  atomCount,
  bondCount,
  componentCount,
  context,
  currentSaveLabel,
  focusedComponentLabel,
  formula,
  nomenclature,
}: MoleculeSaveModalSummaryProps) {
  const isGalleryContext = context === 'gallery';

  return (
    <aside className="rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-soft) p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
        {isGalleryContext ? 'Saved Record' : 'Current Canvas'}
      </p>
      <h3 className="mt-1 text-lg font-black text-foreground">{currentSaveLabel}</h3>

      <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
        {componentCount > 1 ? (
          <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5 sm:col-span-2 lg:col-span-1">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Component Focus</dt>
            <dd className="mt-1 break-words text-sm font-black text-foreground">
              {focusedComponentLabel ?? `Mol 1 / ${componentCount}`}
            </dd>
          </div>
        ) : null}
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5 sm:col-span-2 lg:col-span-1">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Nomenclature</dt>
          <dd className="mt-1 break-words text-sm font-black text-foreground">{nomenclature}</dd>
        </div>
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Formula</dt>
          <dd className="mt-1 break-words text-sm font-black text-foreground">{formula}</dd>
        </div>
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Atoms</dt>
          <dd className="mt-1 text-sm font-black text-foreground">{atomCount}</dd>
        </div>
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Bonds</dt>
          <dd className="mt-1 text-sm font-black text-foreground">{bondCount}</dd>
        </div>
        {componentCount > 1 ? (
          <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Components</dt>
            <dd className="mt-1 text-sm font-black text-foreground">{componentCount}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-subtle) px-3 py-3 text-sm leading-relaxed text-(--text-muted)">
        {atomCount === 0
          ? 'Add atoms before sending a save request to the gallery.'
          : isGalleryContext
            ? 'Update Selected writes the edited metadata back to the chosen gallery item.'
            : 'Use Save As New to create a fresh gallery item, or Update Selected to overwrite the linked one.'}
      </div>
    </aside>
  );
}
