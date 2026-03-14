'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PeriodicViewMode } from './periodicTable.types';

type UsePeriodicTableFullscreenParams = {
  activeViewMode: PeriodicViewMode;
  classicZoomPercent: number;
  onClassicZoomChange: (nextZoomPercent: number) => void;
};

export default function usePeriodicTableFullscreen({
  activeViewMode,
  classicZoomPercent,
  onClassicZoomChange,
}: UsePeriodicTableFullscreenParams) {
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [isSimulatedFullscreen, setIsSimulatedFullscreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const previousZoomRef = useRef<number | null>(null);

  const getClassicFitZoomPercent = useCallback(() => {
    const viewportWidth = Math.max(window.innerWidth - 48, 320);
    const viewportHeight = Math.max(window.innerHeight - 180, 280);

    const classicBaseWidth = 1804;
    const classicBaseHeight = 998;
    const fitScale = Math.min(viewportWidth / classicBaseWidth, viewportHeight / classicBaseHeight);
    const clampedScale = Math.max(0.25, Math.min(1.75, fitScale));
    const snappedPercent = Math.round((clampedScale * 100) / 5) * 5;

    return Math.max(25, Math.min(175, snappedPercent));
  }, []);

  const onToggleTableFullscreen = useCallback(async () => {
    if (isSimulatedFullscreen) {
      setIsSimulatedFullscreen(false);

      if (previousZoomRef.current !== null) {
        onClassicZoomChange(previousZoomRef.current);
        previousZoomRef.current = null;
      }

      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const containerElement = fullscreenContainerRef.current;
    if (containerElement === null) {
      return;
    }

    const hasNativeFullscreenSupport =
      document.fullscreenEnabled !== false &&
      typeof containerElement.requestFullscreen === 'function' &&
      typeof document.exitFullscreen === 'function';
    const isLikelyMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (document.fullscreenElement === containerElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore exit failures and keep current state.
      }
      return;
    }

    if (!hasNativeFullscreenSupport || isLikelyMobile) {
      previousZoomRef.current = classicZoomPercent;
      setIsSimulatedFullscreen(true);

      if (activeViewMode === 'classic') {
        onClassicZoomChange(getClassicFitZoomPercent());
      }

      return;
    }

    previousZoomRef.current = classicZoomPercent;
    try {
      await containerElement.requestFullscreen();
    } catch {
      setIsSimulatedFullscreen(true);

      if (activeViewMode === 'classic') {
        onClassicZoomChange(getClassicFitZoomPercent());
      }
    }
  }, [
    activeViewMode,
    classicZoomPercent,
    getClassicFitZoomPercent,
    isSimulatedFullscreen,
    onClassicZoomChange,
  ]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const onFullscreenChange = () => {
      const containerElement = fullscreenContainerRef.current;
      const isActive = document.fullscreenElement === containerElement;

      setIsTableFullscreen(isActive);
      if (isActive) {
        setIsSimulatedFullscreen(false);
      }

      if (isActive && activeViewMode === 'classic') {
        onClassicZoomChange(getClassicFitZoomPercent());
      }

      if (!isActive && !isSimulatedFullscreen && previousZoomRef.current !== null) {
        onClassicZoomChange(previousZoomRef.current);
        previousZoomRef.current = null;
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [activeViewMode, getClassicFitZoomPercent, isSimulatedFullscreen, onClassicZoomChange]);

  const isFullscreenActive = useMemo(() => {
    return isTableFullscreen || isSimulatedFullscreen;
  }, [isSimulatedFullscreen, isTableFullscreen]);

  return {
    fullscreenContainerRef,
    isFullscreenActive,
    onToggleTableFullscreen,
  };
}
