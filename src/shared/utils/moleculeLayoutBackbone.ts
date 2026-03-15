import type { MoleculeAtom, MoleculeModel } from '@/shared/utils/moleculeEditor';
import { findBond, resolveIdealBondLengthForAtoms } from '@/shared/utils/moleculeLayoutGraph';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph';
import {
  circularAngleDistance,
  normalizeAngle,
  resolveIdealAngles,
  rotateAngles,
  snapAngleToCanonicalGrid,
} from '@/shared/utils/moleculeLayoutGeometry';

function resolvePreferredBranchAngles(connectionCount: number, preferredAngle: number): number[] {
  if (connectionCount <= 0) {
    return [];
  }

  if (connectionCount === 1) {
    return [snapAngleToCanonicalGrid(preferredAngle)];
  }

  const baseAngles = resolveIdealAngles(connectionCount);
  return rotateAngles(baseAngles, snapAngleToCanonicalGrid(preferredAngle) - baseAngles[0]);
}

function resolveAtomCentroid(atomIds: string[], positionsByAtomId: Map<string, { x: number; y: number }>) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  atomIds.forEach((atomId) => {
    const position = positionsByAtomId.get(atomId);

    if (position === undefined) {
      return;
    }

    sumX += position.x;
    sumY += position.y;
    count += 1;
  });

  if (count === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

function compareBackbonePathCandidates(
  firstPath: string[],
  secondPath: string[],
  atomById: Map<string, MoleculeAtom>,
  anchorAtomId: string,
): number {
  if (firstPath.length !== secondPath.length) {
    return firstPath.length - secondPath.length;
  }

  const firstContainsAnchor = firstPath.includes(anchorAtomId);
  const secondContainsAnchor = secondPath.includes(anchorAtomId);

  if (firstContainsAnchor !== secondContainsAnchor) {
    return firstContainsAnchor ? 1 : -1;
  }

  const countCarbons = (path: string[]) => {
    return path.reduce((count, atomId) => {
      return count + (atomById.get(atomId)?.element.symbol === 'C' ? 1 : 0);
    }, 0);
  };

  const carbonCountDifference = countCarbons(firstPath) - countCarbons(secondPath);

  if (carbonCountDifference !== 0) {
    return carbonCountDifference;
  }

  return firstPath.join(':').localeCompare(secondPath.join(':')) * -1;
}

function resolvePreferredAcyclicBackbonePath(
  componentAtomIds: Set<string>,
  atomById: Map<string, MoleculeAtom>,
  neighborMap: Map<string, NeighborLink[]>,
  anchorAtomId: string,
): string[] | null {
  const heavyAtomIds = [...componentAtomIds].filter((atomId) => atomById.get(atomId)?.element.symbol !== 'H');

  if (heavyAtomIds.length < 3) {
    return null;
  }

  const heavyAtomIdSet = new Set(heavyAtomIds);
  let bestPath: string[] | null = null;

  const visit = (currentAtomId: string, visited: Set<string>, path: string[]) => {
    if (bestPath === null || compareBackbonePathCandidates(path, bestPath, atomById, anchorAtomId) > 0) {
      bestPath = [...path];
    }

    for (const neighbor of neighborMap.get(currentAtomId) ?? []) {
      if (!heavyAtomIdSet.has(neighbor.atomId) || visited.has(neighbor.atomId)) {
        continue;
      }

      visited.add(neighbor.atomId);
      path.push(neighbor.atomId);
      visit(neighbor.atomId, visited, path);
      path.pop();
      visited.delete(neighbor.atomId);
    }
  };

  heavyAtomIds.forEach((atomId) => {
    visit(atomId, new Set([atomId]), [atomId]);
  });

  return bestPath;
}

function resolveAcyclicBackboneCandidatePositions(
  model: MoleculeModel,
  backboneAtomIds: string[],
  targetAnchorAtomId: string,
  targetAnchorPosition: { x: number; y: number },
  direction: 1 | -1,
  bendSign: 1 | -1,
) {
  const candidatePositions = new Map<string, { x: number; y: number }>();

  if (backboneAtomIds.length === 0) {
    return candidatePositions;
  }

  candidatePositions.set(backboneAtomIds[0], { x: 0, y: 0 });

  for (let index = 0; index < backboneAtomIds.length - 1; index += 1) {
    const currentAtomId = backboneAtomIds[index];
    const nextAtomId = backboneAtomIds[index + 1];
    const currentPosition = candidatePositions.get(currentAtomId);

    if (currentPosition === undefined) {
      continue;
    }

    const segmentAngle =
      backboneAtomIds.length === 2
        ? direction === 1
          ? 0
          : 180
        : normalizeAngle(
            direction === 1
              ? index % 2 === 0
                ? bendSign * 30
                : bendSign * -30
              : 180 + (index % 2 === 0 ? bendSign * -30 : bendSign * 30),
          );
    const segmentLength = resolveIdealBondLengthForAtoms(
      model,
      currentAtomId,
      nextAtomId,
      findBond(model, currentAtomId, nextAtomId)?.order ?? 1,
    );
    const radians = (segmentAngle * Math.PI) / 180;

    candidatePositions.set(nextAtomId, {
      x: currentPosition.x + Math.cos(radians) * segmentLength,
      y: currentPosition.y + Math.sin(radians) * segmentLength,
    });
  }

  const anchorCandidatePosition = candidatePositions.get(targetAnchorAtomId);

  if (anchorCandidatePosition === undefined) {
    return candidatePositions;
  }

  const translateX = targetAnchorPosition.x - anchorCandidatePosition.x;
  const translateY = targetAnchorPosition.y - anchorCandidatePosition.y;

  candidatePositions.forEach((position, atomId) => {
    candidatePositions.set(atomId, {
      x: position.x + translateX,
      y: position.y + translateY,
    });
  });

  return candidatePositions;
}

function resolvePreferredAttachmentAngles(
  occupiedAngles: number[],
  connectionCount: number,
  preferredAngle: number,
): number[] {
  if (connectionCount <= 0) {
    return [];
  }

  const candidateAngles = Array.from({ length: 12 }, (_, index) => index * 30);
  const resolvedAngles: number[] = [];

  while (resolvedAngles.length < connectionCount) {
    let bestAngle = preferredAngle;
    let bestScore = Number.NEGATIVE_INFINITY;

    candidateAngles.forEach((candidateAngle) => {
      if (resolvedAngles.some((angle) => circularAngleDistance(angle, candidateAngle) < 1)) {
        return;
      }

      const avoidedAngles = [...occupiedAngles, ...resolvedAngles];
      const separationScore =
        avoidedAngles.length === 0
          ? 180
          : Math.min(...avoidedAngles.map((angle) => circularAngleDistance(angle, candidateAngle)));
      const preferenceScore = 180 - circularAngleDistance(preferredAngle, candidateAngle);
      const score = separationScore * 2 + preferenceScore;

      if (score > bestScore) {
        bestScore = score;
        bestAngle = candidateAngle;
      }
    });

    resolvedAngles.push(bestAngle);
  }

  return resolvedAngles;
}

export {
  resolveAcyclicBackboneCandidatePositions,
  resolveAtomCentroid,
  resolvePreferredAcyclicBackbonePath,
  resolvePreferredAttachmentAngles,
  resolvePreferredBranchAngles,
};
