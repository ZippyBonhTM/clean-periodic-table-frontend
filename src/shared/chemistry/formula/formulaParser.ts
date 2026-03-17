import { isKnownChemicalElementSymbol } from '@/shared/chemistry/formula/chemicalElementSymbols';
import type { ChemicalFormulaParser, ParseChemicalFormulaOptions } from '@/shared/chemistry/formula/formulaParser.types';
import type {
  ChemicalFormulaCharge,
  ChemicalFormulaElementCount,
  ChemicalFormulaNotation,
  FormulaParseIssue,
  ParsedChemicalFormula,
} from '@/shared/chemistry/formula/formula.types';

type ParseSegmentResult = {
  counts: Map<string, number>;
  nextIndex: number;
  issues: FormulaParseIssue[];
};

type ParsedChargeSuffix = {
  formulaSource: string;
  charge: ChemicalFormulaCharge | null;
  normalizedSuffix: string;
  issues: FormulaParseIssue[];
};

function buildIssue(
  code: FormulaParseIssue['code'],
  message: string,
  start: number,
  end: number,
): FormulaParseIssue {
  return { code, message, start, end };
}

function readNumber(source: string, startIndex: number): { value: number | null; nextIndex: number } {
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

function mergeCounts(target: Map<string, number>, source: Map<string, number>, multiplier = 1): void {
  source.forEach((count, symbol) => {
    target.set(symbol, (target.get(symbol) ?? 0) + count * multiplier);
  });
}

function parseSegment(
  source: string,
  startIndex: number,
  options: Required<ParseChemicalFormulaOptions>,
  stopAtClosingParenthesis = false,
): ParseSegmentResult {
  const counts = new Map<string, number>();
  const issues: FormulaParseIssue[] = [];
  let index = startIndex;

  while (index < source.length) {
    const currentCharacter = source[index];

    if (currentCharacter === ')') {
      if (stopAtClosingParenthesis) {
        return { counts, nextIndex: index, issues };
      }

      issues.push(
        buildIssue('unmatched-group', 'Closing parenthesis does not match an opening group.', index, index + 1),
      );
      return { counts, nextIndex: source.length, issues };
    }

    if (currentCharacter === '(') {
      if (!options.allowGroupedFormula) {
        issues.push(
          buildIssue(
            'unsupported-notation',
            'Grouped formulas are not enabled for this parser run.',
            index,
            index + 1,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      const groupResult = parseSegment(source, index + 1, options, true);
      issues.push(...groupResult.issues);

      if (groupResult.nextIndex >= source.length || source[groupResult.nextIndex] !== ')') {
        issues.push(
          buildIssue('unmatched-group', 'Opening parenthesis does not have a matching closing parenthesis.', index, index + 1),
        );
        return { counts, nextIndex: source.length, issues };
      }

      const multiplierResult = readNumber(source, groupResult.nextIndex + 1);
      const multiplier = multiplierResult.value ?? 1;

      if (multiplier <= 0) {
        issues.push(
          buildIssue(
            'invalid-multiplier',
            'Group multipliers must be positive integers.',
            groupResult.nextIndex + 1,
            multiplierResult.nextIndex,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      mergeCounts(counts, groupResult.counts, multiplier);
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
          buildIssue(
            'unknown-element-symbol',
            `Unknown chemical element symbol "${symbol}".`,
            index,
            index + symbol.length,
          ),
        );
        return { counts, nextIndex: source.length, issues };
      }

      const countStartIndex = index + symbol.length;
      const countResult = readNumber(source, countStartIndex);
      const count = countResult.value ?? 1;

      if (count <= 0) {
        issues.push(
          buildIssue(
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
      buildIssue('invalid-token', `Unsupported token "${currentCharacter}" in chemical formula.`, index, index + 1),
    );
    return { counts, nextIndex: source.length, issues };
  }

  if (stopAtClosingParenthesis) {
    issues.push(
      buildIssue('unmatched-group', 'Opening parenthesis does not have a matching closing parenthesis.', startIndex - 1, startIndex),
    );
  }

  return { counts, nextIndex: index, issues };
}

function parseChargeSuffix(
  source: string,
  options: Required<ParseChemicalFormulaOptions>,
): ParsedChargeSuffix {
  if (source.endsWith('+') || source.endsWith('-')) {
    const sign = source[source.length - 1] as '+' | '-';
    const withoutSign = source.slice(0, -1);

    if (withoutSign.endsWith('^')) {
      return {
        formulaSource: source,
        charge: null,
        normalizedSuffix: '',
        issues: [
          buildIssue('invalid-charge', 'Charge magnitude is missing after "^".', source.length - 1, source.length),
        ],
      };
    }

    const caretIndex = withoutSign.lastIndexOf('^');

    if (caretIndex !== -1) {
      if (!options.allowCharge) {
        return {
          formulaSource: source,
          charge: null,
          normalizedSuffix: '',
          issues: [
            buildIssue(
              'unsupported-notation',
              'Charged formulas are not enabled for this parser run.',
              caretIndex,
              source.length,
            ),
          ],
        };
      }

      const magnitudeRaw = withoutSign.slice(caretIndex + 1);
      const magnitude = magnitudeRaw.length === 0 ? 1 : Number(magnitudeRaw);

      if (!Number.isInteger(magnitude) || magnitude <= 0) {
        return {
          formulaSource: source,
          charge: null,
          normalizedSuffix: '',
          issues: [buildIssue('invalid-charge', 'Charge magnitude must be a positive integer.', caretIndex, source.length)],
        };
      }

      return {
        formulaSource: withoutSign.slice(0, caretIndex),
        charge: { value: magnitude, sign },
        normalizedSuffix: magnitude === 1 ? sign : `^${magnitude}${sign}`,
        issues: [],
      };
    }

    if (!options.allowCharge) {
      return {
        formulaSource: source,
        charge: null,
        normalizedSuffix: '',
        issues: [
          buildIssue(
            'unsupported-notation',
            'Charged formulas are not enabled for this parser run.',
            source.length - 1,
            source.length,
          ),
        ],
      };
    }

    return {
      formulaSource: withoutSign,
      charge: { value: 1, sign },
      normalizedSuffix: sign,
      issues: [],
    };
  }

  return {
    formulaSource: source,
    charge: null,
    normalizedSuffix: '',
    issues: [],
  };
}

function splitHydrateSegments(source: string): { segments: string[]; usesHydrateDot: boolean } {
  const segments = source.split(/[·.]/);
  return {
    segments,
    usesHydrateDot: segments.length > 1,
  };
}

function toSortedElementCounts(counts: Map<string, number>): ChemicalFormulaElementCount[] {
  return Array.from(counts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol));
}

export const parseChemicalFormula: ChemicalFormulaParser = (input, options = {}) => {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('empty-input', 'Chemical formula input is empty.', 0, 0)],
    };
  }

  const resolvedOptions: Required<ParseChemicalFormulaOptions> = {
    allowCharge: options.allowCharge ?? true,
    allowHydrateDot: options.allowHydrateDot ?? true,
    allowGroupedFormula: options.allowGroupedFormula ?? true,
  };

  const chargeResult = parseChargeSuffix(normalizedInput, resolvedOptions);

  if (chargeResult.issues.length > 0) {
    return {
      ok: false,
      issues: chargeResult.issues,
    };
  }

  const { segments, usesHydrateDot } = splitHydrateSegments(chargeResult.formulaSource);

  if (usesHydrateDot && !resolvedOptions.allowHydrateDot) {
    const dotIndex = chargeResult.formulaSource.search(/[·.]/);
    return {
      ok: false,
      issues: [
        buildIssue(
          'unsupported-notation',
          'Hydrate dot notation is not enabled for this parser run.',
          dotIndex,
          dotIndex + 1,
        ),
      ],
    };
  }

  const aggregateCounts = new Map<string, number>();

  for (const [segmentIndex, segmentRaw] of segments.entries()) {
    if (segmentRaw.length === 0) {
      return {
        ok: false,
        issues: [
          buildIssue(
            'invalid-token',
            'Hydrate segments cannot be empty.',
            segmentIndex,
            segmentIndex,
          ),
        ],
      };
    }

    const leadingMultiplierResult = readNumber(segmentRaw, 0);
    const segmentMultiplier = leadingMultiplierResult.value ?? 1;
    const segmentFormulaSource = segmentRaw.slice(leadingMultiplierResult.nextIndex);

    if (segmentFormulaSource.length === 0 || segmentMultiplier <= 0) {
      return {
        ok: false,
        issues: [
          buildIssue(
            'invalid-multiplier',
            'Hydrate segment multiplier must be followed by a formula.',
            0,
            segmentRaw.length,
          ),
        ],
      };
    }

    const segmentResult = parseSegment(segmentFormulaSource, 0, resolvedOptions);

    if (segmentResult.issues.length > 0) {
      return {
        ok: false,
        issues: segmentResult.issues,
      };
    }

    mergeCounts(aggregateCounts, segmentResult.counts, segmentMultiplier);
  }

  const elements = toSortedElementCounts(aggregateCounts);
  const notation: ChemicalFormulaNotation = usesHydrateDot
    ? 'hydrate'
    : chargeResult.charge
      ? 'ionic'
      : 'molecular';

  const normalizedCore = segments
    .map((segmentRaw) => segmentRaw.replace(/\./g, '·'))
    .join('·');

  const value: ParsedChemicalFormula = {
    raw: input,
    normalized: `${normalizedCore}${chargeResult.normalizedSuffix}`,
    notation,
    elements,
    totalAtomCount: elements.reduce((sum, element) => sum + element.count, 0),
    charge: chargeResult.charge,
  };

  return {
    ok: true,
    value,
    warnings: [],
  };
};
