import { resolveUnsaturationLocants } from '@/shared/utils/moleculeNomenclatureNaming';
import { resolveSupportedContextForChain } from '@/shared/utils/moleculeNomenclatureSubstituents';
import type { NeighborLink, NomenclatureAtom } from '@/shared/utils/moleculeNomenclature.types';

function comparePathCandidates(
  firstCandidate: {
    length: number;
    nitrileCount: number;
    hydroxyCount: number;
    aminoCount: number;
    multipleBondCount: number;
    substituentCount: number;
  },
  secondCandidate: {
    length: number;
    nitrileCount: number;
    hydroxyCount: number;
    aminoCount: number;
    multipleBondCount: number;
    substituentCount: number;
  },
): number {
  if (firstCandidate.length !== secondCandidate.length) {
    return firstCandidate.length - secondCandidate.length;
  }

  if (firstCandidate.nitrileCount !== secondCandidate.nitrileCount) {
    return firstCandidate.nitrileCount - secondCandidate.nitrileCount;
  }

  if (firstCandidate.hydroxyCount !== secondCandidate.hydroxyCount) {
    return firstCandidate.hydroxyCount - secondCandidate.hydroxyCount;
  }

  if (firstCandidate.aminoCount !== secondCandidate.aminoCount) {
    return firstCandidate.aminoCount - secondCandidate.aminoCount;
  }

  if (firstCandidate.multipleBondCount !== secondCandidate.multipleBondCount) {
    return firstCandidate.multipleBondCount - secondCandidate.multipleBondCount;
  }

  return firstCandidate.substituentCount - secondCandidate.substituentCount;
}

function resolveBestParentChain(
  carbonAtomIds: string[],
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
  carbonNeighborMap: Map<string, NeighborLink[]>,
): string[] | null {
  let bestPath: string[] | null = null;
  let bestScore:
    | {
        length: number;
        nitrileCount: number;
        hydroxyCount: number;
        aminoCount: number;
        multipleBondCount: number;
        substituentCount: number;
      }
    | null = null;

  const visit = (currentAtomId: string, visited: Set<string>, path: string[]) => {
    const context = resolveSupportedContextForChain(path, atomById, neighborMap);
    const unsaturation = resolveUnsaturationLocants(path, neighborMap);

    if (context !== null && unsaturation !== null) {
      const currentScore = {
        length: path.length,
        nitrileCount: context.nitrilePositions.length,
        hydroxyCount: context.hydroxyPositions.length,
        aminoCount: context.aminoPositions.length,
        multipleBondCount: unsaturation.multipleBondCount,
        substituentCount: context.substituents.length,
      };

      if (bestScore === null || comparePathCandidates(currentScore, bestScore) > 0) {
        bestPath = [...path];
        bestScore = currentScore;
      }
    }

    for (const neighbor of carbonNeighborMap.get(currentAtomId) ?? []) {
      if (visited.has(neighbor.atomId)) {
        continue;
      }

      visited.add(neighbor.atomId);
      path.push(neighbor.atomId);
      visit(neighbor.atomId, visited, path);
      path.pop();
      visited.delete(neighbor.atomId);
    }
  };

  for (const atomId of carbonAtomIds) {
    visit(atomId, new Set([atomId]), [atomId]);
  }

  return bestPath;
}

export { resolveBestParentChain, resolveSupportedContextForChain };
