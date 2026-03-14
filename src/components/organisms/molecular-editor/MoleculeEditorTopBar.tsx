'use client';

import type { SavedMoleculeEditorState } from '@/shared/types/molecule';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type MoleculeEditorTopBarProps = {
  activeView: EditorViewMode;
  importButtonClassName: string;
  isLandscapeCompactCanvas: boolean;
  isSimplifiedView: boolean;
  onOpenImportModal: () => void;
  onResetCanvasView: () => void;
  onSetActiveView: (mode: EditorViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  responsiveLayoutWidth: number;
  viewModeButtonClassName: string;
  viewModeTabsClassName: string;
  viewOptions: Array<{ mode: EditorViewMode; label: string }>;
  zoomControlsClassName: string;
  zoomControlsVisibilityClassName: string;
  zoomPercent: number;
  topControlsLeadingGroupClassName: string;
  topControlsRowClassName: string;
};

function ImportMoleculeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 12.5v-9h5.5l3.5 3.4v5.6z" />
      <path d="M9 3.5v3.4h3.5" />
      <path d="M5.2 9h5.6" />
      <path d="m8 6.2 2.1 2.1L8 10.4" />
    </svg>
  );
}

export default function MoleculeEditorTopBar({
  activeView,
  importButtonClassName,
  isLandscapeCompactCanvas,
  isSimplifiedView,
  onOpenImportModal,
  onResetCanvasView,
  onSetActiveView,
  onZoomIn,
  onZoomOut,
  responsiveLayoutWidth,
  topControlsLeadingGroupClassName,
  topControlsRowClassName,
  viewModeButtonClassName,
  viewModeTabsClassName,
  viewOptions,
  zoomControlsClassName,
  zoomControlsVisibilityClassName,
  zoomPercent,
}: MoleculeEditorTopBarProps) {
  return (
    <div className={topControlsRowClassName}>
      <div className={topControlsLeadingGroupClassName}>
        <div className={viewModeTabsClassName}>
          {viewOptions.map((option, index) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => onSetActiveView(option.mode)}
              className={`${viewModeButtonClassName} ${
                activeView === option.mode
                  ? 'border border-(--accent) bg-(--accent)/22 text-foreground'
                  : 'border border-transparent text-(--text-muted) hover:border-(--accent) hover:text-foreground'
              }`}
              aria-label={option.label}
              title={option.label}
            >
              <span className="sm:hidden">{index + 1}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenImportModal}
          className={importButtonClassName}
          aria-label="Import another molecule"
          title="Import another molecule from PubChem"
        >
          <ImportMoleculeIcon />
          <span className="hidden sm:inline">Import Other</span>
        </button>
      </div>

      <div
        className={`${zoomControlsClassName} ${zoomControlsVisibilityClassName}`}
        aria-hidden={isSimplifiedView}
      >
        <button
          type="button"
          onClick={onZoomOut}
          className={`inline-flex items-center justify-center rounded-lg px-1 font-black text-foreground transition-colors hover:border-(--accent) hover:text-foreground ${
            isLandscapeCompactCanvas
              ? 'h-6 min-w-6 text-[13px]'
              : responsiveLayoutWidth < 430
                ? 'h-6 min-w-5.5 text-[12px]'
                : 'h-7 min-w-7 text-sm'
          }`}
          aria-label="Zoom out"
          title="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onClick={onResetCanvasView}
          className={`inline-flex items-center justify-center rounded-lg px-1 font-semibold text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground ${
            isLandscapeCompactCanvas
              ? 'h-6 min-w-8 text-[9px]'
              : responsiveLayoutWidth < 430
                ? 'h-6 min-w-8 text-[8px]'
                : 'h-7 min-w-10 text-[10px]'
          }`}
          aria-label="Reset zoom"
          title="Reset zoom"
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className={`inline-flex items-center justify-center rounded-lg px-1 font-black text-foreground transition-colors hover:border-(--accent) hover:text-foreground ${
            isLandscapeCompactCanvas
              ? 'h-6 min-w-6 text-[13px]'
              : responsiveLayoutWidth < 430
                ? 'h-6 min-w-5.5 text-[12px]'
                : 'h-7 min-w-7 text-sm'
          }`}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        {isLandscapeCompactCanvas ? null : (
          <button
            type="button"
            onClick={onResetCanvasView}
            className={`inline-flex items-center justify-center rounded-lg px-1 font-semibold uppercase text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground ${
              responsiveLayoutWidth < 430 ? 'h-6 text-[8px]' : 'h-7 text-[10px]'
            }`}
          >
            FIT
          </button>
        )}
      </div>
    </div>
  );
}
