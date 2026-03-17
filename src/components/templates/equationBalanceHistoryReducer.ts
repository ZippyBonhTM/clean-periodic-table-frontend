import type {
  EquationBalanceHistoryAction,
  EquationBalanceHistoryEntry,
} from '@/components/templates/equationBalanceHistory.types';
import { upsertEquationBalanceHistoryEntry } from '@/components/templates/equationBalanceHistoryStorage';

export function equationBalanceHistoryReducer(
  entries: EquationBalanceHistoryEntry[],
  action: EquationBalanceHistoryAction,
): EquationBalanceHistoryEntry[] {
  switch (action.type) {
    case 'record':
      return upsertEquationBalanceHistoryEntry(entries, action.entry);
    case 'clear':
      return [];
    default:
      return entries;
  }
}
