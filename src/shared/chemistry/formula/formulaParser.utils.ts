import type { ParseChemicalFormulaOptions } from '@/shared/chemistry/formula/formulaParser.types';
import type {
  ChemicalFormulaElementCount,
  FormulaParseIssue,
} from '@/shared/chemistry/formula/formula.types';
import type { ResolvedParseChemicalFormulaOptions } from '@/shared/chemistry/formula/formulaParser.internal.types';

export function buildFormulaParseIssue(
  code: FormulaParseIssue['code'],
  message: string,
  start: number,
  end: number,
): FormulaParseIssue {
  return { code, message, start, end };
}

export function readFormulaNumber(
  source: string,
  startIndex: number,
): { value: number | null; nextIndex: number } {
  let index = startIndex;

  while (index < source.length && /\d/.test(source[index])) {
    index += 1;
  }

  if (index === startIndex) {
    return { value: null, nextIndex: startIndex };
  }

  return {
    value: Number(source.slice(startIndex, index)),
    nextIndex: index,
  };
}

export function mergeFormulaCounts(
  target: Map<string, number>,
  source: Map<string, number>,
  multiplier = 1,
): void {
  source.forEach((count, symbol) => {
    target.set(symbol, (target.get(symbol) ?? 0) + count * multiplier);
  });
}

export function splitFormulaHydrateSegments(source: string): { segments: string[]; usesHydrateDot: boolean } {
  const segments = source.split(/[·.]/);
  return {
    segments,
    usesHydrateDot: segments.length > 1,
  };
}

export function toSortedFormulaElementCounts(
  counts: Map<string, number>,
): ChemicalFormulaElementCount[] {
  return Array.from(counts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol));
}

export function resolveFormulaParserOptions(
  options: ParseChemicalFormulaOptions = {},
): ResolvedParseChemicalFormulaOptions {
  return {
    allowCharge: options.allowCharge ?? true,
    allowHydrateDot: options.allowHydrateDot ?? true,
    allowGroupedFormula: options.allowGroupedFormula ?? true,
  };
}
