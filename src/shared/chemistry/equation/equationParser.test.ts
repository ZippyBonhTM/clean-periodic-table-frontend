import { describe, expect, it } from 'vitest';

import { parseChemicalEquation } from '@/shared/chemistry/equation';

describe('parseChemicalEquation', () => {
  it('parses coefficients and physical states', () => {
    const result = parseChemicalEquation('2H2(g) + O2(g) -> 2H2O(l)');

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.arrow).toBe('->');
    expect(result.value.reactants).toEqual([
      {
        raw: '2H2(g)',
        normalized: '2H2(g)',
        coefficient: 2,
        formula: 'H2',
        phase: 'g',
      },
      {
        raw: 'O2(g)',
        normalized: 'O2(g)',
        coefficient: null,
        formula: 'O2',
        phase: 'g',
      },
    ]);
    expect(result.value.products).toEqual([
      {
        raw: '2H2O(l)',
        normalized: '2H2O(l)',
        coefficient: 2,
        formula: 'H2O',
        phase: 'l',
      },
    ]);
  });

  it('keeps ionic charge notation inside terms instead of splitting charges as separators', () => {
    const result = parseChemicalEquation('Na+ + Cl- -> NaCl');

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.reactants.map((term) => term.formula)).toEqual(['Na+', 'Cl-']);
    expect(result.value.products.map((term) => term.formula)).toEqual(['NaCl']);
  });

  it('fails when the equation contains more than one arrow', () => {
    const result = parseChemicalEquation('H2 -> O2 -> H2O');

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.issues[0]?.code).toBe('multiple-arrows');
  });
});
