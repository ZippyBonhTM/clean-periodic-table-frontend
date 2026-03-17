import { isKnownChemicalElementSymbol } from '@/shared/chemistry/formula/chemicalElementSymbols';
import type {
  ParseFormulaSegmentResult,
  ResolvedParseChemicalFormulaOptions,
} from '@/shared/chemistry/formula/formulaParser.internal.types';
import {
  buildFormulaParseIssue,
  mergeFormulaCounts,
  readFormulaNumber,
} from '@/shared/chemistry/formula/formulaParser.utils';

export function parseFormulaSegment(
  source: string,
  startIndex: number,
  options: ResolvedParseChemicalFormulaOptions,
  stopAtClosingParenthesis = false,
): ParseFormulaSegmentResult {
  const counts = new Map<string, number>();
  const issues: ParseFormulaSegmentResult['issues'] = [];
  let index = startIndex;

  while (index < source.length) {
    const currentCharacter = source[index];

    if (currentCharacter === ')') {
      if (stopAtClosingParenthesis) {
        return { counts, nextIndex: index, issues };
      }

      issues.push(
        buildFormulaParseIssue(
          'unmatched-group',
          'Closing parenthesis does not match an opening group.',
          index,
          index + 1,
        ),
      );
      return { counts, nextIndex: source.length, issues };
    }

    if (currentCharacter === '(') {
      if (!options.allowGroupedFormula) {
        issues.push(
          buildFormulaParseIssue(
            'unsupported-notation',
            'Grouped formulas are not enabled for this parser run.',
            index,
            index + 1,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      const groupResult = parseFormulaSegment(source, index + 1, options, true);
      issues.push(...groupResult.issues);

      if (groupResult.nextIndex >= source.length || source[groupResult.nextIndex] !== ')') {
        issues.push(
          buildFormulaParseIssue(
            'unmatched-group',
            'Opening parenthesis does not have a matching closing parenthesis.',
            index,
            index + 1,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      const multiplierResult = readFormulaNumber(source, groupResult.nextIndex + 1);
      const multiplier = multiplierResult.value ?? 1;

      if (multiplier <= 0) {
        issues.push(
          buildFormulaParseIssue(
            'invalid-multiplier',
            'Group multipliers must be positive integers.',
            groupResult.nextIndex + 1,
            multiplierResult.nextIndex,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      mergeFormulaCounts(counts, groupResult.counts, multiplier);
      index = multiplierResult.nextIndex;
      continue;
    }

    if (/[A-Z]/.test(currentCharacter)) {
      const nextCharacter = source[index + 1];
      const symbol =
        nextCharacter !== undefined && /[a-z]/.test(nextCharacter)
          ? `${currentCharacter}${nextCharacter}`
          : currentCharacter;

      if (!isKnownChemicalElementSymbol(symbol)) {
        issues.push(
          buildFormulaParseIssue(
            'unknown-element-symbol',
            `Unknown chemical element symbol "${symbol}".`,
            index,
            index + symbol.length,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      const countStartIndex = index + symbol.length;
      const countResult = readFormulaNumber(source, countStartIndex);
      const count = countResult.value ?? 1;

      if (count <= 0) {
        issues.push(
          buildFormulaParseIssue(
            'invalid-multiplier',
            'Element multipliers must be positive integers.',
            countStartIndex,
            countResult.nextIndex,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      counts.set(symbol, (counts.get(symbol) ?? 0) + count);
      index = countResult.nextIndex;
      continue;
    }

    issues.push(
      buildFormulaParseIssue(
        'invalid-token',
        `Unsupported token "${currentCharacter}" in chemical formula.`,
        index,
        index + 1,
      ),
    );
    return { counts, nextIndex: source.length, issues };
  }

  if (stopAtClosingParenthesis) {
    issues.push(
      buildFormulaParseIssue(
        'unmatched-group',
        'Opening parenthesis does not have a matching closing parenthesis.',
        startIndex - 1,
        startIndex,
      ),
    );
  }

  return { counts, nextIndex: index, issues };
}
