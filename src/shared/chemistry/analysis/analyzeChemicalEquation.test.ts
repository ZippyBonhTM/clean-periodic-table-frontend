import { describe, expect, it, vi } from 'vitest';

import { analyzeChemicalEquationText } from '@/shared/chemistry/analysis';

describe('analyzeChemicalEquationText', () => {
  it('returns local analysis even when no engine client is provided', async () => {
    const result = await analyzeChemicalEquationText('CH4 + O2 -> CO2 + H2O', {
      balance: {
        format: { includePhase: false },
      },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.balance.formatted).toBe('CH4 + 2O2 -> CO2 + 2H2O');
    expect(result.value.localAnalysis.reactionType).toBe('combustion-like');
    expect(result.value.engine.status).toBe('skipped');
  });

  it('includes optional engine enrichment when the analyzer succeeds', async () => {
    const engineAnalyzer = vi.fn(async () => ({
      ok: true as const,
      value: {
        valid: true,
        classification: 'combustion',
        score: 98,
        notices: [],
      },
    }));

    const result = await analyzeChemicalEquationText('H2 + O2 -> H2O', {
      balance: {
        format: { includePhase: false },
      },
      engineAnalyzer,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(engineAnalyzer).toHaveBeenCalledTimes(1);
    expect(result.value.engine.status).toBe('available');

    if (result.value.engine.status !== 'available') {
      return;
    }

    expect(result.value.engine.value.classification).toBe('combustion');
    expect(result.value.engine.value.score).toBe(98);
  });

  it('falls back to local-only success when the optional engine returns a failure', async () => {
    const result = await analyzeChemicalEquationText('Na+ + Cl- -> NaCl', {
      balance: {
        format: { includePhase: false },
      },
      engineAnalyzer: async () => ({
        ok: false,
        code: 'unavailable',
        message: 'Chemical engine is offline.',
      }),
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.localAnalysis.likelyPlausible).toBe(true);
    expect(result.value.engine.status).toBe('failed');

    if (result.value.engine.status !== 'failed') {
      return;
    }

    expect(result.value.engine.error.code).toBe('unavailable');
  });
});
