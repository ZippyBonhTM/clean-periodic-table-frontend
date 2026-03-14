'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, resolveElementQueryRank } from '@/shared/utils/elementPresentation';

type UseMoleculePaletteSearchOptions = {
  elements: ChemicalElement[];
};

export default function useMoleculePaletteSearch({ elements }: UseMoleculePaletteSearchOptions) {
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isPaletteSearchExpanded, setIsPaletteSearchExpanded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const paletteSearchRailRef = useRef<HTMLDivElement | null>(null);
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

  const hasActivePaletteFilter = paletteQuery.trim().length > 0;
  const isPaletteSearchOpen = isPaletteSearchExpanded;

  const onPaletteSearchChange = useCallback((nextQuery: string) => {
    setPaletteQuery(nextQuery);
  }, []);

  const onClearPaletteSearch = useCallback(() => {
    setPaletteQuery('');
  }, []);

  const onClosePaletteSearch = useCallback(() => {
    setIsPaletteSearchExpanded(false);
  }, []);

  const onTogglePaletteSearch = useCallback(() => {
    setIsPaletteSearchExpanded((current) => !current);
  }, []);

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

  return {
    filteredElements,
    hasActivePaletteFilter,
    isPaletteSearchOpen,
    onClearPaletteSearch,
    onClosePaletteSearch,
    onPaletteSearchChange,
    onTogglePaletteSearch,
    paletteQuery,
    paletteSearchRailRef,
    searchInputRef,
  };
}
