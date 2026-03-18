'use client';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

type MoleculeEditorZoomControlsProps = {
  isLandscapeCompactCanvas: boolean;
  isSimplifiedView: boolean;
  onResetCanvasView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  responsiveLayoutWidth: number;
  zoomControlsClassName: string;
  zoomControlsVisibilityClassName: string;
  zoomPercent: number;
};

export default function MoleculeEditorZoomControls({
  isLandscapeCompactCanvas,
  isSimplifiedView,
  onResetCanvasView,
  onZoomIn,
  onZoomOut,
  responsiveLayoutWidth,
  zoomControlsClassName,
  zoomControlsVisibilityClassName,
  zoomPercent,
}: MoleculeEditorZoomControlsProps) {
  const text = useMolecularEditorText();

  return (
    <div className={`${zoomControlsClassName} ${zoomControlsVisibilityClassName}`} aria-hidden={isSimplifiedView}>
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
        aria-label={text.topBar.zoomOut}
        title={text.topBar.zoomOut}
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
        aria-label={text.topBar.resetZoom}
        title={text.topBar.resetZoom}
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
        aria-label={text.topBar.zoomIn}
        title={text.topBar.zoomIn}
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
          {text.topBar.fit}
        </button>
      )}
    </div>
  );
}
