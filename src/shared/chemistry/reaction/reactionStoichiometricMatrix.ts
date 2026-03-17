import type { ChemicalReaction } from '@/shared/chemistry/reaction/reaction.types';
import { createRational } from '@/shared/chemistry/solver';
import type { SolverMatrix } from '@/shared/chemistry/solver';

function getParticipantElementCount(
  reaction: ChemicalReaction,
  participantIndex: number,
  symbol: string,
): number {
  const participants = [...reaction.reactants, ...reaction.products];
  const participant = participants[participantIndex];

  return participant.formula.elements.find((element) => element.symbol === symbol)?.count ?? 0;
}

export function buildReactionStoichiometricMatrix(
  reaction: ChemicalReaction,
): SolverMatrix {
  const participants = [...reaction.reactants, ...reaction.products];
  const reactantCount = reaction.reactants.length;

  return reaction.elementSymbols.map((symbol) =>
    participants.map((_, participantIndex) => {
      const count = getParticipantElementCount(reaction, participantIndex, symbol);
      const signedCount = participantIndex < reactantCount ? count : -count;

      return createRational(signedCount);
    }),
  );
}
