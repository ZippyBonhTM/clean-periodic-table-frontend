'use client';

import { memo, useMemo, useState } from 'react';

import ElementCard from '@/components/molecules/ElementCard';
import type { ChemicalElement } from '@/shared/types/element';

type ElementsGridProps = {
  elements: ChemicalElement[];
};

function ElementsGrid({ elements }: ElementsGridProps) {
  const [query, setQuery] = useState('');

  const filteredElements = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery.length === 0) {
      return elements;
    }

    return elements.filter((element) => {
      return (
        element.name.toLowerCase().includes(trimmedQuery) ||
        element.symbol.toLowerCase().includes(trimmedQuery) ||
        element.category.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [elements, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <label htmlFor="element-query" className="mb-2 block text-sm font-medium text-slate-700">
          Search by name, symbol or category
        </label>
        <input
          id="element-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Hydrogen, H, nonmetal..."
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-shadow focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
        />
        <p className="mt-2 text-xs text-slate-500">{filteredElements.length} elements visible</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredElements.map((element) => (
          <ElementCard key={element.symbol} element={element} />
        ))}
      </div>
    </div>
  );
}

export default memo(ElementsGrid);
