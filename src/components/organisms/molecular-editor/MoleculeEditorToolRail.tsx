'use client';

import type { CSSProperties } from 'react';

import MoleculeEditorBondOrderSection from '@/components/organisms/molecular-editor/MoleculeEditorBondOrderSection';
import MoleculeEditorFloatingSaveShortcut from '@/components/organisms/molecular-editor/MoleculeEditorFloatingSaveShortcut';
import MoleculeEditorToolRailActions from '@/components/organisms/molecular-editor/MoleculeEditorToolRailActions';
import MoleculeEditorToolRailHeader from '@/components/organisms/molecular-editor/MoleculeEditorToolRailHeader';
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
          <MoleculeEditorToolRailHeader
            effectiveToolRailCollapsed={effectiveToolRailCollapsed}
            onToggleCollapsed={onToggleCollapsed}
            showExpandedToolRailContent={showExpandedToolRailContent}
          />

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

            <MoleculeEditorToolRailActions
              activeElementSymbol={activeElementSymbol}
              canRedo={canRedo}
              canUndo={canUndo}
              collapsedSectionClassName={collapsedToolRailSectionClassName}
              effectiveToolRailCollapsed={effectiveToolRailCollapsed}
              expandedSectionClassName={expandedToolRailSectionClassName}
              isSaveModalOpen={isSaveModalOpen}
              onAddSelectedElement={onAddSelectedElement}
              onClearSelection={onClearSelection}
              onOpenSaveModal={onOpenSaveModal}
              onRedo={onRedo}
              onRemoveSelectedAtom={onRemoveSelectedAtom}
              onResetMolecule={onResetMolecule}
              onUndo={onUndo}
              selectedAtomId={selectedAtomId}
              summaryAtomCount={summaryAtomCount}
            />
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
