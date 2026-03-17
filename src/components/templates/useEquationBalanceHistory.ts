'use client';

import { useCallback, useEffect, useReducer } from 'react';

import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';
import type { BalanceChemicalEquationFlowResult } from '@/shared/chemistry/analysis';
import { equationBalanceHistoryReducer } from '@/components/templates/equationBalanceHistoryReducer';
import {
  buildEquationBalanceHistoryEntry,
  readEquationBalanceHistory,
  writeEquationBalanceHistory,
} from '@/components/templates/equationBalanceHistoryStorage';
export type { EquationBalanceHistoryEntry } from '@/components/templates/equationBalanceHistory.types';

export default function useEquationBalanceHistory(
  submittedEquation: string,
  result: BalanceChemicalEquationFlowResult,
  submissionVersion: number,
) {
  const { text } = useChemistryBalanceText();
  const [entries, dispatch] = useReducer(
    equationBalanceHistoryReducer,
    undefined,
    readEquationBalanceHistory,
  );

  useEffect(() => {
    if (submissionVersion === 0) {
      return;
    }

    const nextEntry = buildEquationBalanceHistoryEntry(
      submittedEquation,
      result,
      text.history.localFailureSummary,
    );

    if (nextEntry === null) {
      return;
    }

    dispatch({
      type: 'record',
      entry: nextEntry,
    });
  }, [result, submissionVersion, submittedEquation, text.history.localFailureSummary]);

  useEffect(() => {
    writeEquationBalanceHistory(entries);
  }, [entries]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  return {
    entries,
    clearHistory,
  };
}
