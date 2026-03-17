import type {
  BalancedChemicalReaction,
  BalancedChemicalReactionParticipant,
} from '@/shared/chemistry/reaction/reactionBalance.types';

export type FormatBalancedReactionOptions = {
  includePhase?: boolean;
  hideCoefficientOne?: boolean;
  termSeparator?: string;
};

function formatParticipant(
  participant: BalancedChemicalReactionParticipant,
  options: FormatBalancedReactionOptions,
): string {
  const showCoefficient = !(options.hideCoefficientOne && participant.coefficient === 1);
  const coefficientPrefix = showCoefficient ? `${participant.coefficient}` : '';
  const phaseSuffix =
    options.includePhase && participant.phase && participant.phase !== 'unknown'
      ? `(${participant.phase})`
      : '';

  return `${coefficientPrefix}${participant.formula.normalized}${phaseSuffix}`;
}

export function formatBalancedReaction(
  reaction: BalancedChemicalReaction,
  options: FormatBalancedReactionOptions = {},
): string {
  const normalizedOptions: FormatBalancedReactionOptions = {
    includePhase: options.includePhase ?? true,
    hideCoefficientOne: options.hideCoefficientOne ?? true,
    termSeparator: options.termSeparator ?? ' + ',
  };

  const reactants = reaction.reactants
    .map((participant) => formatParticipant(participant, normalizedOptions))
    .join(normalizedOptions.termSeparator);

  const products = reaction.products
    .map((participant) => formatParticipant(participant, normalizedOptions))
    .join(normalizedOptions.termSeparator);

  return `${reactants} ${reaction.arrow} ${products}`;
}
