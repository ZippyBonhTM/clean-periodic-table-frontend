import type { ParseChemicalEquationOptions } from '@/shared/chemistry/equation/equationParser.types';
import type {
  ChemicalEquationPhase,
  EquationParseIssue,
  ParsedChemicalEquationTerm,
} from '@/shared/chemistry/equation/equation.types';

type ParseEquationTermsResult = {
  terms: ParsedChemicalEquationTerm[];
  issues: EquationParseIssue[];
};

function buildIssue(
  code: EquationParseIssue['code'],
  message: string,
  start: number,
  end: number,
): EquationParseIssue {
  return { code, message, start, end };
}

function findPreviousNonWhitespace(source: string, startIndex: number): number {
  let index = startIndex;

  while (index >= 0) {
    if (!/\s/.test(source[index])) {
      return index;
    }

    index -= 1;
  }

  return -1;
}

function findNextNonWhitespace(source: string, startIndex: number): number {
  let index = startIndex;

  while (index < source.length) {
    if (!/\s/.test(source[index])) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function isEquationTermSeparator(source: string, index: number): boolean {
  if (source[index] !== '+') {
    return false;
  }

  const previousNonWhitespaceIndex = findPreviousNonWhitespace(source, index - 1);
  const nextNonWhitespaceIndex = findNextNonWhitespace(source, index + 1);

  if (previousNonWhitespaceIndex === -1 || nextNonWhitespaceIndex === -1) {
    return true;
  }

  const previousNonWhitespaceCharacter = source[previousNonWhitespaceIndex];
  const nextNonWhitespaceCharacter = source[nextNonWhitespaceIndex];

  if (nextNonWhitespaceCharacter === '+' || nextNonWhitespaceCharacter === '-') {
    return false;
  }

  if (
    (previousNonWhitespaceCharacter === '+' || previousNonWhitespaceCharacter === '-') &&
    nextNonWhitespaceIndex > index
  ) {
    return true;
  }

  if (/\s/.test(source[index - 1] ?? '') || /\s/.test(source[index + 1] ?? '')) {
    return true;
  }

  return /[A-Z(0-9]/.test(nextNonWhitespaceCharacter);
}

function splitEquationSideTerms(
  source: string,
  sourceOffset: number,
): Array<{ raw: string; start: number; end: number }> {
  const segments: Array<{ raw: string; start: number; end: number }> = [];
  let segmentStart = 0;

  for (let index = 0; index < source.length; index += 1) {
    if (!isEquationTermSeparator(source, index)) {
      continue;
    }

    segments.push({
      raw: source.slice(segmentStart, index),
      start: sourceOffset + segmentStart,
      end: sourceOffset + index,
    });
    segmentStart = index + 1;
  }

  segments.push({
    raw: source.slice(segmentStart),
    start: sourceOffset + segmentStart,
    end: sourceOffset + source.length,
  });

  return segments;
}

function parsePhaseSuffix(
  source: string,
  options: Required<ParseChemicalEquationOptions>,
  sourceOffset: number,
): {
  formulaSource: string;
  phase: ChemicalEquationPhase | null;
  normalizedSuffix: string;
  issues: EquationParseIssue[];
} {
  const phaseMatch = source.match(/\((aq|s|l|g)\)$/i);

  if (!phaseMatch) {
    return {
      formulaSource: source,
      phase: null,
      normalizedSuffix: '',
      issues: [],
    };
  }

  const phaseLabel = phaseMatch[1].toLowerCase() as ChemicalEquationPhase;
  const phaseStartIndex = source.length - phaseMatch[0].length;

  if (!options.allowPhaseLabels) {
    return {
      formulaSource: source,
      phase: null,
      normalizedSuffix: '',
      issues: [
        buildIssue(
          'invalid-phase',
          'Physical state labels are not enabled for this parser run.',
          sourceOffset + phaseStartIndex,
          sourceOffset + source.length,
        ),
      ],
    };
  }

  return {
    formulaSource: source.slice(0, phaseStartIndex),
    phase: phaseLabel,
    normalizedSuffix: `(${phaseLabel})`,
    issues: [],
  };
}

function parseLeadingCoefficient(
  source: string,
  options: Required<ParseChemicalEquationOptions>,
  sourceOffset: number,
): {
  formulaSource: string;
  coefficient: number | null;
  consumedLength: number;
  normalizedPrefix: string;
  issues: EquationParseIssue[];
} {
  const coefficientMatch = source.match(/^(\d+)\s*/);

  if (!coefficientMatch) {
    return {
      formulaSource: source,
      coefficient: null,
      consumedLength: 0,
      normalizedPrefix: '',
      issues: [],
    };
  }

  const coefficient = Number(coefficientMatch[1]);

  if (!options.allowExplicitCoefficients) {
    return {
      formulaSource: source,
      coefficient: null,
      consumedLength: 0,
      normalizedPrefix: '',
      issues: [
        buildIssue(
          'invalid-coefficient',
          'Explicit coefficients are not enabled for this parser run.',
          sourceOffset,
          sourceOffset + coefficientMatch[0].length,
        ),
      ],
    };
  }

  if (!Number.isInteger(coefficient) || coefficient <= 0) {
    return {
      formulaSource: source,
      coefficient: null,
      consumedLength: 0,
      normalizedPrefix: '',
      issues: [
        buildIssue(
          'invalid-coefficient',
          'Equation coefficients must be positive integers.',
          sourceOffset,
          sourceOffset + coefficientMatch[0].length,
        ),
      ],
    };
  }

  return {
    formulaSource: source.slice(coefficientMatch[0].length),
    coefficient,
    consumedLength: coefficientMatch[0].length,
    normalizedPrefix: `${coefficient}`,
    issues: [],
  };
}

function containsIonicChargeNotation(source: string): boolean {
  return source.includes('^') || source.endsWith('+') || source.endsWith('-');
}

export function parseEquationSideTerms(
  source: string,
  options: Required<ParseChemicalEquationOptions>,
  sourceOffset: number,
): ParseEquationTermsResult {
  const terms: ParsedChemicalEquationTerm[] = [];
  const issues: EquationParseIssue[] = [];
  const segments = splitEquationSideTerms(source, sourceOffset);

  segments.forEach((segment) => {
    const trimmedRaw = segment.raw.trim();
    const trimmedStart = segment.start + segment.raw.search(/\S|$/);

    if (trimmedRaw.length === 0) {
      issues.push(
        buildIssue(
          'invalid-term',
          'Equation terms cannot be empty.',
          segment.start,
          segment.end,
        ),
      );
      return;
    }

    const coefficientResult = parseLeadingCoefficient(trimmedRaw, options, trimmedStart);
    issues.push(...coefficientResult.issues);

    if (coefficientResult.issues.length > 0) {
      return;
    }

    const phaseOffset = trimmedStart + coefficientResult.consumedLength;
    const phaseResult = parsePhaseSuffix(
      coefficientResult.formulaSource.trim(),
      options,
      phaseOffset,
    );
    issues.push(...phaseResult.issues);

    if (phaseResult.issues.length > 0) {
      return;
    }

    const formula = phaseResult.formulaSource.trim();

    if (formula.length === 0) {
      issues.push(
        buildIssue('invalid-formula', 'Equation terms must contain a chemical formula.', segment.start, segment.end),
      );
      return;
    }

    if (/\s/.test(formula)) {
      issues.push(
        buildIssue(
          'invalid-formula',
          'Chemical formulas inside equation terms cannot contain internal whitespace.',
          trimmedStart,
          trimmedStart + trimmedRaw.length,
        ),
      );
      return;
    }

    if (containsIonicChargeNotation(formula) && !options.allowIonicCharge) {
      issues.push(
        buildIssue(
          'unsupported-notation',
          'Ionic charge notation is not enabled for this parser run.',
          trimmedStart,
          trimmedStart + trimmedRaw.length,
        ),
      );
      return;
    }

    terms.push({
      raw: trimmedRaw,
      normalized: `${coefficientResult.normalizedPrefix}${formula}${phaseResult.normalizedSuffix}`,
      coefficient: coefficientResult.coefficient,
      formula,
      phase: phaseResult.phase,
    });
  });

  return { terms, issues };
}
