'use client';

import type { CSSProperties, ReactNode } from 'react';

import type { BondOrder } from '@/shared/utils/moleculeEditor';

function RailToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3.5h10" />
      <path d="M3 8h10" />
      <path d="M3 12.5h10" />
      {collapsed ? <path d="m7 5 3 3-3 3" /> : <path d="m9 5-3 3 3 3" />}
    </svg>
  );
}

function AddAtomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" />
      <path d="M8 3v10" />
      <path d="M3 8h10" />
    </svg>
  );
}

function RemoveAtomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.5 4.5h9" />
      <path d="M6 4.5V3.2h4V4.5" />
      <path d="M5.1 6.2 5.6 12h4.8l.5-5.8" />
      <path d="M7 7.2v3.4" />
      <path d="M9 7.2v3.4" />
    </svg>
  );
}

function ClearSelectionIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" />
      <path d="m5.2 5.2 5.6 5.6" />
    </svg>
  );
}

function ResetEditorIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.5 8a4.5 4.5 0 1 0 1.1-3" />
      <path d="M3.5 3.7v2.5H6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M6.4 4.2 3.8 6.8l2.6 2.6" />
      <path d="M4.1 6.8h4.4a3.4 3.4 0 1 1 0 6.8H6.8" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m9.6 4.2 2.6 2.6-2.6 2.6" />
      <path d="M11.9 6.8H7.5a3.4 3.4 0 1 0 0 6.8h1.7" />
    </svg>
  );
}

function BondOrderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="4" cy="8" r="1.2" />
      <circle cx="12" cy="8" r="1.2" />
      <path d="M5.5 6.5h5" />
      <path d="M5.5 8h5" />
      <path d="M5.5 9.5h5" />
    </svg>
  );
}

function SaveGalleryIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.2 2.8h7.1l2.5 2.4v8H3.2z" />
      <path d="M5.2 2.8v3.3h4.6V2.8" />
      <path d="M5.3 10.3h5.4" />
      <path d="M5.3 12.2h4" />
    </svg>
  );
}

function ToolRailButton({
  icon,
  label,
  title,
  collapsed,
  active = false,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  title?: string;
  collapsed: boolean;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const stateClassName = danger
    ? 'border-rose-500/55 bg-rose-500/10 text-rose-200 hover:bg-rose-500/18'
    : active
      ? 'border-(--accent) bg-(--accent)/24 text-foreground'
      : 'border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) hover:border-(--accent) hover:text-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`inline-flex items-center border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${stateClassName} ${
        collapsed
          ? 'mx-auto h-9 w-9 justify-center rounded-xl px-0'
          : 'h-9 w-full justify-start gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {collapsed ? null : <span>{label}</span>}
    </button>
  );
}

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
            <div className={effectiveToolRailCollapsed ? collapsedToolRailSectionClassName : expandedToolRailSectionClassName}>
              {showExpandedToolRailContent ? (
                <div className="flex items-center gap-2 px-1">
                  <BondOrderIcon />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                    Bond Order
                  </p>
                </div>
              ) : null}
              <div className={`grid ${effectiveToolRailCollapsed ? 'w-full grid-cols-1 place-items-center gap-2' : 'grid-cols-3 gap-1.5'}`}>
                {bondOrderOptions.map((option) => {
                  const isDisabled =
                    selectedAtomId === null &&
                    activeElementMaxBondSlots !== null &&
                    option.order > activeElementMaxBondSlots;
                  const disabledTitle =
                    activeElementSymbol !== null && activeElementMaxBondSlots !== null
                      ? `${activeElementSymbol} commonly supports up to ${activeElementMaxBondSlots} bond slot${
                          activeElementMaxBondSlots === 1 ? '' : 's'
                        }.`
                      : `${option.label} bond`;

                  return (
                    <button
                      key={option.order}
                      type="button"
                      onClick={() => onSetBondOrder(option.order)}
                      disabled={isDisabled}
                      title={isDisabled ? disabledTitle : `${option.label} bond`}
                      aria-label={isDisabled ? disabledTitle : `${option.label} bond`}
                      className={`border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                        isDisabled
                          ? 'border-(--border-subtle) bg-(--surface-2)/55 text-(--text-muted)'
                          : bondOrder === option.order
                            ? 'border-(--accent) bg-(--accent)/22 text-foreground'
                            : 'border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) hover:border-(--accent) hover:text-foreground'
                      } ${effectiveToolRailCollapsed ? 'mx-auto h-9 w-9 rounded-xl text-sm font-black' : 'h-9 rounded-xl px-0 text-sm font-black'}`}
                    >
                      {option.order}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={effectiveToolRailCollapsed ? collapsedToolRailSectionClassName : expandedToolRailSectionClassName}>
              <ToolRailButton
                icon={<SaveGalleryIcon />}
                label="Save as New"
                title="Open gallery save dialog"
                collapsed={effectiveToolRailCollapsed}
                active={isSaveModalOpen}
                disabled={summaryAtomCount === 0}
                onClick={onOpenSaveModal}
              />
              <ToolRailButton
                icon={<UndoIcon />}
                label="Undo"
                title="Undo change (Ctrl/Cmd+Z)"
                collapsed={effectiveToolRailCollapsed}
                disabled={!canUndo}
                onClick={onUndo}
              />
              <ToolRailButton
                icon={<RedoIcon />}
                label="Redo"
                title="Redo change (Ctrl/Cmd+Shift+Z)"
                collapsed={effectiveToolRailCollapsed}
                disabled={!canRedo}
                onClick={onRedo}
              />
              <ToolRailButton
                icon={<AddAtomIcon />}
                label="Add selected element"
                collapsed={effectiveToolRailCollapsed}
                disabled={activeElementSymbol === null}
                onClick={onAddSelectedElement}
              />
              <ToolRailButton
                icon={<RemoveAtomIcon />}
                label="Remove selected atom"
                collapsed={effectiveToolRailCollapsed}
                disabled={selectedAtomId === null}
                onClick={onRemoveSelectedAtom}
              />
              <ToolRailButton
                icon={<ClearSelectionIcon />}
                label="Clear selection"
                collapsed={effectiveToolRailCollapsed}
                disabled={selectedAtomId === null}
                onClick={onClearSelection}
              />
              <ToolRailButton
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

      {shouldShowFloatingSaveShortcut ? (
        <div
          style={toolRailStyle}
          className="absolute left-3 z-20"
          onMouseEnter={() => onFloatingSaveShortcutExpandedChange(true)}
          onMouseLeave={() => onFloatingSaveShortcutExpandedChange(false)}
        >
          <button
            type="button"
            onClick={onOpenSaveModal}
            onFocus={() => onFloatingSaveShortcutExpandedChange(true)}
            onBlur={() => onFloatingSaveShortcutExpandedChange(false)}
            disabled={summaryAtomCount === 0}
            title="Open gallery save dialog"
            aria-label="Save as new"
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
                  isFloatingSaveShortcutExpanded ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden={!isFloatingSaveShortcutExpanded}
              >
                <span className={`truncate font-semibold text-foreground ${isLandscapeCompactCanvas ? 'text-[10px]' : 'text-[11px]'}`}>
                  Save as New
                </span>
              </div>
            </div>
          </button>
        </div>
      ) : null}
    </>
  );
}
