'use client';

import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

const INTERNAL_ZOOM_MIN_PERCENT = 25;
const INTERNAL_ZOOM_MAX_PERCENT = 175;
const INTERNAL_ZOOM_STEP_PERCENT = 5;

type ClassicPeriodicControlsProps = {
  zoomPercent: number;
  isFullscreen: boolean;
  onZoomChange: (nextZoomPercent: number) => void;
  onToggleFullscreen: () => void;
};

function FullscreenIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="block"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isActive ? (
        <>
          <path d="M2.5 5.5H5.5V2.5" />
          <path d="M10.5 2.5V5.5H13.5" />
          <path d="M13.5 10.5H10.5V13.5" />
          <path d="M5.5 13.5V10.5H2.5" />
        </>
      ) : (
        <>
          <path d="M2.5 6V2.5H6" />
          <path d="M10 2.5H13.5V6" />
          <path d="M13.5 10V13.5H10" />
          <path d="M6 13.5H2.5V10" />
        </>
      )}
    </svg>
  );
}

export default function ClassicPeriodicControls({
  zoomPercent,
  isFullscreen,
  onZoomChange,
  onToggleFullscreen,
}: ClassicPeriodicControlsProps) {
  const text = usePeriodicTableText();
  const isZoomMin = zoomPercent <= INTERNAL_ZOOM_MIN_PERCENT;
  const isZoomMax = zoomPercent >= INTERNAL_ZOOM_MAX_PERCENT;

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/92 px-2 py-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => {
            onZoomChange(Math.max(INTERNAL_ZOOM_MIN_PERCENT, zoomPercent - INTERNAL_ZOOM_STEP_PERCENT));
          }}
          disabled={isZoomMin}
          aria-label={text.fullscreen.zoomOut}
          className="rounded border border-[var(--border-subtle)] px-1.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          -
        </button>
        <span className="min-w-11 text-center text-[10px] font-semibold text-[var(--text-strong)]">
          {zoomPercent}%
        </span>
        <button
          type="button"
          onClick={() => {
            onZoomChange(Math.min(INTERNAL_ZOOM_MAX_PERCENT, zoomPercent + INTERNAL_ZOOM_STEP_PERCENT));
          }}
          disabled={isZoomMax}
          aria-label={text.fullscreen.zoomIn}
          className="rounded border border-[var(--border-subtle)] px-1.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          +
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? text.fullscreen.exitTable : text.fullscreen.enterTable}
          title={isFullscreen ? text.fullscreen.exit : text.fullscreen.enter}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
        >
          <FullscreenIcon isActive={isFullscreen} />
        </button>
      </div>
    </div>
  );
}
