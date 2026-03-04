'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

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
  const [scrollFadeState, setScrollFadeState] = useState<ScrollFadeState>({
    hasOverflow: false,
    showLeftFade: false,
    showRightFade: false,
  });

  const updateScrollFade = useCallback(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement === null) {
      return;
    }

    const hasOverflow = scrollElement.scrollWidth > scrollElement.clientWidth + 1;

    if (!hasOverflow) {
      setScrollFadeState({
        hasOverflow: false,
        showLeftFade: false,
        showRightFade: false,
      });
      return;
    }

    const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
    const showLeftFade = scrollElement.scrollLeft > 1;
    const showRightFade = scrollElement.scrollLeft < maxScrollLeft - 1;

    setScrollFadeState({
      hasOverflow: true,
      showLeftFade,
      showRightFade,
    });
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement === null) {
      return;
    }

    const initialFrame = window.requestAnimationFrame(() => {
      updateScrollFade();
    });

    scrollElement.addEventListener('scroll', updateScrollFade, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollFade();
    });

    resizeObserver.observe(scrollElement);

    window.addEventListener('resize', updateScrollFade);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      scrollElement.removeEventListener('scroll', updateScrollFade);
      window.removeEventListener('resize', updateScrollFade);
      resizeObserver.disconnect();
    };
  }, [updateScrollFade]);

  const fadeClassName = [
    'scroll-fade-x',
    scrollFadeState.hasOverflow ? 'is-overflow' : '',
    scrollFadeState.showLeftFade ? 'show-left' : '',
    scrollFadeState.showRightFade ? 'show-right' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3 md:p-4">
      <div className={fadeClassName}>
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
