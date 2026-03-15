'use client';

import type { SavedMoleculeEditorState } from '@/shared/types/molecule';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type MoleculeEditorViewModeTabsProps = {
  activeView: EditorViewMode;
  onSetActiveView: (mode: EditorViewMode) => void;
  viewModeButtonClassName: string;
  viewModeTabsClassName: string;
  viewOptions: Array<{ mode: EditorViewMode; label: string }>;
};

export default function MoleculeEditorViewModeTabs({
  activeView,
  onSetActiveView,
  viewModeButtonClassName,
  viewModeTabsClassName,
  viewOptions,
}: MoleculeEditorViewModeTabsProps) {
  return (
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
  );
}
