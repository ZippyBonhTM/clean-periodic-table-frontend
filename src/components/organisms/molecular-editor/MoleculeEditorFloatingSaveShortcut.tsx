'use client';

import type { CSSProperties } from 'react';

import { SaveGalleryIcon } from '@/components/organisms/molecular-editor/moleculeEditorToolRailIcons';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

type MoleculeEditorFloatingSaveShortcutProps = {
  floatingSaveShortcutInnerStyle: CSSProperties;
  floatingSaveShortcutPanelStyle: CSSProperties;
  floatingSaveShortcutTriggerStyle: CSSProperties;
  isExpanded: boolean;
  isLandscapeCompactCanvas: boolean;
  isSaveModalOpen: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onOpenSaveModal: () => void;
  shouldShow: boolean;
  summaryAtomCount: number;
  toolRailStyle: CSSProperties;
};

export default function MoleculeEditorFloatingSaveShortcut({
  floatingSaveShortcutInnerStyle,
  floatingSaveShortcutPanelStyle,
  floatingSaveShortcutTriggerStyle,
  isExpanded,
  isLandscapeCompactCanvas,
  isSaveModalOpen,
  onExpandedChange,
  onOpenSaveModal,
  shouldShow,
  summaryAtomCount,
  toolRailStyle,
}: MoleculeEditorFloatingSaveShortcutProps) {
  const text = useMolecularEditorText();

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      style={toolRailStyle}
      className="absolute left-3 z-20"
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      <button
        type="button"
        onClick={onOpenSaveModal}
        onFocus={() => onExpandedChange(true)}
        onBlur={() => onExpandedChange(false)}
        disabled={summaryAtomCount === 0}
        title={text.toolRail.saveDialog}
        aria-label={text.toolRail.saveAsNew}
        style={floatingSaveShortcutPanelStyle}
        className={`flex overflow-hidden border shadow-xl backdrop-blur-xl origin-left transition-[width,border-color,color,background-color] duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
          isSaveModalOpen
            ? 'border-(--accent) bg-(--accent)/24 text-foreground'
            : 'border-(--border-subtle) bg-(--surface-overlay-rail) text-(--text-muted) hover:border-(--accent) hover:text-foreground'
        } ${isLandscapeCompactCanvas ? 'h-10 rounded-2xl' : 'h-12 rounded-2xl'}`}
      >
        <div style={floatingSaveShortcutInnerStyle} className="flex h-full flex-nowrap items-stretch">
          <div style={floatingSaveShortcutTriggerStyle} className="flex h-full shrink-0 items-center justify-center">
            <span className="shrink-0">
              <SaveGalleryIcon />
            </span>
          </div>
          <div
            className={`flex min-w-0 flex-1 items-center overflow-hidden pr-3 transition-opacity duration-150 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!isExpanded}
          >
            <span className={`truncate font-semibold text-foreground ${isLandscapeCompactCanvas ? 'text-[10px]' : 'text-[11px]'}`}>
              {text.toolRail.saveAsNew}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
