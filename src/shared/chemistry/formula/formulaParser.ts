import type { ChemicalFormulaParser } from '@/shared/chemistry/formula/formulaParser.types';
import type {
  ChemicalFormulaNotation,
  ParsedChemicalFormula,
} from '@/shared/chemistry/formula/formula.types';
import { parseFormulaChargeSuffix } from '@/shared/chemistry/formula/formulaChargeParser';
import { parseFormulaSegment } from '@/shared/chemistry/formula/formulaSegmentParser';
import {
  buildFormulaParseIssue,
  mergeFormulaCounts,
  readFormulaNumber,
  resolveFormulaParserOptions,
  splitFormulaHydrateSegments,
  toSortedFormulaElementCounts,
} from '@/shared/chemistry/formula/formulaParser.utils';

export const parseChemicalFormula: ChemicalFormulaParser = (input, options = {}) => {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return {
      ok: false,
      issues: [buildFormulaParseIssue('empty-input', 'Chemical formula input is empty.', 0, 0)],
    };
  }

  const resolvedOptions = resolveFormulaParserOptions(options);

  const chargeResult = parseFormulaChargeSuffix(normalizedInput, resolvedOptions);

  if (chargeResult.issues.length > 0) {
    return {
      ok: false,
      issues: chargeResult.issues,
    };
  }

  const { segments, usesHydrateDot } = splitFormulaHydrateSegments(chargeResult.formulaSource);

  if (usesHydrateDot && !resolvedOptions.allowHydrateDot) {
    const dotIndex = chargeResult.formulaSource.search(/[·.]/);
    return {
      ok: false,
      issues: [
        buildFormulaParseIssue(
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
          buildFormulaParseIssue(
            'invalid-token',
            'Hydrate segments cannot be empty.',
            segmentIndex,
            segmentIndex,
          ),
        ],
      };
    }

    const leadingMultiplierResult = readFormulaNumber(segmentRaw, 0);
    const segmentMultiplier = leadingMultiplierResult.value ?? 1;
    const segmentFormulaSource = segmentRaw.slice(leadingMultiplierResult.nextIndex);

    if (segmentFormulaSource.length === 0 || segmentMultiplier <= 0) {
      return {
        ok: false,
        issues: [
          buildFormulaParseIssue(
            'invalid-multiplier',
            'Hydrate segment multiplier must be followed by a formula.',
            0,
            segmentRaw.length,
          ),
        ],
      };
    }

    const segmentResult = parseFormulaSegment(segmentFormulaSource, 0, resolvedOptions);

    if (segmentResult.issues.length > 0) {
      return {
        ok: false,
        issues: segmentResult.issues,
      };
    }

    mergeFormulaCounts(aggregateCounts, segmentResult.counts, segmentMultiplier);
  }

  const elements = toSortedFormulaElementCounts(aggregateCounts);
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
