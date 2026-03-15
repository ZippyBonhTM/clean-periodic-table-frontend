'use client';

import type { CSSProperties } from 'react';

import MoleculeEditorBondOrderSection from '@/components/organisms/molecular-editor/MoleculeEditorBondOrderSection';
import MoleculeEditorFloatingSaveShortcut from '@/components/organisms/molecular-editor/MoleculeEditorFloatingSaveShortcut';
import MoleculeEditorToolRailButton from '@/components/organisms/molecular-editor/MoleculeEditorToolRailButton';
import {
  AddAtomIcon,
  ClearSelectionIcon,
  RailToggleIcon,
  RedoIcon,
  RemoveAtomIcon,
  ResetEditorIcon,
  SaveGalleryIcon,
  UndoIcon,
} from '@/components/organisms/molecular-editor/moleculeEditorToolRailIcons';
import type { BondOrder } from '@/shared/utils/moleculeEditor';

type MoleculeEditorToolRailProps = {
  activeElementMaxBondSlots: number | null;
  activeElementSymbol: string | null;
  bondOrder: BondOrder;
  bondOrderOptions: Array<{ order: BondOrder; label: string }>;
  canRedo: boolean;
  canUndo: boolean;
  collapsedToolRailSectionClassName: string;
  effectiveToolRailCollapsed: boolean;
  expandedToolRailSectionClassName: string;
  floatingSaveShortcutInnerStyle: CSSProperties;
  floatingSaveShortcutPanelStyle: CSSProperties;
  floatingSaveShortcutTriggerStyle: CSSProperties;
  isFloatingSaveShortcutExpanded: boolean;
  isLandscapeCompactCanvas: boolean;
  isSaveModalOpen: boolean;
  onAddSelectedElement: () => void;
  onClearSelection: () => void;
  onFloatingSaveShortcutExpandedChange: (expanded: boolean) => void;
  onOpenSaveModal: () => void;
  onRedo: () => void;
  onRemoveSelectedAtom: () => void;
  onResetMolecule: () => void;
  onSetBondOrder: (order: BondOrder) => void;
  onToggleCollapsed: () => void;
  onUndo: () => void;
  selectedAtomId: string | null;
  shouldShowFloatingSaveShortcut: boolean;
  shouldShowToolRail: boolean;
  showExpandedToolRailContent: boolean;
  summaryAtomCount: number;
  toolRailBodyClassName: string;
  toolRailCollapsedWidthClassName: string;
  toolRailExpandedWidthClassName: string;
  toolRailStyle: CSSProperties;
};

export default function MoleculeEditorToolRail({
  activeElementMaxBondSlots,
  activeElementSymbol,
  bondOrder,
  bondOrderOptions,
  canRedo,
  canUndo,
  collapsedToolRailSectionClassName,
  effectiveToolRailCollapsed,
  expandedToolRailSectionClassName,
  floatingSaveShortcutInnerStyle,
  floatingSaveShortcutPanelStyle,
  floatingSaveShortcutTriggerStyle,
  isFloatingSaveShortcutExpanded,
  isLandscapeCompactCanvas,
  isSaveModalOpen,
  onAddSelectedElement,
  onClearSelection,
  onFloatingSaveShortcutExpandedChange,
  onOpenSaveModal,
  onRedo,
  onRemoveSelectedAtom,
  onResetMolecule,
  onSetBondOrder,
  onToggleCollapsed,
  onUndo,
  selectedAtomId,
  shouldShowFloatingSaveShortcut,
  shouldShowToolRail,
  showExpandedToolRailContent,
  summaryAtomCount,
  toolRailBodyClassName,
  toolRailCollapsedWidthClassName,
  toolRailExpandedWidthClassName,
  toolRailStyle,
}: MoleculeEditorToolRailProps) {
  return (
    <>
      {shouldShowToolRail ? (
        <aside
          style={toolRailStyle}
          className={`absolute left-3 z-20 flex flex-col overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-rail) shadow-xl backdrop-blur-xl transition-opacity duration-200 ${
            effectiveToolRailCollapsed ? toolRailCollapsedWidthClassName : toolRailExpandedWidthClassName
          }`}
        >
          <div
            className={`flex min-h-12 items-center border-b border-(--border-subtle)/70 p-2 ${effectiveToolRailCollapsed ? 'justify-center' : 'justify-between gap-2'}`}
          >
            {showExpandedToolRailContent ? (
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                Tools
              </p>
            ) : null}
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground"
              aria-label={effectiveToolRailCollapsed ? 'Expand tool rail' : 'Collapse tool rail'}
              title={effectiveToolRailCollapsed ? 'Expand tool rail' : 'Collapse tool rail'}
            >
              <RailToggleIcon collapsed={effectiveToolRailCollapsed} />
            </button>
          </div>

          <div className={toolRailBodyClassName}>
            <MoleculeEditorBondOrderSection
              activeElementMaxBondSlots={activeElementMaxBondSlots}
              activeElementSymbol={activeElementSymbol}
              bondOrder={bondOrder}
              bondOrderOptions={bondOrderOptions}
              collapsedSectionClassName={collapsedToolRailSectionClassName}
              expandedSectionClassName={expandedToolRailSectionClassName}
              isCollapsed={effectiveToolRailCollapsed}
              onSetBondOrder={onSetBondOrder}
              selectedAtomId={selectedAtomId}
              showExpandedContent={showExpandedToolRailContent}
            />

            <div className={effectiveToolRailCollapsed ? collapsedToolRailSectionClassName : expandedToolRailSectionClassName}>
              <MoleculeEditorToolRailButton
                icon={<SaveGalleryIcon />}
                label="Save as New"
                title="Open gallery save dialog"
                collapsed={effectiveToolRailCollapsed}
                active={isSaveModalOpen}
                disabled={summaryAtomCount === 0}
                onClick={onOpenSaveModal}
              />
              <MoleculeEditorToolRailButton
                icon={<UndoIcon />}
                label="Undo"
                title="Undo change (Ctrl/Cmd+Z)"
                collapsed={effectiveToolRailCollapsed}
                disabled={!canUndo}
                onClick={onUndo}
              />
              <MoleculeEditorToolRailButton
                icon={<RedoIcon />}
                label="Redo"
                title="Redo change (Ctrl/Cmd+Shift+Z)"
                collapsed={effectiveToolRailCollapsed}
                disabled={!canRedo}
                onClick={onRedo}
              />
              <MoleculeEditorToolRailButton
                icon={<AddAtomIcon />}
                label="Add selected element"
                collapsed={effectiveToolRailCollapsed}
                disabled={activeElementSymbol === null}
                onClick={onAddSelectedElement}
              />
              <MoleculeEditorToolRailButton
                icon={<RemoveAtomIcon />}
                label="Remove selected atom"
                collapsed={effectiveToolRailCollapsed}
                disabled={selectedAtomId === null}
                onClick={onRemoveSelectedAtom}
              />
              <MoleculeEditorToolRailButton
                icon={<ClearSelectionIcon />}
                label="Clear selection"
                collapsed={effectiveToolRailCollapsed}
                disabled={selectedAtomId === null}
                onClick={onClearSelection}
              />
              <MoleculeEditorToolRailButton
                icon={<ResetEditorIcon />}
                label="Reset editor"
                collapsed={effectiveToolRailCollapsed}
                danger
                onClick={onResetMolecule}
              />
            </div>
          </div>
        </aside>
      ) : null}

      <MoleculeEditorFloatingSaveShortcut
        floatingSaveShortcutInnerStyle={floatingSaveShortcutInnerStyle}
        floatingSaveShortcutPanelStyle={floatingSaveShortcutPanelStyle}
        floatingSaveShortcutTriggerStyle={floatingSaveShortcutTriggerStyle}
        isExpanded={isFloatingSaveShortcutExpanded}
        isLandscapeCompactCanvas={isLandscapeCompactCanvas}
        isSaveModalOpen={isSaveModalOpen}
        onExpandedChange={onFloatingSaveShortcutExpandedChange}
        onOpenSaveModal={onOpenSaveModal}
        shouldShow={shouldShowFloatingSaveShortcut}
        summaryAtomCount={summaryAtomCount}
        toolRailStyle={toolRailStyle}
      />
    </>
  );
}
