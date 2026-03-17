'use client';

import { useCallback, useRef, useState } from 'react';

import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import {
  buildIdleRemoteAnalysisState,
  buildLoadingRemoteAnalysisState,
  buildUnknownRemoteFailure,
  CHEMISTRY_BALANCE_REMOTE_ANALYSIS_OPTIONS,
  resolveRemoteAnalysisStateFromResult,
} from '@/components/templates/chemistryBalanceRemoteAnalysis.utils';
import { createChemicalEngineReactionAnalyzer } from '@/shared/api/chemicalEngineApi';
import { analyzeChemicalEquationText } from '@/shared/chemistry/analysis';
import type { AnalyzeBalancedReactionOptions } from '@/shared/chemistry/rules';

type UseChemistryBalanceRemoteAnalysisOptions = {
  token: string | null;
  rules?: AnalyzeBalancedReactionOptions;
};

export default function useChemistryBalanceRemoteAnalysis({
  token,
  rules,
}: UseChemistryBalanceRemoteAnalysisOptions) {
  const [state, setState] = useState<ChemistryBalanceRemoteAnalysisState>(
    buildIdleRemoteAnalysisState,
  );
  const requestIdRef = useRef(0);

  const resetRemoteAnalysis = useCallback(() => {
    requestIdRef.current += 1;
    setState(buildIdleRemoteAnalysisState());
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
      setState(buildLoadingRemoteAnalysisState(trimmedInput));

      try {
        const result = await analyzeChemicalEquationText(trimmedInput, {
          balance: CHEMISTRY_BALANCE_REMOTE_ANALYSIS_OPTIONS,
          rules,
          engineAnalyzer: createChemicalEngineReactionAnalyzer({
            token,
          }),
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setState(resolveRemoteAnalysisStateFromResult(trimmedInput, result));
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
