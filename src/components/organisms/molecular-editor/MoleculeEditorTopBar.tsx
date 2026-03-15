'use client';

import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import MoleculeEditorViewModeTabs from '@/components/organisms/molecular-editor/MoleculeEditorViewModeTabs';
import MoleculeEditorZoomControls from '@/components/organisms/molecular-editor/MoleculeEditorZoomControls';

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
        <MoleculeEditorViewModeTabs
          activeView={activeView}
          onSetActiveView={onSetActiveView}
          viewModeButtonClassName={viewModeButtonClassName}
          viewModeTabsClassName={viewModeTabsClassName}
          viewOptions={viewOptions}
        />

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

      <MoleculeEditorZoomControls
        isLandscapeCompactCanvas={isLandscapeCompactCanvas}
        isSimplifiedView={isSimplifiedView}
        onResetCanvasView={onResetCanvasView}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        responsiveLayoutWidth={responsiveLayoutWidth}
        zoomControlsClassName={zoomControlsClassName}
        zoomControlsVisibilityClassName={zoomControlsVisibilityClassName}
        zoomPercent={zoomPercent}
      />
    </div>
  );
}
