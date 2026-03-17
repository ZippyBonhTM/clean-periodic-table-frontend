import { describe, expect, it } from 'vitest';

import { balanceChemicalEquationText } from '@/shared/chemistry/analysis';
import { analyzeBalancedReaction } from '@/shared/chemistry/rules';
import type { ReactionRuleElementMetadata } from '@/shared/chemistry/rules';

const elementMetadataBySymbol = new Map<string, ReactionRuleElementMetadata>([
  ['C', { symbol: 'C', group: 14, category: 'polyatomic nonmetal', electronegativity_pauling: 2.55 }],
  ['H', { symbol: 'H', group: 1, category: 'diatomic nonmetal', electronegativity_pauling: 2.2 }],
  ['O', { symbol: 'O', group: 16, category: 'diatomic nonmetal', electronegativity_pauling: 3.44 }],
  ['Na', { symbol: 'Na', group: 1, category: 'alkali metal', electronegativity_pauling: 0.93 }],
  ['Cl', { symbol: 'Cl', group: 17, category: 'diatomic nonmetal', electronegativity_pauling: 3.16 }],
  ['He', { symbol: 'He', group: 18, category: 'noble gas', electronegativity_pauling: null }],
  ['F', { symbol: 'F', group: 17, category: 'diatomic nonmetal', electronegativity_pauling: 3.98 }],
]);

describe('analyzeBalancedReaction', () => {
  it('identifies combustion-like balanced reactions', () => {
    const result = balanceChemicalEquationText('CH4 + O2 -> CO2 + H2O', {
      format: { includePhase: false },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const analysis = analyzeBalancedReaction(result.value.balancedReaction, {
      elementMetadataBySymbol,
    });

    expect(analysis.reactionType).toBe('combustion-like');
    expect(analysis.score).toBeGreaterThanOrEqual(100);
    expect(analysis.likelyPlausible).toBe(true);
  });

  it('recognizes explicit charge balance in ionic reactions', () => {
    const result = balanceChemicalEquationText('Na+ + Cl- -> NaCl', {
      format: { includePhase: false },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const analysis = analyzeBalancedReaction(result.value.balancedReaction, {
      elementMetadataBySymbol,
    });

    expect(analysis.notices.some((notice) => notice.code === 'charge-balanced')).toBe(true);
    expect(analysis.likelyPlausible).toBe(true);
  });

  it('penalizes noble-gas compounds when metadata is available', () => {
    const result = balanceChemicalEquationText('He + F2 -> HeF2', {
      format: { includePhase: false },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const analysis = analyzeBalancedReaction(result.value.balancedReaction, {
      elementMetadataBySymbol,
    });

    expect(analysis.notices.some((notice) => notice.code === 'noble-gas-compound')).toBe(true);
    expect(analysis.score).toBeLessThan(100);
    expect(analysis.likelyPlausible).toBe(false);
  });
});
