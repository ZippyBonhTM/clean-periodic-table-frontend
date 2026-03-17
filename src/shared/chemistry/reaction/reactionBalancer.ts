import type {
  BalanceChemicalReactionResult,
  BalanceReactionIssue,
  BalancedChemicalReactionParticipant,
  ChemicalReaction,
  ChemicalReactionBalancer,
} from '@/shared/chemistry/reaction';
import { buildReactionStoichiometricMatrix } from '@/shared/chemistry/reaction/reactionStoichiometricMatrix';
import {
  normalizeStoichiometricCoefficients,
  solveHomogeneousSystem,
} from '@/shared/chemistry/solver';
import type { Rational } from '@/shared/chemistry/solver';

function buildIssue(
  code: BalanceReactionIssue['code'],
  message: string,
): BalanceReactionIssue {
  return { code, message };
}

function buildFailure(
  code: BalanceReactionIssue['code'],
  message: string,
): BalanceChemicalReactionResult {
  return {
    ok: false,
    issues: [buildIssue(code, message)],
  };
}

function isReactionStructurallyValid(reaction: ChemicalReaction): BalanceChemicalReactionResult | null {
  if (reaction.reactants.length === 0) {
    return buildFailure('missing-reactants', 'Reaction must contain at least one reactant.');
  }

  if (reaction.products.length === 0) {
    return buildFailure('missing-products', 'Reaction must contain at least one product.');
  }

  if (reaction.elementSymbols.length === 0) {
    return buildFailure('missing-elements', 'Reaction must contain at least one element symbol.');
  }

  const participants = [...reaction.reactants, ...reaction.products];

  if (participants.some((participant) => participant.formula.elements.length === 0)) {
    return buildFailure(
      'invalid-formula',
      'Reaction contains at least one participant without parsed formula elements.',
    );
  }

  return null;
}

function wasCoefficientVectorNormalized(
  rawVector: Rational[],
  normalizedVector: number[],
): boolean {
  return rawVector.some((coefficient, index) => {
    const normalizedValue = normalizedVector[index];

    return coefficient.denominator !== 1 || coefficient.numerator !== normalizedValue;
  });
}

function buildBalancedParticipants(
  reaction: ChemicalReaction,
  coefficientVector: number[],
): {
  reactants: BalancedChemicalReactionParticipant[];
  products: BalancedChemicalReactionParticipant[];
} {
  const reactants = reaction.reactants.map((participant, index) => ({
    ...participant,
    coefficient: coefficientVector[index],
  }));

  const products = reaction.products.map((participant, index) => ({
    ...participant,
    coefficient: coefficientVector[reaction.reactants.length + index],
  }));

  return { reactants, products };
}

export const balanceChemicalReaction: ChemicalReactionBalancer = (
  reaction,
): BalanceChemicalReactionResult => {
  const validationFailure = isReactionStructurallyValid(reaction);

  if (validationFailure) {
    return validationFailure;
  }

  const matrix = buildReactionStoichiometricMatrix(reaction);
  const solution = solveHomogeneousSystem(matrix);

  if (!solution.ok) {
    return buildFailure(
      'unsatisfiable-system',
      'Reaction stoichiometric matrix could not be solved.',
    );
  }

  if (solution.value.basis.length === 0) {
    return buildFailure('unsatisfiable-system', 'Reaction has no non-trivial balancing solution.');
  }

  if (solution.value.basis.length > 1) {
    return buildFailure(
      'non-unique-solution',
      'Reaction balancing produced more than one independent solution vector.',
    );
  }

  const rawVector = solution.value.basis[0];
  const normalized = normalizeStoichiometricCoefficients(rawVector);

  if (!normalized.ok) {
    return buildFailure(
      'non-integer-solution',
      'Reaction balancing could not be normalized into integer coefficients.',
    );
  }

  if (normalized.value.some((coefficient) => coefficient === 0)) {
    return buildFailure(
      'zero-coefficient-solution',
      'Balanced reaction produced at least one zero coefficient.',
    );
  }

  if (normalized.value.some((coefficient) => coefficient < 0)) {
    return buildFailure(
      'sign-indeterminate-solution',
      'Balanced reaction produced mixed-sign coefficients.',
    );
  }

  const balancedParticipants = buildBalancedParticipants(reaction, normalized.value);

  return {
    ok: true,
    method: 'matrix-null-space',
    warnings: [],
    value: {
      ...reaction,
      ...balancedParticipants,
      coefficientVector: normalized.value,
      wasNormalized: wasCoefficientVectorNormalized(rawVector, normalized.value),
    },
  };
};
