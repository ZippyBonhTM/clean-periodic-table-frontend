import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChemicalEngineReactionAnalyzer } from '@/shared/api/chemicalEngineApi';

const sampleInput = {
  input: 'H2 + O2 -> H2O',
  formatted: '2H2 + O2 -> 2H2O',
  reaction: {
    raw: 'H2 + O2 -> H2O',
    normalized: 'H2 + O2 -> H2O',
    arrow: '->' as const,
    reactants: [],
    products: [],
    elementSymbols: ['H', 'O'],
  },
  balancedReaction: {
    raw: 'H2 + O2 -> H2O',
    normalized: 'H2 + O2 -> H2O',
    arrow: '->' as const,
    reactants: [],
    products: [],
    elementSymbols: ['H', 'O'],
    coefficientVector: [2, 1, 2],
    wasNormalized: true,
  },
};

describe('createChemicalEngineReactionAnalyzer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a valid backend response into an available engine result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          valid: true,
          classification: 'combustion',
          score: 98,
          notices: [],
        }),
      })),
    );

    const analyzer = createChemicalEngineReactionAnalyzer();
    const result = await analyzer(sampleInput);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.classification).toBe('combustion');
    expect(result.value.score).toBe(98);
  });

  it('returns invalid-response when the backend payload shape is not usable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          classification: ['invalid'],
        }),
      })),
    );

    const analyzer = createChemicalEngineReactionAnalyzer();
    const result = await analyzer(sampleInput);

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.code).toBe('invalid-response');
  });

  it('maps transport failures into a non-blocking engine error result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('connect ECONNREFUSED');
      }),
    );

    const analyzer = createChemicalEngineReactionAnalyzer();
    const result = await analyzer(sampleInput);

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.code).toBe('network-error');
  });
});
