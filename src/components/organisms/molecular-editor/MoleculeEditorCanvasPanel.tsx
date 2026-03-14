'use client';

import type {
  CSSProperties,
  ComponentProps,
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent as ReactWheelEvent,
} from 'react';

import EditorCanvas from '@/components/organisms/molecular-editor/MoleculeEditorCanvas';
import MoleculeEditorToolRail from '@/components/organisms/molecular-editor/MoleculeEditorToolRail';
import MoleculePaletteRail from '@/components/organisms/molecular-editor/MoleculePaletteRail';
import MoleculeSummaryPanel from '@/components/molecules/chemistry/MoleculeSummaryPanel';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type CompositionRow = {
  symbol: string;
  name: string;
  count: number;
};

type MoleculeEditorCanvasPanelProps = {
  activeView: EditorViewMode;
  bottomNoticeRef: RefObject<HTMLDivElement | null>;
  canvasFrameClassName: string;
  canvasFrameRef: RefObject<HTMLDivElement | null>;
  canvasPanelClassName: string;
  canvasPanelStyle: CSSProperties;
  compactBottomNoticeClassName: string;
  compactBottomOverlayClassName: string;
  compactDisplayedEditorNotice: string | null;
  compositionRows: CompositionRow[];
  focusedComponentIndex: number;
  formulaDisplayValue: string;
  formulaPanelProps: ComponentProps<typeof MoleculeSummaryPanel>;
  interactiveViewBox: ComponentProps<typeof EditorCanvas>['viewBox'];
  isLandscapeCompactCanvas: boolean;
  isPaletteSearchOpen: boolean;
  isSimplifiedView: boolean;
  molecule: MoleculeModel;
  moleculeComponentsCount: number;
  onAtomPointerDown: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
  onCanvasPointerCancel: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasWheel: (event: ReactWheelEvent<SVGSVGElement>) => void;
  onClearPaletteSearch: () => void;
  onClosePaletteSearch: () => void;
  onPaletteSearchChange: (value: string) => void;
  onTogglePaletteSearch: () => void;
  paletteQuery: string;
  paletteRailProps: ComponentProps<typeof MoleculePaletteRail>;
  paletteSearchButtonClassName: string;
  paletteSearchInnerStyle: CSSProperties;
  paletteSearchPanelStyle: CSSProperties;
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  paletteSearchRailStyle: CSSProperties;
  paletteSearchShellClassName: string;
  paletteSearchTriggerStyle: CSSProperties;
  resolvedEditorNotice: string | null;
  searchInputRef: RefObject<HTMLInputElement | null>;
  shouldShowActivePaletteFilter: boolean;
  svgRef: RefObject<SVGSVGElement | null>;
  simplifiedViewStyle: CSSProperties;
  toolRailProps: ComponentProps<typeof MoleculeEditorToolRail>;
};

function SearchIcon() {
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
      <circle cx="7" cy="7" r="3.8" />
      <path d="m10.2 10.2 2.6 2.6" />
    </svg>
  );
}

function CloseChipIcon() {
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
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

export default function MoleculeEditorCanvasPanel({
  activeView,
  bottomNoticeRef,
  canvasFrameClassName,
  canvasFrameRef,
  canvasPanelClassName,
  canvasPanelStyle,
  compactBottomNoticeClassName,
  compactBottomOverlayClassName,
  compactDisplayedEditorNotice,
  compositionRows,
  focusedComponentIndex,
  formulaDisplayValue,
  formulaPanelProps,
  interactiveViewBox,
  isLandscapeCompactCanvas,
  isPaletteSearchOpen,
  isSimplifiedView,
  molecule,
  moleculeComponentsCount,
  onAtomPointerDown,
  onCanvasPointerCancel,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasWheel,
  onClearPaletteSearch,
  onClosePaletteSearch,
  onPaletteSearchChange,
  onTogglePaletteSearch,
  paletteQuery,
  paletteRailProps,
  paletteSearchButtonClassName,
  paletteSearchInnerStyle,
  paletteSearchPanelStyle,
  paletteSearchRailRef,
  paletteSearchRailStyle,
  paletteSearchShellClassName,
  paletteSearchTriggerStyle,
  resolvedEditorNotice,
  searchInputRef,
  shouldShowActivePaletteFilter,
  simplifiedViewStyle,
  svgRef,
  toolRailProps,
}: MoleculeEditorCanvasPanelProps) {
  return (
    <div className={canvasPanelClassName} style={canvasPanelStyle}>
      <MoleculePaletteRail {...paletteRailProps} />

      <div ref={paletteSearchRailRef} style={paletteSearchRailStyle} className="absolute z-20">
        <div
          style={paletteSearchPanelStyle}
          className={`pointer-events-auto flex flex-nowrap items-stretch overflow-hidden border bg-(--surface-overlay-strong) shadow-lg backdrop-blur-xl origin-left transition-[width,border-color] duration-200 ${paletteSearchShellClassName} ${
            shouldShowActivePaletteFilter ? 'border-(--accent)' : 'border-(--border-subtle)'
          }`}
        >
          <div style={paletteSearchInnerStyle} className="flex h-full flex-nowrap items-stretch">
            <div style={paletteSearchTriggerStyle} className="flex h-full shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={onTogglePaletteSearch}
                className="inline-flex h-full w-full items-center justify-center text-(--text-muted) transition-colors hover:text-foreground"
                aria-label={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
                title={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
              >
                <SearchIcon />
              </button>
            </div>

            <div
              className={`flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden pr-1.5 ${
                isPaletteSearchOpen ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              aria-hidden={!isPaletteSearchOpen}
            >
              <input
                ref={searchInputRef}
                id="molecule-element-search"
                name="molecule-element-search"
                type="text"
                value={paletteQuery}
                onChange={(event) => {
                  onPaletteSearchChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' || event.key === 'Enter') {
                    onClosePaletteSearch();
                  }
                }}
                tabIndex={isPaletteSearchOpen ? undefined : -1}
                placeholder="Search"
                className={`w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-(--text-muted) ${
                  isLandscapeCompactCanvas ? 'text-[11px]' : 'text-[13px]'
                }`}
              />

              {paletteQuery.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={onClearPaletteSearch}
                  className={`inline-flex shrink-0 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:text-foreground ${paletteSearchButtonClassName}`}
                  aria-label="Clear element search"
                  title="Clear element search"
                >
                  <CloseChipIcon />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <MoleculeEditorToolRail {...toolRailProps} />

      <div ref={canvasFrameRef} className={canvasFrameClassName}>
        {isSimplifiedView ? (
          <div className="absolute inset-0 overflow-y-auto overscroll-contain" style={simplifiedViewStyle}>
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-start gap-2.5 sm:gap-4 lg:justify-center">
              <div className="rounded-[24px] border border-(--border-subtle) bg-(--surface-overlay-soft) px-3.5 py-4 text-center shadow-sm backdrop-blur-sm sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted) sm:text-[11px]">
                  Simplified
                </p>
                <p className="mt-2.5 wrap-break-word text-[clamp(1.5rem,8vw,4.5rem)] font-black leading-[0.96] tracking-[0.03em] text-foreground">
                  {formulaDisplayValue}
                </p>
                <p className="mx-auto mt-2.5 max-w-2xl text-[11px] leading-relaxed text-(--text-muted) sm:mt-4 sm:text-sm">
                  {moleculeComponentsCount > 1
                    ? `Compact composition view for Mol ${focusedComponentIndex + 1}.`
                    : 'Compact composition view for the current molecule.'}
                </p>
              </div>

              {compositionRows.length > 0 ? (
                <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {compositionRows.map((row) => (
                    <div
                      key={row.symbol}
                      className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3.5 py-3 shadow-sm backdrop-blur-sm"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)">
                        {row.name}
                      </dt>
                      <dd className="mt-2 flex items-end justify-between gap-3">
                        <span className="text-xl font-black text-foreground sm:text-2xl">{row.symbol}</span>
                        <span className="text-base font-semibold text-foreground sm:text-lg">{row.count}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="rounded-2xl border border-dashed border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-5 text-center text-sm text-(--text-muted)">
                  Add atoms to generate a simplified formula.
                </div>
              )}
            </div>
          </div>
        ) : (
          <EditorCanvas
            model={molecule}
            mode={activeView}
            viewBox={interactiveViewBox}
            selectedAtomId={toolRailProps.selectedAtomId}
            svgRef={svgRef}
            onCanvasPointerDown={onCanvasPointerDown}
            onCanvasPointerMove={onCanvasPointerMove}
            onCanvasPointerUp={onCanvasPointerUp}
            onCanvasPointerCancel={onCanvasPointerCancel}
            onCanvasWheel={onCanvasWheel}
            onAtomPointerDown={onAtomPointerDown}
          />
        )}
      </div>

      {isSimplifiedView || resolvedEditorNotice === null ? null : (
        <div className={compactBottomOverlayClassName}>
          <div ref={bottomNoticeRef} className={compactBottomNoticeClassName} title={resolvedEditorNotice}>
            {compactDisplayedEditorNotice}
          </div>
        </div>
      )}

      {isSimplifiedView ? null : <MoleculeSummaryPanel {...formulaPanelProps} />}
    </div>
  );
}
