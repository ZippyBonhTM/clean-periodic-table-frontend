import { describe, expect, it } from 'vitest';

import { balanceChemicalEquationText } from '@/shared/chemistry/analysis';

describe('balanceChemicalEquationText', () => {
  it('balances water formation end to end', () => {
    const result = balanceChemicalEquationText('H2 + O2 -> H2O', {
      format: { includePhase: false },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.formatted).toBe('2H2 + O2 -> 2H2O');
    expect(result.value.balancedReaction.coefficientVector).toEqual([2, 1, 2]);
  });

  it('balances iron(III) oxide formation end to end', () => {
    const result = balanceChemicalEquationText('Fe + O2 -> Fe2O3', {
      format: { includePhase: false },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.formatted).toBe('4Fe + 3O2 -> 2Fe2O3');
    expect(result.value.balancedReaction.coefficientVector).toEqual([4, 3, 2]);
  });

  it('surfaces equation-parse failures by stage', () => {
    const result = balanceChemicalEquationText('H2 O2 H2O');

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.stage).toBe('equation-parse');
    expect(result.issues[0]?.code).toBe('missing-arrow');
  });
});
