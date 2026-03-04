'use client';

import { memo, useCallback, useEffect, useRef, type CSSProperties } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import type { ChemicalElement } from '@/shared/types/element';

type ClassicPeriodicViewProps = {
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
  zoomPercent: number;
  onZoomChange: (nextZoomPercent: number) => void;
};

type ScrollFadeState = {
  hasOverflow: boolean;
  showLeftFade: boolean;
  showRightFade: boolean;
};

const INTERNAL_ZOOM_MIN_PERCENT = 25;
const INTERNAL_ZOOM_MAX_PERCENT = 175;
const INTERNAL_ZOOM_STEP_PERCENT = 5;

function ClassicPeriodicView({
  elements,
  onElementOpen,
  zoomPercent,
  onZoomChange,
}: ClassicPeriodicViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);
  const pendingFrameRef = useRef<number | null>(null);
  const lastFadeStateRef = useRef<ScrollFadeState>({
    hasOverflow: false,
    showLeftFade: false,
    showRightFade: false,
  });

  const applyScrollFadeClass = useCallback((nextState: ScrollFadeState) => {
    const fadeElement = fadeRef.current;

    if (fadeElement === null) {
      return;
    }

    fadeElement.classList.toggle('is-overflow', nextState.hasOverflow);
    fadeElement.classList.toggle('show-left', nextState.showLeftFade);
    fadeElement.classList.toggle('show-right', nextState.showRightFade);
  }, []);

  const updateScrollFade = useCallback(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement === null) {
      return;
    }

    const hasOverflow = scrollElement.scrollWidth > scrollElement.clientWidth + 1;

    const nextState: ScrollFadeState = !hasOverflow
      ? {
          hasOverflow: false,
          showLeftFade: false,
          showRightFade: false,
        }
      : {
          hasOverflow: true,
          showLeftFade: scrollElement.scrollLeft > 1,
          showRightFade:
            scrollElement.scrollLeft < scrollElement.scrollWidth - scrollElement.clientWidth - 1,
        };

    const previousState = lastFadeStateRef.current;
    if (
      previousState.hasOverflow === nextState.hasOverflow &&
      previousState.showLeftFade === nextState.showLeftFade &&
      previousState.showRightFade === nextState.showRightFade
    ) {
      return;
    }

    lastFadeStateRef.current = nextState;
    applyScrollFadeClass(nextState);
  }, [applyScrollFadeClass]);

  const scheduleScrollFadeUpdate = useCallback(() => {
    if (pendingFrameRef.current !== null) {
      return;
    }

    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      updateScrollFade();
    });
  }, [updateScrollFade]);

  const decreaseZoom = useCallback(() => {
    onZoomChange(Math.max(INTERNAL_ZOOM_MIN_PERCENT, zoomPercent - INTERNAL_ZOOM_STEP_PERCENT));
  }, [onZoomChange, zoomPercent]);

  const increaseZoom = useCallback(() => {
    onZoomChange(Math.min(INTERNAL_ZOOM_MAX_PERCENT, zoomPercent + INTERNAL_ZOOM_STEP_PERCENT));
  }, [onZoomChange, zoomPercent]);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement === null) {
      return;
    }

    scheduleScrollFadeUpdate();

    scrollElement.addEventListener('scroll', scheduleScrollFadeUpdate, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      scheduleScrollFadeUpdate();
    });

    resizeObserver.observe(scrollElement);

    window.addEventListener('resize', scheduleScrollFadeUpdate);

    return () => {
      if (pendingFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingFrameRef.current);
        pendingFrameRef.current = null;
      }

      scrollElement.removeEventListener('scroll', scheduleScrollFadeUpdate);
      window.removeEventListener('resize', scheduleScrollFadeUpdate);
      resizeObserver.disconnect();
    };
  }, [scheduleScrollFadeUpdate]);

  useEffect(() => {
    scheduleScrollFadeUpdate();
  }, [elements.length, scheduleScrollFadeUpdate, zoomPercent]);

  const zoomScale = zoomPercent / 100;
  const isZoomMin = zoomPercent <= INTERNAL_ZOOM_MIN_PERCENT;
  const isZoomMax = zoomPercent >= INTERNAL_ZOOM_MAX_PERCENT;

  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-4">
      <div ref={fadeRef} className="scroll-fade-x relative">
        <div className="pointer-events-none absolute right-2 top-2 z-20">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/92 px-2 py-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={decreaseZoom}
              disabled={isZoomMin}
              aria-label="Reduce table zoom"
              className="rounded border border-[var(--border-subtle)] px-1.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              -
            </button>
            <span className="min-w-11 text-center text-[10px] font-semibold text-[var(--text-strong)]">
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={increaseZoom}
              disabled={isZoomMax}
              aria-label="Increase table zoom"
              className="rounded border border-[var(--border-subtle)] px-1.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              +
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="classic-scroll overflow-x-auto pb-2 pt-11">
          <div
            className="classic-scroll-safe mx-auto grid w-max [--classic-size:calc(92px*var(--classic-scale))] lg:[--classic-size:calc(var(--classic-size-desktop)*var(--classic-scale))]"
            style={
              {
                '--classic-scale': zoomScale.toString(),
                gridTemplateColumns: 'repeat(18, var(--classic-size))',
                gridTemplateRows: 'repeat(10, var(--classic-size))',
                gap: 'clamp(2px, calc(var(--classic-size) * 0.095), 10px)',
              } as CSSProperties
            }
          >
            {elements.map((element) => (
              <div
                key={element.symbol}
                style={{
                  gridColumn: element.xpos,
                  gridRow: element.ypos,
                }}
                className="tile-enter"
              >
                <ElementTile element={element} density="compact" mode="classic" onOpen={onElementOpen} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Classic layout by periodic position (group x period), including lanthanides and actinides on lower rows.
      </p>
    </section>
  );
}

export default memo(ClassicPeriodicView);
