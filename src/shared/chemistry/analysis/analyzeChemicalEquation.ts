import { balanceChemicalEquationText } from '@/shared/chemistry/analysis/balanceChemicalEquation';
import type {
  AnalyzeChemicalEquationFlowOptions,
  AnalyzeChemicalEquationFlowResult,
} from '@/shared/chemistry/analysis/analyzeChemicalEquation.types';
import { analyzeBalancedReaction } from '@/shared/chemistry/rules';

function mapUnknownEngineError(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return {
      ok: false as const,
      code: 'unknown-error' as const,
      message: error.message,
    };
  }

  return {
    ok: false as const,
    code: 'unknown-error' as const,
    message: 'The optional chemical engine failed unexpectedly.',
  };
}

export async function analyzeChemicalEquationText(
  input: string,
  options: AnalyzeChemicalEquationFlowOptions = {},
): Promise<AnalyzeChemicalEquationFlowResult> {
  const balanceResult = balanceChemicalEquationText(input, options.balance);

  if (!balanceResult.ok) {
    return balanceResult;
  }

  const localAnalysis = analyzeBalancedReaction(
    balanceResult.value.balancedReaction,
    options.rules,
  );

  if (!options.engineAnalyzer) {
    return {
      ok: true,
      value: {
        balance: balanceResult.value,
        localAnalysis,
        engine: {
          status: 'skipped',
        },
      },
      warnings: balanceResult.warnings,
    };
  }

  try {
    const engineResult = await options.engineAnalyzer({
      input,
      reaction: balanceResult.value.reaction,
      balancedReaction: balanceResult.value.balancedReaction,
      formatted: balanceResult.value.formatted,
    });

    return {
      ok: true,
      value: {
        balance: balanceResult.value,
        localAnalysis,
        engine: engineResult.ok
          ? {
              status: 'available',
              value: engineResult.value,
            }
          : {
              status: 'failed',
              error: engineResult,
            },
      },
      warnings: balanceResult.warnings,
    };
  } catch (error: unknown) {
    return {
      ok: true,
      value: {
        balance: balanceResult.value,
        localAnalysis,
        engine: {
          status: 'failed',
          error: mapUnknownEngineError(error),
        },
      },
      warnings: balanceResult.warnings,
    };
  }
}
