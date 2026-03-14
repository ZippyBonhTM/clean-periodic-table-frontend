'use client';

import { memo, useCallback, useMemo, useRef } from 'react';

import Button from '@/components/atoms/Button';
import MarkdownContent from '@/components/atoms/MarkdownContent';
import EditorCanvas from '@/components/organisms/molecular-editor/MoleculeEditorCanvas';
import { resolveViewBox } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type { SavedMolecule } from '@/shared/types/molecule';
import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

type GalleryFeedback = {
  tone: 'info' | 'success' | 'error';
  message: string;
};

const SAVED_AT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatSavedAtLabel(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown sync time';
  }

  return SAVED_AT_FORMATTER.format(parsed);
}

function stripMarkdownForPreview(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const MoleculeGalleryPreview = memo(function MoleculeGalleryPreview({
  model,
  label,
}: {
  model: MoleculeModel;
  label: string;
}) {
  const previewSvgRef = useRef<SVGSVGElement | null>(null);
  const previewViewBox = useMemo(() => {
    const base = resolveViewBox(model);

    return {
      x: base.x - 20,
      y: base.y - 20,
      width: base.width + 40,
      height: base.height + 40,
    };
  }, [model]);

  return (
    <div className="relative h-32 overflow-hidden rounded-[1.35rem] border border-(--border-subtle) bg-(--surface-overlay-soft)">
      <EditorCanvas
        model={model}
        mode="stick"
        viewBox={previewViewBox}
        selectedAtomId={null}
        svgRef={previewSvgRef}
        interactive={false}
        showGrid={false}
        ariaLabel={label}
      />
    </div>
  );
});

const MoleculeGalleryCard = memo(function MoleculeGalleryCard({
  savedMolecule,
  isActive,
  onLoad,
}: {
  savedMolecule: SavedMolecule;
  isActive: boolean;
  onLoad: (savedMolecule: SavedMolecule) => void;
}) {
  const description = savedMolecule.educationalDescription;
  const compactDescription = useMemo(
    () => (description === null ? null : stripMarkdownForPreview(description)),
    [description],
  );
  const title = savedMolecule.name ?? savedMolecule.summary.formula;
  const nomenclature = savedMolecule.summary.systematicName;
  const savedAtLabel = useMemo(() => formatSavedAtLabel(savedMolecule.updatedAt), [savedMolecule.updatedAt]);
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
        label={`Stick view preview of ${title}`}
      />

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-foreground">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
              {savedMolecule.summary.formula}
            </p>
            {(savedMolecule.summary.componentCount ?? 1) > 1 ? (
              <span className="rounded-full border border-(--border-subtle) bg-(--surface-overlay-faint) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                {savedMolecule.summary.componentCount} comps
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
                Nomenclature
              </span>
              {nomenclature}
            </p>
          ) : null}
        </div>
        {isActive ? (
          <span className="shrink-0 rounded-full border border-(--accent) bg-(--accent)/16 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground">
            Active
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-(--surface-overlay-faint) px-2 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-(--text-muted)">Atoms</p>
          <p className="mt-1 text-sm font-black text-foreground">{savedMolecule.summary.atomCount}</p>
        </div>
        <div className="rounded-2xl bg-(--surface-overlay-faint) px-2 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-(--text-muted)">Bonds</p>
          <p className="mt-1 text-sm font-black text-foreground">{savedMolecule.summary.bondCount}</p>
        </div>
        <div className="rounded-2xl bg-(--surface-overlay-faint) px-2 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-(--text-muted)">Saved</p>
          <p className="mt-1 text-[11px] font-semibold text-foreground">{savedAtLabel}</p>
        </div>
      </div>

      {description !== null && description.trim().length > 0 ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-2xl border border-white/12 bg-slate-950/88 px-3 py-3 shadow-2xl backdrop-blur-md">
            {compactDescription !== null ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                {compactDescription}
              </p>
            ) : null}
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
