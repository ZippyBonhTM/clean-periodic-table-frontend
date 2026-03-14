export type PeriodicViewMode = 'classic' | 'category' | 'compact';

export type SortMode = 'number' | 'name' | 'symbol' | 'mass';
export type PeriodicTableMode = 'explore' | 'table';

export type FloatingMenuPosition = {
  left: number;
  top: number;
  width: number;
};

export type PeriodicMenuOption = {
  mode: string;
  label: string;
};

export const VIEW_OPTIONS: Array<{ mode: PeriodicViewMode; label: string }> = [
  { mode: 'classic', label: 'Classic' },
  { mode: 'category', label: 'Category' },
  { mode: 'compact', label: 'Compact' },
];

export const SORT_OPTIONS: Array<{ mode: SortMode; label: string }> = [
  { mode: 'number', label: 'Atomic Number' },
  { mode: 'name', label: 'Name' },
  { mode: 'symbol', label: 'Symbol' },
  { mode: 'mass', label: 'Atomic Mass' },
];
