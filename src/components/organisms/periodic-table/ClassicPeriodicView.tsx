'use client';

import { memo, useCallback, useEffect, useRef } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import type { ChemicalElement } from '@/shared/types/element';

type ClassicPeriodicViewProps = {
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
};

type ScrollFadeState = {
  hasOverflow: boolean;
  showLeftFade: boolean;
  showRightFade: boolean;
};

function ClassicPeriodicView({ elements, onElementOpen }: ClassicPeriodicViewProps) {
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
  }, [elements.length, scheduleScrollFadeUpdate]);

  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3 md:p-4">
      <div ref={fadeRef} className="scroll-fade-x">
        <div ref={scrollRef} className="classic-scroll overflow-x-scroll pb-2">
          <div
            className="classic-scroll-safe mx-auto grid w-max gap-1.5 [--classic-size:92px] lg:[--classic-size:var(--classic-size-desktop)]"
            style={{
              gridTemplateColumns: 'repeat(18, var(--classic-size))',
              gridTemplateRows: 'repeat(10, var(--classic-size))',
            }}
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
