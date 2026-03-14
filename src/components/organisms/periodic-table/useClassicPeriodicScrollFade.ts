'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

type ScrollFadeState = {
  hasOverflow: boolean;
  showLeftFade: boolean;
  showRightFade: boolean;
};

type UseClassicPeriodicScrollFadeParams = {
  scrollRef: RefObject<HTMLDivElement | null>;
  fadeRef: RefObject<HTMLDivElement | null>;
  dependencyKey: number;
};

export default function useClassicPeriodicScrollFade({
  scrollRef,
  fadeRef,
  dependencyKey,
}: UseClassicPeriodicScrollFadeParams) {
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
  }, [fadeRef]);

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
  }, [applyScrollFadeClass, scrollRef]);

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
  }, [scheduleScrollFadeUpdate, scrollRef]);

  useEffect(() => {
    scheduleScrollFadeUpdate();
  }, [dependencyKey, scheduleScrollFadeUpdate]);
}
