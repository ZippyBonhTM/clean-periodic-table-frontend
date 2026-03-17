'use client';

import { useCallback, useRef, useState } from 'react';

import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import { createChemicalEngineReactionAnalyzer } from '@/shared/api/chemicalEngineApi';
import { analyzeChemicalEquationText } from '@/shared/chemistry/analysis';
import type { AnalyzeBalancedReactionOptions } from '@/shared/chemistry/rules';

type UseChemistryBalanceRemoteAnalysisOptions = {
  token: string | null;
  rules?: AnalyzeBalancedReactionOptions;
};

const BALANCE_FLOW_OPTIONS = {
  format: {
    includePhase: true,
    hideCoefficientOne: true,
  },
} as const;

function buildUnknownRemoteFailure(
  input: string,
  error: unknown,
): Extract<ChemistryBalanceRemoteAnalysisState, { status: 'failed' }> {
  return {
    status: 'failed',
    input,
    error:
      error instanceof Error && error.message.trim().length > 0
        ? {
            ok: false,
            code: 'unknown-error',
            message: error.message,
          }
        : {
            ok: false,
            code: 'unknown-error',
            message: 'The optional chemical engine failed unexpectedly.',
          },
  };
}

export default function useChemistryBalanceRemoteAnalysis({
  token,
  rules,
}: UseChemistryBalanceRemoteAnalysisOptions) {
  const [state, setState] = useState<ChemistryBalanceRemoteAnalysisState>({
    status: 'idle',
  });
  const requestIdRef = useRef(0);

  const resetRemoteAnalysis = useCallback(() => {
    requestIdRef.current += 1;
    setState({ status: 'idle' });
  }, []);

  const runRemoteAnalysis = useCallback(
    async (input: string) => {
      const trimmedInput = input.trim();

      if (trimmedInput.length === 0) {
        resetRemoteAnalysis();
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setState({
        status: 'loading',
        input: trimmedInput,
      });

      try {
        const result = await analyzeChemicalEquationText(trimmedInput, {
          balance: BALANCE_FLOW_OPTIONS,
          rules,
          engineAnalyzer: createChemicalEngineReactionAnalyzer({
            token,
          }),
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!result.ok || result.value.engine.status === 'skipped') {
          setState({ status: 'idle' });
          return;
        }

        if (result.value.engine.status === 'available') {
          setState({
            status: 'available',
            input: trimmedInput,
            value: result.value.engine.value,
          });
          return;
        }

        setState({
          status: 'failed',
          input: trimmedInput,
          error: result.value.engine.error,
        });
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setState(buildUnknownRemoteFailure(trimmedInput, error));
      }
    },
    [resetRemoteAnalysis, rules, token],
  );

  return {
    remoteAnalysis: state,
    runRemoteAnalysis,
    resetRemoteAnalysis,
  };
}
