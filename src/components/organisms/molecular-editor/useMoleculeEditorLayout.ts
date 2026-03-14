'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

import type { SavedMoleculeEditorState } from '@/shared/types/molecule';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type UseMoleculeEditorLayoutOptions = {
  activeView: EditorViewMode;
  componentCount: number;
  isFloatingSaveShortcutExpanded: boolean;
  isFormulaPanelOpen: boolean;
  isPaletteSearchOpen: boolean;
  isToolRailCollapsed: boolean;
  pageMode: 'editor' | 'gallery';
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  resolvedEditorNotice: string | null;
};

const EDITOR_SECTION_GAP = 12;
const EDITOR_SECTION_TOP_PADDING = 2;
const EDITOR_SECTION_BOTTOM_PADDING = 16;

export default function useMoleculeEditorLayout({
  activeView,
  componentCount,
  isFloatingSaveShortcutExpanded,
  isFormulaPanelOpen,
  isPaletteSearchOpen,
  isToolRailCollapsed,
  pageMode,
  paletteSearchRailRef,
  resolvedEditorNotice,
}: UseMoleculeEditorLayoutOptions) {
  const topControlsRef = useRef<HTMLDivElement | null>(null);
  const topOverlayRef = useRef<HTMLDivElement | null>(null);
  const bottomNoticeRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);

  const [topControlsHeight, setTopControlsHeight] = useState(0);
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const [paletteSearchRailHeight, setPaletteSearchRailHeight] = useState(0);
  const [bottomNoticeHeight, setBottomNoticeHeight] = useState(0);
  const [canvasFrameSize, setCanvasFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const topControlsElement = topControlsRef.current;
    const overlayElement = topOverlayRef.current;
    const searchRailElement = paletteSearchRailRef.current;
    const bottomNoticeElement = bottomNoticeRef.current;
    const canvasElement = canvasFrameRef.current;

    if (
      topControlsElement === null &&
      overlayElement === null &&
      searchRailElement === null &&
      bottomNoticeElement === null &&
      canvasElement === null
    ) {
      return;
    }

    const updateMeasurements = () => {
      if (topControlsElement !== null) {
        const nextTopControlsHeight = Math.round(topControlsElement.getBoundingClientRect().height);
        setTopControlsHeight((currentHeight) =>
          currentHeight === nextTopControlsHeight ? currentHeight : nextTopControlsHeight,
        );
      }

      if (overlayElement !== null) {
        const nextOverlayHeight = Math.round(overlayElement.getBoundingClientRect().height);
        setTopOverlayHeight((currentHeight) =>
          currentHeight === nextOverlayHeight ? currentHeight : nextOverlayHeight,
        );
      }

      if (searchRailElement !== null) {
        const nextSearchRailHeight = Math.round(searchRailElement.getBoundingClientRect().height);
        setPaletteSearchRailHeight((currentHeight) =>
          currentHeight === nextSearchRailHeight ? currentHeight : nextSearchRailHeight,
        );
      }

      if (bottomNoticeElement !== null) {
        const nextBottomNoticeHeight = Math.round(bottomNoticeElement.getBoundingClientRect().height);
        setBottomNoticeHeight((currentHeight) =>
          currentHeight === nextBottomNoticeHeight ? currentHeight : nextBottomNoticeHeight,
        );
      } else {
        setBottomNoticeHeight((currentHeight) => (currentHeight === 0 ? currentHeight : 0));
      }

      if (canvasElement !== null) {
        const rect = canvasElement.getBoundingClientRect();
        const nextWidth = Math.round(rect.width);
        const nextHeight = Math.round(rect.height);

        setCanvasFrameSize((currentSize) =>
          currentSize.width === nextWidth && currentSize.height === nextHeight
            ? currentSize
            : { width: nextWidth, height: nextHeight },
        );
      }
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (topControlsElement !== null) {
      resizeObserver.observe(topControlsElement);
    }

    if (overlayElement !== null) {
      resizeObserver.observe(overlayElement);
    }

    if (searchRailElement !== null) {
      resizeObserver.observe(searchRailElement);
    }

    if (bottomNoticeElement !== null) {
      resizeObserver.observe(bottomNoticeElement);
    }

    if (canvasElement !== null) {
      resizeObserver.observe(canvasElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeView, paletteSearchRailRef]);

  return useMemo(() => {
    const isCompactCanvas = canvasFrameSize.width > 0 && canvasFrameSize.width < 640;
    const isWideCanvas = canvasFrameSize.width >= 1024;
    const isSimplifiedView = activeView === 'simplified';
    const isLandscapeCompactCanvas =
      !isSimplifiedView &&
      canvasFrameSize.width > 0 &&
      canvasFrameSize.height > 0 &&
      canvasFrameSize.width > canvasFrameSize.height &&
      canvasFrameSize.height < 360;
    const viewportMainHeightCss = 'var(--app-viewport-main-height, 100svh)';
    const viewportMainGutterCss = 'var(--app-viewport-main-gutter, 0px)';
    const viewportMainTopGutterCss = `calc(${viewportMainGutterCss} + ${EDITOR_SECTION_TOP_PADDING}px)`;
    const canvasPanelHeightCss = `max(280px, calc(${viewportMainHeightCss} - ${topControlsHeight + EDITOR_SECTION_GAP + EDITOR_SECTION_BOTTOM_PADDING}px - ${viewportMainTopGutterCss}))`;
    const canvasPanelStyle: CSSProperties = {
      height: canvasPanelHeightCss,
      minHeight: canvasPanelHeightCss,
      maxHeight: canvasPanelHeightCss,
    };
    const editorSectionStyle: CSSProperties = {
      minHeight: viewportMainHeightCss,
      paddingTop: viewportMainTopGutterCss,
    };
    const canvasContentInsetTop = topOverlayHeight > 0 ? topOverlayHeight + 16 : 96;
    const paletteSearchRailGap = paletteSearchRailHeight > 0 ? (isLandscapeCompactCanvas ? 6 : 8) : 0;
    const paletteSearchRailOffset = paletteSearchRailHeight + paletteSearchRailGap;
    const toolRailTop = canvasContentInsetTop + paletteSearchRailOffset;
    const toolRailStyle: CSSProperties = {
      top: toolRailTop,
      maxHeight: `calc(100% - ${toolRailTop + 12}px)`,
    };
    const simplifiedHorizontalPadding = isWideCanvas ? 32 : isCompactCanvas ? 14 : 22;
    const simplifiedFloatingSaveClearance =
      isSimplifiedView && pageMode === 'editor' ? (isLandscapeCompactCanvas ? 54 : 62) : 0;
    const simplifiedTopPadding = canvasContentInsetTop + paletteSearchRailOffset + (isCompactCanvas ? 12 : 16);
    const simplifiedBottomPadding = isWideCanvas ? 36 : isCompactCanvas ? 24 : 30;
    const simplifiedViewStyle: CSSProperties = {
      paddingTop: simplifiedTopPadding,
      paddingLeft: simplifiedHorizontalPadding + simplifiedFloatingSaveClearance,
      paddingRight: simplifiedHorizontalPadding,
      paddingBottom: simplifiedBottomPadding,
      WebkitOverflowScrolling: 'touch',
    };
    const effectiveToolRailCollapsed = isLandscapeCompactCanvas || isToolRailCollapsed;
    const showExpandedToolRailContent = !effectiveToolRailCollapsed;
    const responsiveLayoutWidth = canvasFrameSize.width > 0 ? canvasFrameSize.width : 320;

    const topControlsRowClassName = isLandscapeCompactCanvas
      ? 'flex min-w-0 flex-nowrap items-center justify-between gap-1.5'
      : responsiveLayoutWidth < 430
        ? 'flex min-w-0 flex-nowrap items-center justify-between gap-1.5'
        : 'flex flex-wrap items-center justify-between gap-2';
    const topControlsBlockClassName = componentCount > 1 ? 'space-y-2' : '';
    const topControlsLeadingGroupClassName = isLandscapeCompactCanvas
      ? 'flex min-w-0 flex-nowrap items-center gap-1.5'
      : responsiveLayoutWidth < 430
        ? 'flex min-w-0 flex-nowrap items-center gap-1.5'
        : 'flex flex-wrap items-center gap-2';
    const viewModeTabsClassName = isLandscapeCompactCanvas
      ? 'flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
      : 'flex items-center gap-1 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-1 shadow-lg backdrop-blur-xl';
    const viewModeButtonClassName = isLandscapeCompactCanvas
      ? 'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold transition-colors'
      : responsiveLayoutWidth < 430
        ? 'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold transition-colors'
        : 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition-colors';
    const importButtonClassName = isLandscapeCompactCanvas
      ? 'inline-flex h-7 items-center gap-1 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) px-2 text-[10px] font-semibold text-(--text-muted) shadow-lg backdrop-blur-xl transition-colors hover:border-(--accent) hover:text-foreground'
      : responsiveLayoutWidth < 430
        ? 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) px-0 text-[10px] font-semibold text-(--text-muted) shadow-lg backdrop-blur-xl transition-colors hover:border-(--accent) hover:text-foreground'
        : 'inline-flex h-8 items-center gap-1.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) px-2.5 text-[11px] font-semibold text-(--text-muted) shadow-lg backdrop-blur-xl transition-colors hover:border-(--accent) hover:text-foreground';
    const zoomControlsClassName = isLandscapeCompactCanvas
      ? 'ml-auto flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
      : responsiveLayoutWidth < 430
        ? 'ml-auto flex shrink-0 items-center gap-px rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
        : 'ml-auto flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl';
    const zoomControlsVisibilityClassName = isSimplifiedView ? 'pointer-events-none invisible' : '';
    const topOverlayClassName = isLandscapeCompactCanvas
      ? 'absolute inset-x-2 top-2 z-30'
      : 'absolute inset-x-3 top-3 z-30';
    const toolRailCollapsedWidthClassName = isLandscapeCompactCanvas ? 'w-10' : 'w-12';
    const toolRailExpandedWidthClassName = isLandscapeCompactCanvas
      ? 'w-[min(56vw,8.5rem)]'
      : 'w-[min(72vw,224px)] sm:w-52';
    const paletteSearchShellClassName = isLandscapeCompactCanvas ? 'h-6 rounded-xl' : 'h-7 rounded-xl';
    const toolRailInsetPx = 12;
    const toolRailCollapsedWidthPx = isLandscapeCompactCanvas ? 40 : 48;
    const paletteSearchTriggerWidthPx = isLandscapeCompactCanvas ? 40 : 48;
    const paletteSearchClosedWidthPx = toolRailCollapsedWidthPx;
    const toolRailExpandedWidthPx = isLandscapeCompactCanvas
      ? Math.round(Math.min(responsiveLayoutWidth * 0.56, 136))
      : responsiveLayoutWidth >= 640
        ? 208
        : Math.round(Math.min(responsiveLayoutWidth * 0.72, 224));
    const paletteSearchExpandedWidthPx = Math.round(toolRailExpandedWidthPx);
    const paletteSearchRailStyle: CSSProperties = {
      top: canvasContentInsetTop,
      left: `${toolRailInsetPx + (toolRailCollapsedWidthPx - paletteSearchClosedWidthPx) / 2}px`,
    };
    const paletteSearchPanelStyle: CSSProperties = {
      width: `${isPaletteSearchOpen ? paletteSearchExpandedWidthPx : paletteSearchClosedWidthPx}px`,
    };
    const paletteSearchInnerStyle: CSSProperties = {
      width: `${paletteSearchExpandedWidthPx}px`,
    };
    const paletteSearchTriggerStyle: CSSProperties = {
      width: `${paletteSearchTriggerWidthPx}px`,
    };
    const floatingSaveShortcutClosedWidthPx = toolRailCollapsedWidthPx;
    const floatingSaveShortcutExpandedWidthPx = isLandscapeCompactCanvas ? 132 : 156;
    const floatingSaveShortcutPanelStyle: CSSProperties = {
      width: `${isFloatingSaveShortcutExpanded ? floatingSaveShortcutExpandedWidthPx : floatingSaveShortcutClosedWidthPx}px`,
    };
    const floatingSaveShortcutInnerStyle: CSSProperties = {
      width: `${floatingSaveShortcutExpandedWidthPx}px`,
    };
    const floatingSaveShortcutTriggerStyle: CSSProperties = {
      width: `${floatingSaveShortcutClosedWidthPx}px`,
    };
    const paletteSearchButtonClassName = isLandscapeCompactCanvas ? 'h-5 w-5' : 'h-5.5 w-5.5';
    const paletteViewportWrapperClassName = isLandscapeCompactCanvas
      ? 'relative overflow-hidden px-8 py-1'
      : 'relative overflow-hidden px-9 py-1 sm:px-10 sm:py-1.5';
    const paletteRowClassName = isLandscapeCompactCanvas
      ? 'flex h-8 items-center gap-0.5'
      : 'flex h-11 items-center gap-1 sm:h-12 sm:gap-1.5 lg:h-[3.25rem] lg:gap-2';
    const compactBottomOverlayClassName = isLandscapeCompactCanvas
      ? 'pointer-events-none absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-2'
      : 'pointer-events-none absolute bottom-3 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-3';
    const compactBottomNoticeClassName = isLandscapeCompactCanvas
      ? 'pointer-events-auto max-w-[min(84vw,320px)] rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-panel) px-2 py-1.5 text-[10px] leading-[1.2] text-(--text-muted) shadow-lg backdrop-blur-xl'
      : 'pointer-events-auto max-w-[min(92vw,620px)] rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-panel) px-3 py-2 text-xs text-(--text-muted) shadow-lg backdrop-blur-xl sm:text-[13px]';
    const compactDisplayedEditorNotice =
      isLandscapeCompactCanvas && resolvedEditorNotice === 'Select an element, then double-click or double-tap the canvas to place it.'
        ? 'Select an element, then double-tap to place it.'
        : resolvedEditorNotice;
    const toolRailBodyClassName = effectiveToolRailCollapsed
      ? 'flex flex-1 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2'
      : 'flex-1 space-y-2.5 overflow-y-auto p-2';
    const collapsedToolRailSectionClassName = 'flex w-full flex-col items-center gap-2';
    const expandedToolRailSectionClassName = 'space-y-1.5';
    const formulaPanelBottom = bottomNoticeHeight > 0 ? bottomNoticeHeight + (isLandscapeCompactCanvas ? 8 : 16) : isLandscapeCompactCanvas ? 10 : 56;
    const formulaPanelStyle: CSSProperties = {
      bottom: `${formulaPanelBottom}px`,
    };
    const canvasPanelClassName = 'surface-panel relative overflow-hidden rounded-3xl border border-(--border-subtle) shadow-sm';
    const canvasFrameClassName = 'relative h-full w-full';

    return {
      bottomNoticeRef,
      canvasFrameClassName,
      canvasFrameRef,
      canvasFrameSize,
      canvasPanelClassName,
      canvasPanelStyle,
      collapsedToolRailSectionClassName,
      compactBottomNoticeClassName,
      compactBottomOverlayClassName,
      compactDisplayedEditorNotice,
      editorSectionStyle,
      effectiveToolRailCollapsed,
      expandedToolRailSectionClassName,
      floatingSaveShortcutInnerStyle,
      floatingSaveShortcutPanelStyle,
      floatingSaveShortcutTriggerStyle,
      formulaPanelStyle,
      isCompactCanvas,
      isLandscapeCompactCanvas,
      isSimplifiedView,
      isWideCanvas,
      paletteRowClassName,
      paletteSearchButtonClassName,
      paletteSearchInnerStyle,
      paletteSearchPanelStyle,
      paletteSearchRailOffset,
      paletteSearchRailStyle,
      paletteSearchShellClassName,
      paletteSearchTriggerStyle,
      paletteViewportWrapperClassName,
      responsiveLayoutWidth,
      showExpandedToolRailContent,
      simplifiedViewStyle,
      toolRailBodyClassName,
      toolRailCollapsedWidthClassName,
      toolRailExpandedWidthClassName,
      toolRailStyle,
      topControlsBlockClassName,
      topControlsLeadingGroupClassName,
      topControlsRef,
      topControlsRowClassName,
      topOverlayClassName,
      topOverlayRef,
      viewModeButtonClassName,
      viewModeTabsClassName,
      zoomControlsClassName,
      zoomControlsVisibilityClassName,
      importButtonClassName,
      canvasFrameAspectRatio:
        canvasFrameSize.width > 0 && canvasFrameSize.height > 0
          ? canvasFrameSize.width / canvasFrameSize.height
          : undefined,
      isFormulaPanelOpen,
    };
  }, [
    activeView,
    bottomNoticeHeight,
    canvasFrameSize,
    componentCount,
    isFloatingSaveShortcutExpanded,
    isFormulaPanelOpen,
    isPaletteSearchOpen,
    isToolRailCollapsed,
    pageMode,
    resolvedEditorNotice,
    topControlsHeight,
    topOverlayHeight,
    paletteSearchRailHeight,
  ]);
}
