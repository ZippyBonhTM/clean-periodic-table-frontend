import type {
  ChemicalEquationSide,
  ParsedChemicalEquationTerm,
} from '@/shared/chemistry/equation';
import type { ChemicalFormulaParser } from '@/shared/chemistry/formula';
import type {
  ChemicalReactionFactory,
  CreateChemicalReactionIssue,
  CreateChemicalReactionResult,
} from '@/shared/chemistry/reaction/reactionFactory.types';
import type {
  ChemicalReaction,
  ChemicalReactionParticipant,
} from '@/shared/chemistry/reaction/reaction.types';

function buildIssue(
  code: CreateChemicalReactionIssue['code'],
  message: string,
  extras: Omit<CreateChemicalReactionIssue, 'code' | 'message'> = {},
): CreateChemicalReactionIssue {
  return {
    code,
    message,
    ...extras,
  };
}

function buildParticipants(
  terms: ParsedChemicalEquationTerm[],
  side: ChemicalEquationSide,
  parseFormula: ChemicalFormulaParser,
): {
  participants: ChemicalReactionParticipant[];
  issues: CreateChemicalReactionIssue[];
} {
  const participants: ChemicalReactionParticipant[] = [];
  const issues: CreateChemicalReactionIssue[] = [];

  terms.forEach((term, termIndex) => {
    const formulaResult = parseFormula(term.formula);

    if (!formulaResult.ok) {
      issues.push(
        buildIssue(
          'formula-parse-failure',
          'Equation term formula could not be parsed into a structured chemical formula.',
          {
            side,
            termIndex,
            formulaIssues: formulaResult.issues,
          },
        ),
      );
      return;
    }

    participants.push({
      raw: term.raw,
      normalized: term.normalized,
      side,
      inputCoefficient: term.coefficient,
      formula: formulaResult.value,
      phase: term.phase,
    });
  });

  return { participants, issues };
}

function collectElementSymbols(reaction: Omit<ChemicalReaction, 'elementSymbols'>): string[] {
  const symbols = new Set<string>();

  [...reaction.reactants, ...reaction.products].forEach((participant) => {
    participant.formula.elements.forEach((element) => {
      symbols.add(element.symbol);
    });
  });

  return Array.from(symbols).sort((left, right) => left.localeCompare(right));
}

export const createChemicalReactionFromEquation: ChemicalReactionFactory = (
  equation,
  parseFormula,
): CreateChemicalReactionResult => {
  if (equation.reactants.length === 0 && equation.products.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('empty-reaction', 'Equation does not contain reaction terms.')],
    };
  }

  if (equation.reactants.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('missing-reactants', 'Equation does not contain reactants.')],
    };
  }

  if (equation.products.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('missing-products', 'Equation does not contain products.')],
    };
  }

  const reactantsResult = buildParticipants(equation.reactants, 'reactant', parseFormula);
  const productsResult = buildParticipants(equation.products, 'product', parseFormula);
  const issues = [...reactantsResult.issues, ...productsResult.issues];

  if (issues.length > 0) {
    return {
      ok: false,
      issues,
    };
  }

  const reactionWithoutElements: Omit<ChemicalReaction, 'elementSymbols'> = {
    raw: equation.raw,
    normalized: equation.normalized,
    arrow: equation.arrow,
    reactants: reactantsResult.participants,
    products: productsResult.participants,
  };

  const elementSymbols = collectElementSymbols(reactionWithoutElements);

  if (elementSymbols.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('missing-elements', 'Reaction does not contain chemical elements.')],
    };
  }

  return {
    ok: true,
    value: {
      ...reactionWithoutElements,
      elementSymbols,
    },
    warnings: [],
  };
};
