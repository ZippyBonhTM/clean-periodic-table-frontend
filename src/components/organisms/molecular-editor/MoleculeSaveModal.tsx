'use client';

import { memo } from 'react';

import Button from '@/components/atoms/Button';
import FloatingModal from '@/components/molecules/FloatingModal';

type MoleculeSaveModalProps = {
  context: 'editor' | 'gallery';
  isOpen: boolean;
  hasLinkedSelection: boolean;
  currentSaveLabel: string;
  moleculeTitle: string;
  educationalDescription: string;
  formula: string;
  nomenclature: string;
  atomCount: number;
  bondCount: number;
  componentCount: number;
  focusedComponentLabel: string | null;
  isMutating: boolean;
  onClose: () => void;
  onMoleculeTitleChange: (value: string) => void;
  onEducationalDescriptionChange: (value: string) => void;
  onSaveAsNew: () => void;
  onUpdateSelected: () => void;
  onDetachSelection: () => void;
  onDeleteSelected: () => void;
};

function MoleculeSaveModal({
  context,
  isOpen,
  hasLinkedSelection,
  currentSaveLabel,
  moleculeTitle,
  educationalDescription,
  formula,
  nomenclature,
  atomCount,
  bondCount,
  componentCount,
  focusedComponentLabel,
  isMutating,
  onClose,
  onMoleculeTitleChange,
  onEducationalDescriptionChange,
  onSaveAsNew,
  onUpdateSelected,
  onDetachSelection,
  onDeleteSelected,
}: MoleculeSaveModalProps) {
  const isGalleryContext = context === 'gallery';
  const modalTitle = hasLinkedSelection
    ? currentSaveLabel
    : isGalleryContext
      ? 'Edit Gallery Record'
      : 'Save Molecule to Gallery';

  return (
    <FloatingModal
      isOpen={isOpen}
      title={modalTitle}
      onClose={onClose}
      panelClassName="max-w-3xl self-start mt-1 sm:mt-3"
      bodyClassName="pr-1 pb-1"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                {isGalleryContext ? 'Gallery Record' : 'Gallery Save'}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-(--text-muted)">
                {isGalleryContext
                  ? 'Edit the title and educational description of the selected gallery item.'
                  : 'Save the current canvas as a new card, or update the linked gallery item when needed.'}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                hasLinkedSelection
                  ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-200'
                  : 'border-(--border-subtle) bg-(--surface-overlay-soft) text-(--text-muted)'
              }`}
            >
              {hasLinkedSelection ? 'Linked record' : 'New draft'}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="molecule-save-modal-name"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
              >
                Title
              </label>
              <input
                id="molecule-save-modal-name"
                name="molecule-save-modal-name"
                type="text"
                value={moleculeTitle}
                onChange={(event) => onMoleculeTitleChange(event.target.value)}
                placeholder="Benzeno"
                className="w-full rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="molecule-save-modal-description"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
              >
                Educational Description
              </label>
              <p className="text-xs leading-relaxed text-(--text-muted)">
                Markdown supported. Example: `**bold**`, lists, links, and inline code.
              </p>
              <textarea
                id="molecule-save-modal-description"
                name="molecule-save-modal-description"
                value={educationalDescription}
                onChange={(event) => onEducationalDescriptionChange(event.target.value)}
                placeholder="Explain why this molecule matters, where it appears, or what concept it teaches."
                rows={6}
                className="w-full resize-none rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!hasLinkedSelection || atomCount === 0 || isMutating}
              onClick={onUpdateSelected}
            >
              Update Selected
            </Button>
            {!isGalleryContext ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={atomCount === 0 || isMutating}
                  onClick={onSaveAsNew}
                >
                  Save As New
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!hasLinkedSelection}
                  onClick={onDetachSelection}
                >
                  New Draft
                </Button>
              </>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasLinkedSelection || isMutating}
              className="text-rose-200 hover:text-rose-100"
              onClick={onDeleteSelected}
            >
              Delete
            </Button>
          </div>
        </div>

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
      </div>
    </FloatingModal>
  );
}

export default memo(MoleculeSaveModal);
