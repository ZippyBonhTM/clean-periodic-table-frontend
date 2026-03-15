import { resolveBondOrderBetween } from '@/shared/utils/moleculeNomenclatureGraph';
import { CHAIN_ROOTS, MULTIPLIER_PREFIXES } from '@/shared/utils/moleculeNomenclature.types';
import type { MoleculeSubstituent, NeighborLink } from '@/shared/utils/moleculeNomenclature.types';

type NomenclatureLocants = {
  nitrile: number[];
  hydroxy: number[];
  amino: number[];
  double: number[];
  triple: number[];
  substituent: number[];
};

function compareLexicographicNumbers(firstValues: number[], secondValues: number[]): number {
  const length = Math.max(firstValues.length, secondValues.length);

  for (let index = 0; index < length; index += 1) {
    const firstValue = firstValues[index] ?? Number.POSITIVE_INFINITY;
    const secondValue = secondValues[index] ?? Number.POSITIVE_INFINITY;

    if (firstValue !== secondValue) {
      return firstValue - secondValue;
    }
  }

  return 0;
}

function compareLocantPriority(firstLocants: NomenclatureLocants, secondLocants: NomenclatureLocants): number {
  const comparisons = [
    compareLexicographicNumbers(firstLocants.nitrile, secondLocants.nitrile),
    compareLexicographicNumbers(firstLocants.hydroxy, secondLocants.hydroxy),
    compareLexicographicNumbers(firstLocants.amino, secondLocants.amino),
    compareLexicographicNumbers(firstLocants.double, secondLocants.double),
    compareLexicographicNumbers(firstLocants.triple, secondLocants.triple),
    compareLexicographicNumbers(firstLocants.substituent, secondLocants.substituent),
  ];

  return comparisons.find((value) => value !== 0) ?? 0;
}

function resolveUnsaturationLocants(
  orderedChainAtomIds: string[],
  neighborMap: Map<string, NeighborLink[]>,
): { double: number[]; triple: number[]; multipleBondCount: number } | null {
  const double: number[] = [];
  const triple: number[] = [];

  for (let index = 0; index < orderedChainAtomIds.length - 1; index += 1) {
    const order = resolveBondOrderBetween(orderedChainAtomIds[index], orderedChainAtomIds[index + 1], neighborMap);

    if (order === null) {
      return null;
    }

    if (order === 2) {
      double.push(index + 1);
    }

    if (order === 3) {
      triple.push(index + 1);
    }
  }

  if (double.length > 1 || triple.length > 1 || (double.length > 0 && triple.length > 0)) {
    return null;
  }

  return {
    double,
    triple,
    multipleBondCount: double.length + triple.length,
  };
}

function shouldOmitUnsaturationLocant(chainLength: number, locant: number): boolean {
  return locant === 1 && chainLength <= 3;
}

function shouldOmitHydroxyLocant(chainLength: number, locant: number): boolean {
  return locant === 1 && chainLength <= 2;
}

function buildParentName(
  chainLength: number,
  doubleLocants: number[],
  tripleLocants: number[],
  nitrileLocants: number[],
  hydroxyLocants: number[],
  aminoLocants: number[],
  forceHydroxyLocant = false,
): string | null {
  const root = CHAIN_ROOTS[chainLength];

  if (root === undefined) {
    return null;
  }

  const hydroxyLocant = hydroxyLocants[0] ?? null;
  const hydroxyLocantSegment = hydroxyLocants.join(',');
  const hydroxyMultiplier = hydroxyLocants.length > 1 ? MULTIPLIER_PREFIXES[hydroxyLocants.length] : '';
  const aminoLocant = aminoLocants[0] ?? null;
  const nitrileLocant = nitrileLocants[0] ?? null;
  const doubleLocant = doubleLocants[0] ?? null;
  const tripleLocant = tripleLocants[0] ?? null;

  if (doubleLocant !== null && tripleLocant !== null) {
    return null;
  }

  if (nitrileLocant !== null) {
    if (
      nitrileLocants.length > 1 ||
      nitrileLocant !== 1 ||
      hydroxyLocant !== null ||
      aminoLocant !== null ||
      doubleLocant !== null ||
      tripleLocant !== null
    ) {
      return null;
    }

    return `${root}anonitrila`;
  }

  if (hydroxyLocant !== null) {
    if (hydroxyLocants.length > 1 && hydroxyMultiplier === undefined) {
      return null;
    }

    if (doubleLocant !== null) {
      const doubleSegment = shouldOmitUnsaturationLocant(chainLength, doubleLocant) ? 'en' : `${doubleLocant}-en`;
      return hydroxyLocants.length === 1
        ? `${root}-${doubleSegment}-${hydroxyLocant}-ol`
        : `${root}-${doubleSegment}-${hydroxyLocantSegment}-${hydroxyMultiplier}ol`;
    }

    if (tripleLocant !== null) {
      const tripleSegment = shouldOmitUnsaturationLocant(chainLength, tripleLocant) ? 'in' : `${tripleLocant}-in`;
      return hydroxyLocants.length === 1
        ? `${root}-${tripleSegment}-${hydroxyLocant}-ol`
        : `${root}-${tripleSegment}-${hydroxyLocantSegment}-${hydroxyMultiplier}ol`;
    }

    if (hydroxyLocants.length > 1) {
      return `${root}an-${hydroxyLocantSegment}-${hydroxyMultiplier}ol`;
    }

    if (!forceHydroxyLocant && shouldOmitHydroxyLocant(chainLength, hydroxyLocant)) {
      return `${root}anol`;
    }

    return `${root}an-${hydroxyLocant}-ol`;
  }

  if (aminoLocant !== null) {
    const aminoLocantSegment = aminoLocants.join(',');
    const aminoMultiplier = aminoLocants.length > 1 ? MULTIPLIER_PREFIXES[aminoLocants.length] : '';

    if (aminoLocants.length > 1 && aminoMultiplier === undefined) {
      return null;
    }

    const aminoSuffix = `${aminoMultiplier}amina`;

    if (doubleLocant !== null) {
      const doubleSegment = shouldOmitUnsaturationLocant(chainLength, doubleLocant) ? 'en' : `${doubleLocant}-en`;
      return `${root}-${doubleSegment}-${aminoLocantSegment}-${aminoSuffix}`;
    }

    if (tripleLocant !== null) {
      const tripleSegment = shouldOmitUnsaturationLocant(chainLength, tripleLocant) ? 'in' : `${tripleLocant}-in`;
      return `${root}-${tripleSegment}-${aminoLocantSegment}-${aminoSuffix}`;
    }

    return `${root}an-${aminoLocantSegment}-${aminoSuffix}`;
  }

  if (doubleLocant !== null) {
    return shouldOmitUnsaturationLocant(chainLength, doubleLocant) ? `${root}eno` : `${root}-${doubleLocant}-eno`;
  }

  if (tripleLocant !== null) {
    return shouldOmitUnsaturationLocant(chainLength, tripleLocant) ? `${root}ino` : `${root}-${tripleLocant}-ino`;
  }

  return `${root}ano`;
}

function buildSubstituentPrefix(substituents: MoleculeSubstituent[]): string | null {
  if (substituents.length === 0) {
    return '';
  }

  const groupedSubstituents = new Map<string, number[]>();

  for (const substituent of substituents) {
    const positions = groupedSubstituents.get(substituent.baseName) ?? [];
    positions.push(substituent.position);
    groupedSubstituents.set(substituent.baseName, positions);
  }

  const parts = [...groupedSubstituents.entries()]
    .sort(([firstName], [secondName]) => firstName.localeCompare(secondName))
    .map(([baseName, positions]) => {
      const sortedPositions = [...positions].sort((first, second) => first - second);
      const multiplier = sortedPositions.length > 1 ? MULTIPLIER_PREFIXES[sortedPositions.length] : '';

      if (sortedPositions.length > 1 && multiplier === undefined) {
        return null;
      }

      return `${sortedPositions.join(',')}-${multiplier}${baseName}`;
    });

  if (parts.some((part) => part === null)) {
    return null;
  }

  return parts.join('-');
}

export type { NomenclatureLocants };

export {
  buildParentName,
  buildSubstituentPrefix,
  compareLocantPriority,
  resolveUnsaturationLocants,
};
