'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, sortElements } from '@/shared/utils/elementPresentation';

import { type PeriodicViewMode, type SortMode } from './periodicTable.types';

type UsePeriodicTableElementsParams = {
  elements: ChemicalElement[];
  isExploreMode: boolean;
  activeViewMode: PeriodicViewMode;
};

export default function usePeriodicTableElements({
  elements,
  isExploreMode,
  activeViewMode,
}: UsePeriodicTableElementsParams) {
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [query, setQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<ChemicalElement | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filteredElements = useMemo(() => {
    if (!isExploreMode) {
      return elements;
    }

    return elements.filter((element) => matchesElementQuery(element, deferredQuery));
  }, [deferredQuery, elements, isExploreMode]);

  const sortedElements = useMemo(() => {
    if (!isExploreMode) {
      return elements;
    }

    return sortElements(filteredElements, sortMode);
  }, [elements, filteredElements, isExploreMode, sortMode]);

  const visibleElements = useMemo(() => {
    if (activeViewMode === 'classic') {
      return filteredElements;
    }

    return sortedElements;
  }, [activeViewMode, filteredElements, sortedElements]);

  const onClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const openElementModal = useCallback((element: ChemicalElement) => {
    setSelectedElement(element);
  }, []);

  const closeElementModal = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const onLuckySearch = useCallback(() => {
    if (elements.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * elements.length);
    const randomElement = elements[randomIndex];

    setQuery(randomElement.name);
    setSelectedElement(randomElement);
  }, [elements]);

  const selectedElementIndex = useMemo(() => {
    if (selectedElement === null) {
      return -1;
    }

    return visibleElements.findIndex((element) => element.symbol === selectedElement.symbol);
  }, [selectedElement, visibleElements]);

  const hasPreviousElement = selectedElementIndex > 0;
  const hasNextElement =
    selectedElementIndex >= 0 && selectedElementIndex < visibleElements.length - 1;

  const openPreviousElement = useCallback(() => {
    if (!hasPreviousElement) {
      return;
    }

    const previousElement = visibleElements[selectedElementIndex - 1];

    if (previousElement !== undefined) {
      setSelectedElement(previousElement);
    }
  }, [hasPreviousElement, selectedElementIndex, visibleElements]);

  const openNextElement = useCallback(() => {
    if (!hasNextElement) {
      return;
    }

    const nextElement = visibleElements[selectedElementIndex + 1];

    if (nextElement !== undefined) {
      setSelectedElement(nextElement);
    }
  }, [hasNextElement, selectedElementIndex, visibleElements]);

  return {
    sortMode,
    setSortMode,
    query,
    setQuery,
    deferredQuery,
    visibleElements,
    selectedElement,
    onClearQuery,
    onLuckySearch,
    openElementModal,
    closeElementModal,
    hasPreviousElement,
    hasNextElement,
    openPreviousElement,
    openNextElement,
  };
}
