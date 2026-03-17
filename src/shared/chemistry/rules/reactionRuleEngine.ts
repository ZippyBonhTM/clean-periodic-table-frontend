import type { BalancedChemicalReaction, BalancedChemicalReactionParticipant } from '@/shared/chemistry/reaction';
import type {
  AnalyzeBalancedReactionOptions,
  BalancedReactionAnalysis,
  ReactionHeuristicNotice,
  ReactionHeuristicNoticeCode,
  ReactionHeuristicType,
} from '@/shared/chemistry/rules/reactionRules.types';

function buildNotice(
  level: ReactionHeuristicNotice['level'],
  code: ReactionHeuristicNoticeCode,
  message: string,
): ReactionHeuristicNotice {
  return { level, code, message };
}

function resolveParticipantCharge(participant: BalancedChemicalReactionParticipant): number {
  if (participant.formula.charge === null) {
    return 0;
  }

  const sign = participant.formula.charge.sign === '+' ? 1 : -1;
  return participant.coefficient * participant.formula.charge.value * sign;
}

function isCombustionLike(reaction: BalancedChemicalReaction): boolean {
  const hasOxygenGasReactant = reaction.reactants.some(
    (participant) =>
      participant.formula.elements.length === 1 &&
      participant.formula.elements[0]?.symbol === 'O' &&
      participant.formula.elements[0]?.count === 2,
  );

  const hasFuelReactant = reaction.reactants.some((participant) => {
    const symbols = new Set(participant.formula.elements.map((element) => element.symbol));
    return symbols.has('C') && symbols.has('H');
  });

  const hasCarbonDioxideProduct = reaction.products.some(
    (participant) => participant.formula.normalized === 'CO2',
  );
  const hasWaterProduct = reaction.products.some(
    (participant) => participant.formula.normalized === 'H2O',
  );

  return hasOxygenGasReactant && hasFuelReactant && hasCarbonDioxideProduct && hasWaterProduct;
}

function resolveReactionType(reaction: BalancedChemicalReaction): ReactionHeuristicType {
  if (isCombustionLike(reaction)) {
    return 'combustion-like';
  }

  if (reaction.reactants.length >= 2 && reaction.products.length === 1) {
    return 'synthesis';
  }

  if (reaction.reactants.length === 1 && reaction.products.length >= 2) {
    return 'decomposition';
  }

  if (reaction.reactants.length === 2 && reaction.products.length === 2) {
    return 'exchange';
  }

  return 'unknown';
}

function collectMissingMetadataSymbols(
  reaction: BalancedChemicalReaction,
  options: AnalyzeBalancedReactionOptions,
): string[] {
  if (!options.elementMetadataBySymbol) {
    return [];
  }

  const symbols = new Set<string>();

  [...reaction.reactants, ...reaction.products].forEach((participant) => {
    participant.formula.elements.forEach((element) => {
      if (!options.elementMetadataBySymbol?.has(element.symbol)) {
        symbols.add(element.symbol);
      }
    });
  });

  return Array.from(symbols).sort((left, right) => left.localeCompare(right));
}

function hasNobleGasCompound(
  reaction: BalancedChemicalReaction,
  options: AnalyzeBalancedReactionOptions,
): boolean {
  if (!options.elementMetadataBySymbol) {
    return false;
  }

  return [...reaction.reactants, ...reaction.products].some((participant) => {
    if (participant.formula.elements.length <= 1) {
      return false;
    }

    return participant.formula.elements.some((element) => {
      const metadata = options.elementMetadataBySymbol?.get(element.symbol);
      return metadata?.group === 18 || metadata?.category.toLowerCase() === 'noble gas';
    });
  });
}

export function analyzeBalancedReaction(
  reaction: BalancedChemicalReaction,
  options: AnalyzeBalancedReactionOptions = {},
): BalancedReactionAnalysis {
  const notices: ReactionHeuristicNotice[] = [];
  let score = 100;

  const reactionType = resolveReactionType(reaction);
  const totalReactantCharge = reaction.reactants.reduce(
    (sum, participant) => sum + resolveParticipantCharge(participant),
    0,
  );
  const totalProductCharge = reaction.products.reduce(
    (sum, participant) => sum + resolveParticipantCharge(participant),
    0,
  );

  const hasExplicitChargeNotation = [...reaction.reactants, ...reaction.products].some(
    (participant) => participant.formula.charge !== null,
  );

  if (hasExplicitChargeNotation) {
    if (totalReactantCharge === totalProductCharge) {
      notices.push(
        buildNotice('info', 'charge-balanced', 'Explicit ionic charge is balanced across the reaction.'),
      );
    } else {
      notices.push(
        buildNotice('warning', 'charge-imbalanced', 'Explicit ionic charge is not balanced across the reaction.'),
      );
      score -= 30;
    }
  }

  if (hasNobleGasCompound(reaction, options)) {
    notices.push(
      buildNotice(
        'warning',
        'noble-gas-compound',
        'The reaction contains a compound with a noble-gas element, which is uncommon under basic heuristic rules.',
      ),
    );
    score -= 35;
  }

  const missingMetadataSymbols = collectMissingMetadataSymbols(reaction, options);

  if (options.elementMetadataBySymbol && missingMetadataSymbols.length > 0) {
    notices.push(
      buildNotice(
        'info',
        'metadata-missing',
        `Element metadata is missing for: ${missingMetadataSymbols.join(', ')}.`,
      ),
    );
  }

  if (reactionType === 'combustion-like') {
    score += 5;
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  return {
    reaction,
    reactionType,
    score: boundedScore,
    likelyPlausible: boundedScore >= 60 && notices.every((notice) => notice.level !== 'warning'),
    notices,
  };
}
