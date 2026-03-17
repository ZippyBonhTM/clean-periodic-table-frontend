import { parseEquationSideTerms } from '@/shared/chemistry/equation/equationTermParser';
import type { ChemicalEquationParser, ParseChemicalEquationOptions } from '@/shared/chemistry/equation/equationParser.types';
import type { ChemicalEquationArrow, EquationParseIssue } from '@/shared/chemistry/equation/equation.types';

type ArrowMatch = {
  arrow: ChemicalEquationArrow;
  start: number;
  end: number;
};

function buildIssue(
  code: EquationParseIssue['code'],
  message: string,
  start: number,
  end: number,
): EquationParseIssue {
  return { code, message, start, end };
}

function resolveArrowMatches(source: string): ArrowMatch[] {
  const matches: ArrowMatch[] = [];
  const arrowPattern = /<->|->|=/g;

  for (const match of source.matchAll(arrowPattern)) {
    if (match.index === undefined) {
      continue;
    }

    matches.push({
      arrow: match[0] as ChemicalEquationArrow,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

export const parseChemicalEquation: ChemicalEquationParser = (input, options = {}) => {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('empty-input', 'Chemical equation input is empty.', 0, 0)],
    };
  }

  const resolvedOptions: Required<ParseChemicalEquationOptions> = {
    allowReversibleArrow: options.allowReversibleArrow ?? true,
    allowPhaseLabels: options.allowPhaseLabels ?? true,
    allowIonicCharge: options.allowIonicCharge ?? true,
    allowExplicitCoefficients: options.allowExplicitCoefficients ?? true,
  };

  const arrowMatches = resolveArrowMatches(normalizedInput);

  if (arrowMatches.length === 0) {
    return {
      ok: false,
      issues: [
        buildIssue(
          'missing-arrow',
          'Chemical equation must contain an arrow between reactants and products.',
          0,
          normalizedInput.length,
        ),
      ],
    };
  }

  if (arrowMatches.length > 1) {
    const firstArrow = arrowMatches[0];
    const lastArrow = arrowMatches[arrowMatches.length - 1];

    return {
      ok: false,
      issues: [
        buildIssue(
          'multiple-arrows',
          'Chemical equation contains more than one arrow.',
          firstArrow.start,
          lastArrow.end,
        ),
      ],
    };
  }

  const [arrowMatch] = arrowMatches;

  if (arrowMatch.arrow === '<->' && !resolvedOptions.allowReversibleArrow) {
    return {
      ok: false,
      issues: [
        buildIssue(
          'unsupported-notation',
          'Reversible arrows are not enabled for this parser run.',
          arrowMatch.start,
          arrowMatch.end,
        ),
      ],
    };
  }

  const reactantsSlice = normalizedInput.slice(0, arrowMatch.start);
  const productsSlice = normalizedInput.slice(arrowMatch.end);
  const rawReactants = reactantsSlice.trim();
  const rawProducts = productsSlice.trim();
  const reactantsOffset = reactantsSlice.search(/\S|$/);
  const productsOffset = arrowMatch.end + productsSlice.search(/\S|$/);

  if (rawReactants.length === 0 || rawProducts.length === 0) {
    return {
      ok: false,
      issues: [
        buildIssue(
          'empty-side',
          'Chemical equation must contain both reactants and products.',
          0,
          normalizedInput.length,
        ),
      ],
    };
  }

  const reactantsResult = parseEquationSideTerms(rawReactants, resolvedOptions, reactantsOffset);
  const productsResult = parseEquationSideTerms(rawProducts, resolvedOptions, productsOffset);
  const issues = [...reactantsResult.issues, ...productsResult.issues];

  if (issues.length > 0) {
    return {
      ok: false,
      issues,
    };
  }

  const normalized = `${reactantsResult.terms
    .map((term) => term.normalized)
    .join(' + ')} ${arrowMatch.arrow} ${productsResult.terms
    .map((term) => term.normalized)
    .join(' + ')}`;

  return {
    ok: true,
    value: {
      raw: input,
      normalized,
      arrow: arrowMatch.arrow,
      reactants: reactantsResult.terms,
      products: productsResult.terms,
      termCount: reactantsResult.terms.length + productsResult.terms.length,
    },
    warnings: [],
  };
};
