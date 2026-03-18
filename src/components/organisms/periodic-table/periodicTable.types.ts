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

export const VIEW_OPTIONS: PeriodicViewMode[] = [
  'classic',
  'category',
  'compact',
];

export const SORT_OPTIONS: SortMode[] = [
  'number',
  'name',
  'symbol',
  'mass',
];
