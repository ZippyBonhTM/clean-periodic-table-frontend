import { chemistryBalanceText } from '@/components/templates/chemistryBalanceText';
import type { BalanceChemicalEquationFlowResult } from '@/shared/chemistry/analysis';
import type {
  EquationBalanceHistoryEntry,
  EquationBalanceHistoryStatus,
} from '@/components/templates/equationBalanceHistory.types';

const EQUATION_BALANCE_HISTORY_KEY = 'chemistry-equation-balance-history-v1';
const MAX_EQUATION_HISTORY_ITEMS = 8;

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

export function readEquationBalanceHistory(): EquationBalanceHistoryEntry[] {
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

export function writeEquationBalanceHistory(entries: EquationBalanceHistoryEntry[]): void {
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

export function buildEquationBalanceHistoryEntry(
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
    summary: result.issues[0]?.message ?? chemistryBalanceText.history.localFailureSummary,
    savedAt: new Date().toISOString(),
  };
}

export function upsertEquationBalanceHistoryEntry(
  entries: EquationBalanceHistoryEntry[],
  nextEntry: EquationBalanceHistoryEntry,
): EquationBalanceHistoryEntry[] {
  return [nextEntry, ...entries.filter((entry) => entry.input !== nextEntry.input)].slice(
    0,
    MAX_EQUATION_HISTORY_ITEMS,
  );
}
