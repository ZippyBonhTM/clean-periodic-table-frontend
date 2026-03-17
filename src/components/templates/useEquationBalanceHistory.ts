'use client';

import { useCallback, useEffect, useReducer } from 'react';

import type { BalanceChemicalEquationFlowResult, BalanceChemicalEquationStage } from '@/shared/chemistry/analysis';

const EQUATION_BALANCE_HISTORY_KEY = 'chemistry-equation-balance-history-v1';
const MAX_EQUATION_HISTORY_ITEMS = 8;

type EquationBalanceHistoryStatus = 'balanced' | BalanceChemicalEquationStage;

export type EquationBalanceHistoryEntry = {
  input: string;
  status: EquationBalanceHistoryStatus;
  summary: string;
  savedAt: string;
};

function isValidHistoryStatus(value: unknown): value is EquationBalanceHistoryStatus {
  return (
    value === 'balanced' ||
    value === 'equation-parse' ||
    value === 'reaction-create' ||
    value === 'reaction-balance'
  );
}

function isHistoryEntry(value: unknown): value is EquationBalanceHistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<EquationBalanceHistoryEntry>;

  return (
    typeof candidate.input === 'string' &&
    candidate.input.trim().length > 0 &&
    isValidHistoryStatus(candidate.status) &&
    typeof candidate.summary === 'string' &&
    typeof candidate.savedAt === 'string'
  );
}

function readHistory(): EquationBalanceHistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(EQUATION_BALANCE_HISTORY_KEY);

    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHistoryEntry).slice(0, MAX_EQUATION_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function writeHistory(entries: EquationBalanceHistoryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (entries.length === 0) {
    window.localStorage.removeItem(EQUATION_BALANCE_HISTORY_KEY);
    return;
  }

  window.localStorage.setItem(
    EQUATION_BALANCE_HISTORY_KEY,
    JSON.stringify(entries.slice(0, MAX_EQUATION_HISTORY_ITEMS)),
  );
}

function buildHistoryEntry(
  input: string,
  result: BalanceChemicalEquationFlowResult,
): EquationBalanceHistoryEntry | null {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return null;
  }

  if (result.ok) {
    return {
      input: trimmedInput,
      status: 'balanced',
      summary: result.value.formatted,
      savedAt: new Date().toISOString(),
    };
  }

  return {
    input: trimmedInput,
    status: result.stage,
    summary: result.issues[0]?.message ?? 'The equation could not be balanced locally.',
    savedAt: new Date().toISOString(),
  };
}

function upsertHistoryEntry(
  entries: EquationBalanceHistoryEntry[],
  nextEntry: EquationBalanceHistoryEntry,
): EquationBalanceHistoryEntry[] {
  return [nextEntry, ...entries.filter((entry) => entry.input !== nextEntry.input)].slice(
    0,
    MAX_EQUATION_HISTORY_ITEMS,
  );
}

type EquationBalanceHistoryAction =
  | {
      type: 'record';
      entry: EquationBalanceHistoryEntry;
    }
  | {
      type: 'clear';
    };

function equationBalanceHistoryReducer(
  entries: EquationBalanceHistoryEntry[],
  action: EquationBalanceHistoryAction,
): EquationBalanceHistoryEntry[] {
  switch (action.type) {
    case 'record':
      return upsertHistoryEntry(entries, action.entry);
    case 'clear':
      return [];
    default:
      return entries;
  }
}

export default function useEquationBalanceHistory(
  submittedEquation: string,
  result: BalanceChemicalEquationFlowResult,
  submissionVersion: number,
) {
  const [entries, dispatch] = useReducer(
    equationBalanceHistoryReducer,
    undefined,
    readHistory,
  );

  useEffect(() => {
    if (submissionVersion === 0) {
      return;
    }

    const nextEntry = buildHistoryEntry(submittedEquation, result);

    if (nextEntry === null) {
      return;
    }

    dispatch({
      type: 'record',
      entry: nextEntry,
    });
  }, [result, submissionVersion, submittedEquation]);

  useEffect(() => {
    writeHistory(entries);
  }, [entries]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  return {
    entries,
    clearHistory,
  };
}
