import { describe, expect, it } from 'vitest';

import { parseChemicalFormula } from '@/shared/chemistry/formula';

describe('parseChemicalFormula', () => {
  it('parses grouped molecular formulas', () => {
    const result = parseChemicalFormula('Fe2(SO4)3');

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.notation).toBe('molecular');
    expect(result.value.totalAtomCount).toBe(17);
    expect(result.value.elements).toEqual([
      { symbol: 'Fe', count: 2 },
      { symbol: 'O', count: 12 },
      { symbol: 'S', count: 3 },
    ]);
  });

  it('parses hydrate formulas with middle dot notation', () => {
    const result = parseChemicalFormula('CuSO4·5H2O');

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.notation).toBe('hydrate');
    expect(result.value.elements).toEqual([
      { symbol: 'Cu', count: 1 },
      { symbol: 'H', count: 10 },
      { symbol: 'O', count: 9 },
      { symbol: 'S', count: 1 },
    ]);
  });

  it('parses charged formulas with caret notation', () => {
    const result = parseChemicalFormula('Fe^3+');

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.notation).toBe('ionic');
    expect(result.value.charge).toEqual({ value: 3, sign: '+' });
    expect(result.value.elements).toEqual([{ symbol: 'Fe', count: 1 }]);
  });
});
