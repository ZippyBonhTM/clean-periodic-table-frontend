'use client';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

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
  const text = useMolecularEditorText();

  return (
    <aside className="rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-soft) p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
        {isGalleryContext ? text.saveModal.savedRecord : text.saveModal.currentCanvas}
      </p>
      <h3 className="mt-1 text-lg font-black text-foreground">{currentSaveLabel}</h3>

      <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
        {componentCount > 1 ? (
          <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5 sm:col-span-2 lg:col-span-1">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.saveModal.componentFocus}</dt>
            <dd className="mt-1 break-words text-sm font-black text-foreground">
              {focusedComponentLabel ?? `Mol 1 / ${componentCount}`}
            </dd>
          </div>
        ) : null}
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5 sm:col-span-2 lg:col-span-1">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.saveModal.nomenclature}</dt>
          <dd className="mt-1 break-words text-sm font-black text-foreground">{nomenclature}</dd>
        </div>
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.saveModal.formula}</dt>
          <dd className="mt-1 break-words text-sm font-black text-foreground">{formula}</dd>
        </div>
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.saveModal.atoms}</dt>
          <dd className="mt-1 text-sm font-black text-foreground">{atomCount}</dd>
        </div>
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.saveModal.bonds}</dt>
          <dd className="mt-1 text-sm font-black text-foreground">{bondCount}</dd>
        </div>
        {componentCount > 1 ? (
          <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.saveModal.components}</dt>
            <dd className="mt-1 text-sm font-black text-foreground">{componentCount}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-subtle) px-3 py-3 text-sm leading-relaxed text-(--text-muted)">
        {atomCount === 0
          ? text.saveModal.addAtomsBeforeSaving
          : isGalleryContext
            ? text.saveModal.updateHint
            : text.saveModal.saveHint}
      </div>
    </aside>
  );
}
