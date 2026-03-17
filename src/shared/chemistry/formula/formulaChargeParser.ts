import type {
  ParsedFormulaChargeSuffix,
  ResolvedParseChemicalFormulaOptions,
} from '@/shared/chemistry/formula/formulaParser.internal.types';
import { buildFormulaParseIssue } from '@/shared/chemistry/formula/formulaParser.utils';

export function parseFormulaChargeSuffix(
  source: string,
  options: ResolvedParseChemicalFormulaOptions,
): ParsedFormulaChargeSuffix {
  if (source.endsWith('+') || source.endsWith('-')) {
    const sign = source[source.length - 1] as '+' | '-';
    const withoutSign = source.slice(0, -1);

    if (withoutSign.endsWith('^')) {
      return {
        formulaSource: source,
        charge: null,
        normalizedSuffix: '',
        issues: [
          buildFormulaParseIssue(
            'invalid-charge',
            'Charge magnitude is missing after "^".',
            source.length - 1,
            source.length,
          ),
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
            buildFormulaParseIssue(
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
          issues: [
            buildFormulaParseIssue(
              'invalid-charge',
              'Charge magnitude must be a positive integer.',
              caretIndex,
              source.length,
            ),
          ],
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
          buildFormulaParseIssue(
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
