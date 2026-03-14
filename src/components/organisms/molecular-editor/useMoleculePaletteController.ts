'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, resolveElementQueryRank } from '@/shared/utils/elementPresentation';

const DRAG_THRESHOLD_PX = 6;
const PALETTE_GESTURE_STEP_MIN = 18;
const PALETTE_GESTURE_STEP_MAX = 32;
const PALETTE_GESTURE_STEP_RATIO = 0.58;
const PALETTE_MOMENTUM_DECAY = 0.9;
const PALETTE_MOMENTUM_MIN_SPEED = 0.08;
const PALETTE_MOMENTUM_IDLE_RELEASE_MS = 90;
const PALETTE_TILE_LONG_PRESS_MS = 260;

type UseMoleculePaletteControllerOptions = {
  elements: ChemicalElement[];
};

export default function useMoleculePaletteController({ elements }: UseMoleculePaletteControllerOptions) {
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isPaletteSearchExpanded, setIsPaletteSearchExpanded] = useState(false);
  const [centerPaletteIndex, setCenterPaletteIndex] = useState(0);
  const [expandedPaletteIndex, setExpandedPaletteIndex] = useState(0);
  const [isPaletteMoving, setIsPaletteMoving] = useState(false);
  const [isPalettePointerActive, setIsPalettePointerActive] = useState(false);
  const [paletteEdgePadding, setPaletteEdgePadding] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const paletteViewportRef = useRef<HTMLDivElement | null>(null);
  const paletteItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const centerPaletteIndexRef = useRef(0);
  const paletteSearchRailRef = useRef<HTMLDivElement | null>(null);
  const paletteInteractionRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startScrollLeft: 0,
    startedAt: 0,
    lastClientX: 0,
    lastTimestamp: 0,
    velocity: 0,
    moved: false,
    pressedIndex: null as number | null,
  });
  const paletteMomentumFrameRef = useRef<number | null>(null);
  const paletteSnapTimeoutRef = useRef<number | null>(null);
  const paletteSettleTimeoutRef = useRef<number | null>(null);
  const paletteSearchFocusTimeoutRef = useRef<number | null>(null);

  const filteredElements = useMemo(() => {
    const normalizedQuery = paletteQuery.trim();

    if (normalizedQuery.length === 0) {
      return elements;
    }

    return elements
      .filter((element) => matchesElementQuery(element, normalizedQuery))
      .sort((first, second) => {
        const firstRank = resolveElementQueryRank(first, normalizedQuery);
        const secondRank = resolveElementQueryRank(second, normalizedQuery);

        if (firstRank !== secondRank) {
          return firstRank - secondRank;
        }

        return first.number - second.number;
      });
  }, [elements, paletteQuery]);

  const resolvedExpandedPaletteIndex =
    filteredElements.length === 0 ? 0 : Math.min(expandedPaletteIndex, filteredElements.length - 1);
  const resolvedCenterPaletteIndex =
    filteredElements.length === 0 ? 0 : Math.min(centerPaletteIndex, filteredElements.length - 1);
  const activeElement = filteredElements[resolvedExpandedPaletteIndex] ?? null;
  const hasActivePaletteFilter = paletteQuery.trim().length > 0;
  const isPaletteSearchOpen = isPaletteSearchExpanded;

  const syncCenterPaletteIndex = useCallback((index: number) => {
    centerPaletteIndexRef.current = index;
    setCenterPaletteIndex((currentIndex) => (currentIndex === index ? currentIndex : index));
  }, []);

  const resetPaletteSearchViewport = useCallback(() => {
    setExpandedPaletteIndex(0);
    syncCenterPaletteIndex(0);
    setIsPaletteMoving(false);
    setIsPalettePointerActive(false);
  }, [syncCenterPaletteIndex]);

  const onPaletteSearchChange = useCallback(
    (nextQuery: string) => {
      setPaletteQuery(nextQuery);
      resetPaletteSearchViewport();
    },
    [resetPaletteSearchViewport],
  );

  const onClearPaletteSearch = useCallback(() => {
    setPaletteQuery('');
    resetPaletteSearchViewport();
  }, [resetPaletteSearchViewport]);

  const onClosePaletteSearch = useCallback(() => {
    setIsPaletteSearchExpanded(false);
  }, []);

  const onTogglePaletteSearch = useCallback(() => {
    setIsPaletteSearchExpanded((current) => !current);
  }, []);

  const clampPaletteIndex = useCallback(
    (index: number) => {
      if (filteredElements.length === 0) {
        return 0;
      }

      return Math.max(0, Math.min(filteredElements.length - 1, index));
    },
    [filteredElements.length],
  );

  const resolvePaletteGestureStep = useCallback(() => {
    const currentButton =
      paletteItemRefs.current[centerPaletteIndexRef.current] ?? paletteItemRefs.current[resolvedExpandedPaletteIndex];
    const baseWidth = currentButton?.clientWidth ?? 40;

    return Math.max(
      PALETTE_GESTURE_STEP_MIN,
      Math.min(PALETTE_GESTURE_STEP_MAX, Math.round(baseWidth * PALETTE_GESTURE_STEP_RATIO)),
    );
  }, [resolvedExpandedPaletteIndex]);

  const centerPaletteElement = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const viewport = paletteViewportRef.current;
    const elementButton = paletteItemRefs.current[index];

    if (viewport === null || elementButton === null) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const buttonRect = elementButton.getBoundingClientRect();
    const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
    const nextScrollLeft = Math.max(0, buttonCenter - viewport.clientWidth / 2);

    if (behavior === 'auto') {
      viewport.scrollLeft = nextScrollLeft;
      return;
    }

    viewport.scrollTo({
      left: nextScrollLeft,
      behavior,
    });
  }, []);

  const resolveNearestPaletteIndex = useCallback(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null || filteredElements.length === 0) {
      return 0;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < filteredElements.length; index += 1) {
      const elementButton = paletteItemRefs.current[index];

      if (elementButton === null || elementButton === undefined) {
        continue;
      }

      const buttonRect = elementButton.getBoundingClientRect();
      const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
      const distance = Math.abs(buttonCenter - center);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return nearestIndex;
  }, [filteredElements.length]);

  const cancelPaletteMomentum = useCallback(() => {
    if (paletteMomentumFrameRef.current !== null) {
      cancelAnimationFrame(paletteMomentumFrameRef.current);
      paletteMomentumFrameRef.current = null;
    }

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
      paletteSnapTimeoutRef.current = null;
    }

    if (paletteSettleTimeoutRef.current !== null) {
      window.clearTimeout(paletteSettleTimeoutRef.current);
      paletteSettleTimeoutRef.current = null;
    }
  }, []);

  const settlePaletteSelection = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      cancelPaletteMomentum();
      syncCenterPaletteIndex(index);
      centerPaletteElement(index, behavior);

      const finalizeSelection = () => {
        setExpandedPaletteIndex(index);
        setIsPaletteMoving(false);
      };

      if (behavior === 'auto') {
        finalizeSelection();
        return;
      }

      paletteSettleTimeoutRef.current = window.setTimeout(finalizeSelection, 140);
    },
    [cancelPaletteMomentum, centerPaletteElement, syncCenterPaletteIndex],
  );

  const goToPreviousPaletteElement = useCallback(() => {
    if (filteredElements.length === 0) {
      return;
    }

    const currentIndex = clampPaletteIndex(centerPaletteIndexRef.current);
    const nextIndex = currentIndex === 0 ? filteredElements.length - 1 : currentIndex - 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [clampPaletteIndex, filteredElements.length, settlePaletteSelection]);

  const goToNextPaletteElement = useCallback(() => {
    if (filteredElements.length === 0) {
      return;
    }

    const currentIndex = clampPaletteIndex(centerPaletteIndexRef.current);
    const nextIndex = currentIndex === filteredElements.length - 1 ? 0 : currentIndex + 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [clampPaletteIndex, filteredElements.length, settlePaletteSelection]);

  const snapPaletteToNearest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = resolveNearestPaletteIndex();
      settlePaletteSelection(nextIndex, behavior);
    },
    [resolveNearestPaletteIndex, settlePaletteSelection],
  );

  const settlePaletteToCurrentCenter = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current);
      settlePaletteSelection(nextIndex, behavior);
    },
    [clampPaletteIndex, settlePaletteSelection],
  );

  const startPaletteMomentum = useCallback(
    (initialVelocity: number) => {
      if (filteredElements.length === 0) {
        setIsPaletteMoving(false);
        return;
      }

      let velocity = initialVelocity;
      let carry = 0;

      if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
        settlePaletteToCurrentCenter('auto');
        return;
      }

      cancelPaletteMomentum();
      let lastTimestamp = performance.now();
      const gestureStep = resolvePaletteGestureStep();

      const step = (timestamp: number) => {
        const deltaTime = Math.min(32, Math.max(8, timestamp - lastTimestamp));
        lastTimestamp = timestamp;
        carry += velocity * (deltaTime / 16);
        velocity *= Math.pow(PALETTE_MOMENTUM_DECAY, deltaTime / 16);

        const stepCount = Math.floor(Math.abs(carry) / gestureStep);

        if (stepCount > 0) {
          const stepDirection = carry < 0 ? -1 : 1;
          const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current + stepDirection * stepCount);

          if (nextIndex !== centerPaletteIndexRef.current) {
            syncCenterPaletteIndex(nextIndex);
            centerPaletteElement(nextIndex, 'auto');
          }

          carry -= Math.sign(carry) * stepCount * gestureStep;
        }

        if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
          cancelPaletteMomentum();
          settlePaletteToCurrentCenter('auto');
          return;
        }

        paletteMomentumFrameRef.current = requestAnimationFrame(step);
      };

      paletteMomentumFrameRef.current = requestAnimationFrame(step);
    },
    [
      cancelPaletteMomentum,
      centerPaletteElement,
      clampPaletteIndex,
      filteredElements.length,
      resolvePaletteGestureStep,
      settlePaletteToCurrentCenter,
      syncCenterPaletteIndex,
    ],
  );

  const onPaletteScroll = useCallback(() => {
    if (isPalettePointerActive || isPaletteMoving) {
      return;
    }

    const nextIndex = resolveNearestPaletteIndex();
    syncCenterPaletteIndex(nextIndex);

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
    }

    paletteSnapTimeoutRef.current = window.setTimeout(() => {
      snapPaletteToNearest();
    }, 120);
  }, [isPaletteMoving, isPalettePointerActive, resolveNearestPaletteIndex, snapPaletteToNearest, syncCenterPaletteIndex]);

  const onPalettePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const viewport = paletteViewportRef.current;

      if (viewport === null) {
        return;
      }

      event.preventDefault();
      cancelPaletteMomentum();
      setIsPaletteMoving(true);
      setIsPalettePointerActive(true);
      viewport.setPointerCapture(event.pointerId);
      const pressedIndexAttr =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-palette-index]')?.dataset.paletteIndex : undefined;
      const pressedIndex = pressedIndexAttr === undefined ? null : Number.parseInt(pressedIndexAttr, 10);
      paletteInteractionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startScrollLeft: viewport.scrollLeft,
        startedAt: performance.now(),
        lastClientX: event.clientX,
        lastTimestamp: performance.now(),
        velocity: 0,
        moved: false,
        pressedIndex: Number.isNaN(pressedIndex ?? Number.NaN) ? null : pressedIndex,
      };
    },
    [cancelPaletteMomentum],
  );

  const onPalettePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;
      const interaction = paletteInteractionRef.current;

      if (viewport === null || interaction.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - interaction.startClientX;
      const distance = Math.abs(deltaX);

      if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
        return;
      }

      event.preventDefault();
      setIsPaletteMoving(true);
      const now = performance.now();
      const deltaTime = Math.max(8, now - interaction.lastTimestamp);
      const instantaneousVelocity = -(event.clientX - interaction.lastClientX) / Math.max(0.5, deltaTime / 16);
      const gestureStep = resolvePaletteGestureStep();
      const stepCount = Math.floor(Math.abs(deltaX) / gestureStep);

      if (stepCount === 0) {
        paletteInteractionRef.current = {
          ...interaction,
          lastClientX: event.clientX,
          lastTimestamp: now,
          velocity: interaction.velocity * 0.7 + instantaneousVelocity * 0.3,
        };
        return;
      }

      const stepDirection = deltaX > 0 ? -1 : 1;
      const previousIndex = centerPaletteIndexRef.current;
      const nextIndex = clampPaletteIndex(previousIndex + stepDirection * stepCount);
      const didAdvance = nextIndex !== previousIndex;

      if (didAdvance) {
        syncCenterPaletteIndex(nextIndex);
        centerPaletteElement(nextIndex, 'auto');
      }

      paletteInteractionRef.current = {
        ...interaction,
        startClientX: interaction.startClientX + Math.sign(deltaX) * gestureStep * stepCount,
        lastClientX: event.clientX,
        lastTimestamp: now,
        velocity: interaction.velocity * 0.64 + instantaneousVelocity * 0.36,
        moved: didAdvance || interaction.moved,
      };
    },
    [centerPaletteElement, clampPaletteIndex, resolvePaletteGestureStep, syncCenterPaletteIndex],
  );

  const onPalettePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;
      const interaction = paletteInteractionRef.current;

      if (viewport === null || interaction.pointerId !== event.pointerId) {
        return;
      }

      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      setIsPalettePointerActive(false);
      const releaseTimestamp = performance.now();
      const timeSinceLastMove = releaseTimestamp - interaction.lastTimestamp;
      const shouldCarryMomentum = timeSinceLastMove <= PALETTE_MOMENTUM_IDLE_RELEASE_MS;
      const pressedTileIndex = interaction.pressedIndex;
      const wasShortTilePress =
        pressedTileIndex !== null && releaseTimestamp - interaction.startedAt < PALETTE_TILE_LONG_PRESS_MS;
      paletteInteractionRef.current = {
        pointerId: -1,
        startClientX: 0,
        startScrollLeft: 0,
        startedAt: 0,
        lastClientX: 0,
        lastTimestamp: 0,
        velocity: 0,
        moved: false,
        pressedIndex: null,
      };

      if (interaction.moved) {
        const releaseVelocity = shouldCarryMomentum ? interaction.velocity : 0;

        if (Math.abs(releaseVelocity) < PALETTE_MOMENTUM_MIN_SPEED) {
          settlePaletteToCurrentCenter('auto');
        } else {
          startPaletteMomentum(releaseVelocity);
        }

        return;
      }

      setIsPaletteMoving(false);

      if (pressedTileIndex !== null && wasShortTilePress) {
        settlePaletteSelection(pressedTileIndex, 'smooth');
        return;
      }

      settlePaletteToCurrentCenter('auto');
    },
    [settlePaletteSelection, settlePaletteToCurrentCenter, startPaletteMomentum],
  );

  const onPalettePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;

      if (viewport !== null && viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      setIsPalettePointerActive(false);
      paletteInteractionRef.current = {
        pointerId: -1,
        startClientX: 0,
        startScrollLeft: 0,
        startedAt: 0,
        lastClientX: 0,
        lastTimestamp: 0,
        velocity: 0,
        moved: false,
        pressedIndex: null,
      };
      setIsPaletteMoving(false);
      settlePaletteToCurrentCenter('auto');
    },
    [settlePaletteToCurrentCenter],
  );

  useEffect(() => {
    if (paletteSearchFocusTimeoutRef.current !== null) {
      window.clearTimeout(paletteSearchFocusTimeoutRef.current);
      paletteSearchFocusTimeoutRef.current = null;
    }

    if (!isPaletteSearchOpen || searchInputRef.current === null) {
      return;
    }

    paletteSearchFocusTimeoutRef.current = window.setTimeout(() => {
      searchInputRef.current?.focus();
      paletteSearchFocusTimeoutRef.current = null;
    }, 160);

    return () => {
      if (paletteSearchFocusTimeoutRef.current !== null) {
        window.clearTimeout(paletteSearchFocusTimeoutRef.current);
        paletteSearchFocusTimeoutRef.current = null;
      }
    };
  }, [isPaletteSearchOpen]);

  useEffect(() => {
    if (!isPaletteSearchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const searchRailElement = paletteSearchRailRef.current;

      if (searchRailElement === null || searchRailElement.contains(event.target as Node)) {
        return;
      }

      setIsPaletteSearchExpanded(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isPaletteSearchOpen]);

  useEffect(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null) {
      return;
    }

    let frameId = 0;
    const updatePadding = () => {
      const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];
      const selectedWidth = selectedButton?.clientWidth ?? 0;
      const nextPadding = Math.max(0, Math.round(viewport.clientWidth / 2 - selectedWidth / 2));

      setPaletteEdgePadding((currentPadding) => (currentPadding === nextPadding ? currentPadding : nextPadding));
    };

    frameId = window.requestAnimationFrame(updatePadding);
    const resizeObserver = new ResizeObserver(() => {
      updatePadding();
    });

    resizeObserver.observe(viewport);
    const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];

    if (selectedButton !== null && selectedButton !== undefined) {
      resizeObserver.observe(selectedButton);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [filteredElements.length, resolvedExpandedPaletteIndex]);

  useEffect(() => {
    return () => {
      cancelPaletteMomentum();
    };
  }, [cancelPaletteMomentum]);

  useEffect(() => {
    centerPaletteIndexRef.current = resolvedCenterPaletteIndex;
  }, [resolvedCenterPaletteIndex]);

  useEffect(() => {
    if (isPaletteMoving) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      syncCenterPaletteIndex(resolvedExpandedPaletteIndex);
      centerPaletteElement(resolvedExpandedPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, filteredElements, isPaletteMoving, paletteEdgePadding, resolvedExpandedPaletteIndex, syncCenterPaletteIndex]);

  useEffect(() => {
    if (!isPaletteMoving && !isPalettePointerActive) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      centerPaletteElement(resolvedCenterPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, isPaletteMoving, isPalettePointerActive, resolvedCenterPaletteIndex]);

  const onPaletteItemRef = useCallback((index: number, node: HTMLButtonElement | null) => {
    paletteItemRefs.current[index] = node;
  }, []);

  return {
    activeElement,
    filteredElements,
    goToNextPaletteElement,
    goToPreviousPaletteElement,
    hasActivePaletteFilter,
    isPaletteMoving,
    isPalettePointerActive,
    isPaletteSearchOpen,
    onClearPaletteSearch,
    onClosePaletteSearch,
    onPaletteItemRef,
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
    onPaletteSearchChange,
    onTogglePaletteSearch,
    paletteEdgePadding,
    paletteQuery,
    paletteSearchRailRef,
    paletteViewportRef,
    resolvedCenterPaletteIndex,
    resolvedExpandedPaletteIndex,
    searchInputRef,
  };
}
