'use client';

import Button from '@/components/atoms/Button';

type MoleculeSaveModalFormProps = {
  atomCount: number;
  context: 'editor' | 'gallery';
  educationalDescription: string;
  hasLinkedSelection: boolean;
  isMutating: boolean;
  moleculeTitle: string;
  onDeleteSelected: () => void;
  onDetachSelection: () => void;
  onEducationalDescriptionChange: (value: string) => void;
  onMoleculeTitleChange: (value: string) => void;
  onSaveAsNew: () => void;
  onUpdateSelected: () => void;
};

export default function MoleculeSaveModalForm({
  atomCount,
  context,
  educationalDescription,
  hasLinkedSelection,
  isMutating,
  moleculeTitle,
  onDeleteSelected,
  onDetachSelection,
  onEducationalDescriptionChange,
  onMoleculeTitleChange,
  onSaveAsNew,
  onUpdateSelected,
}: MoleculeSaveModalFormProps) {
  const isGalleryContext = context === 'gallery';

  return (
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
            <Button variant="secondary" size="sm" disabled={atomCount === 0 || isMutating} onClick={onSaveAsNew}>
              Save As New
            </Button>
            <Button variant="ghost" size="sm" disabled={!hasLinkedSelection} onClick={onDetachSelection}>
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
  );
}
