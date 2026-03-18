'use client';

import { memo, useCallback, useMemo } from 'react';

import MarkdownContent from '@/components/atoms/MarkdownContent';
import MoleculeGalleryPreview from '@/components/molecules/chemistry/MoleculeGalleryPreview';
import { formatSavedAtLabel } from '@/components/molecules/chemistry/moleculeGalleryUtils';
import {
  formatMolecularEditorComponentCount,
  formatMolecularEditorPreviewLabel,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import useAppLocale from '@/shared/i18n/useAppLocale';
import type { SavedMolecule } from '@/shared/types/molecule';

type MoleculeGalleryCardProps = {
  savedMolecule: SavedMolecule;
  isActive: boolean;
  onLoad: (savedMolecule: SavedMolecule) => void;
};

const MoleculeGalleryCard = memo(function MoleculeGalleryCard({
  savedMolecule,
  isActive,
  onLoad,
}: MoleculeGalleryCardProps) {
  const text = useMolecularEditorText();
  const { locale } = useAppLocale();
  const description = savedMolecule.educationalDescription;
  const title = savedMolecule.name ?? savedMolecule.summary.formula;
  const nomenclature = savedMolecule.summary.systematicName;
  const componentCount = savedMolecule.summary.componentCount ?? 1;
  const savedAtLabel = useMemo(
    () => formatSavedAtLabel(text, locale, savedMolecule.updatedAt),
    [locale, savedMolecule.updatedAt, text],
  );
  const onActivateCard = useCallback(() => {
    onLoad(savedMolecule);
  }, [onLoad, savedMolecule]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivateCard}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        onActivateCard();
      }}
      className={`group relative overflow-hidden rounded-[1.6rem] border p-3 text-left transition-all ${
        isActive
          ? 'border-(--accent) bg-(--accent)/10 shadow-[0_18px_40px_-28px_color-mix(in_oklab,var(--accent)_55%,transparent)]'
          : 'border-(--border-subtle) bg-(--surface-overlay-soft) hover:border-(--accent) hover:bg-(--surface-overlay-mid)'
      }`}
      aria-pressed={isActive}
    >
      <MoleculeGalleryPreview
        model={savedMolecule.molecule}
        label={formatMolecularEditorPreviewLabel(text, title)}
      />

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-foreground">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
              {savedMolecule.summary.formula}
            </p>
            {componentCount > 1 ? (
              <span className="rounded-full border border-(--border-subtle) bg-(--surface-overlay-faint) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                {formatMolecularEditorComponentCount(text, componentCount)}
              </span>
            ) : null}
          </div>
          {nomenclature !== null && nomenclature !== undefined ? (
            <p
              className="mt-1 text-xs font-medium leading-relaxed text-(--text-muted)"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                {text.gallery.nomenclature}
              </span>
              {nomenclature}
            </p>
          ) : null}
        </div>
        {isActive ? (
          <span className="shrink-0 rounded-full border border-(--accent) bg-(--accent)/16 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground">
            {text.gallery.active}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-(--surface-overlay-faint) px-2 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-(--text-muted)">{text.gallery.atoms}</p>
          <p className="mt-1 text-sm font-black text-foreground">{savedMolecule.summary.atomCount}</p>
        </div>
        <div className="rounded-2xl bg-(--surface-overlay-faint) px-2 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-(--text-muted)">{text.gallery.bonds}</p>
          <p className="mt-1 text-sm font-black text-foreground">{savedMolecule.summary.bondCount}</p>
        </div>
        <div className="rounded-2xl bg-(--surface-overlay-faint) px-2 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-(--text-muted)">{text.gallery.saved}</p>
          <p className="mt-1 text-[11px] font-semibold text-foreground">{savedAtLabel}</p>
        </div>
      </div>

      {description !== null && description.trim().length > 0 ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-2xl border border-white/12 bg-slate-950/88 px-3 py-3 shadow-2xl backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {text.gallery.description}
            </p>
            <MarkdownContent
              content={description}
              tone="inverted"
              compact
              className="mt-2 text-sm text-white/92"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default MoleculeGalleryCard;
