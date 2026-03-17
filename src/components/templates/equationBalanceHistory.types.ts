import type { BalanceChemicalEquationStage } from '@/shared/chemistry/analysis';

export type EquationBalanceHistoryStatus = 'balanced' | BalanceChemicalEquationStage;

export type EquationBalanceHistoryEntry = {
  input: string;
  status: EquationBalanceHistoryStatus;
  summary: string;
  savedAt: string;
};

export type EquationBalanceHistoryAction =
  | {
      type: 'record';
      entry: EquationBalanceHistoryEntry;
    }
  | {
      type: 'clear';
    };
