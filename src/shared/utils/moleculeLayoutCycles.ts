import type { MoleculeModel } from '@/shared/utils/moleculeEditor';
import { findBond } from '@/shared/utils/moleculeLayoutGraph';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph';
import {
  circularAngleDistance,
  distanceBetween,
  normalizeAngle,
  resolveAngleBetween,
  resolveIdealAngles,
  resolveIdealBondLength,
  rotateAngles,
  snapAngleToCanonicalGrid,
} from '@/shared/utils/moleculeLayoutGeometry';

function chooseRootRotation(baseAngles: number[], currentAngles: number[]): number {
  if (baseAngles.length === 0 || currentAngles.length === 0) {
    return 0;
  }

  const normalizedCurrentAngles = [...currentAngles].map(normalizeAngle).sort((first, second) => first - second);
  let bestRotation = snapAngleToCanonicalGrid(normalizedCurrentAngles[0] - baseAngles[0]);
  let bestScore = Number.POSITIVE_INFINITY;
  const testedRotations = new Set<number>();

  baseAngles.forEach((baseAngle) => {
    const candidateRotation = snapAngleToCanonicalGrid(normalizedCurrentAngles[0] - baseAngle);

    if (testedRotations.has(candidateRotation)) {
      return;
    }

    testedRotations.add(candidateRotation);
    const rotatedAngles = rotateAngles(baseAngles, candidateRotation).sort((first, second) => first - second);
    const score = normalizedCurrentAngles.reduce((sum, currentAngle, index) => {
      const rotatedAngle = rotatedAngles[index] ?? rotatedAngles[rotatedAngles.length - 1] ?? 0;
      return sum + circularAngleDistance(currentAngle, rotatedAngle);
    }, 0);

    if (score < bestScore) {
      bestScore = score;
      bestRotation = candidateRotation;
    }
  });

  return bestRotation;
}

function findFirstCycleInComponent(
  componentAtomIds: Set<string>,
  neighborMap: Map<string, NeighborLink[]>,
): string[] | null {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const walk = (atomId: string, parentAtomId: string | null): string[] | null => {
    visited.add(atomId);
    recursionStack.add(atomId);
    path.push(atomId);

    for (const neighbor of neighborMap.get(atomId) ?? []) {
      if (!componentAtomIds.has(neighbor.atomId) || neighbor.atomId === parentAtomId) {
        continue;
      }

      if (!visited.has(neighbor.atomId)) {
        const nestedCycle = walk(neighbor.atomId, atomId);

        if (nestedCycle !== null) {
          return nestedCycle;
        }

        continue;
      }

      if (recursionStack.has(neighbor.atomId)) {
        const cycleStartIndex = path.lastIndexOf(neighbor.atomId);

        if (cycleStartIndex !== -1) {
          return path.slice(cycleStartIndex);
        }
      }
    }

    path.pop();
    recursionStack.delete(atomId);
    return null;
  };

  for (const atomId of componentAtomIds) {
    if (visited.has(atomId)) {
      continue;
    }

    const cycleAtomIds = walk(atomId, null);

    if (cycleAtomIds !== null && cycleAtomIds.length >= 3) {
      return cycleAtomIds;
    }
  }

  return null;
}

function reverseCycleOrder(cycleAtomIds: string[]): string[] {
  if (cycleAtomIds.length <= 2) {
    return [...cycleAtomIds];
  }

  return [cycleAtomIds[0], ...cycleAtomIds.slice(1).reverse()];
}

function resolveCycleCenter(cycleAtomIds: string[], positionsByAtomId: Map<string, { x: number; y: number }>) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  cycleAtomIds.forEach((atomId) => {
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

function resolveCycleRadius(model: MoleculeModel, cycleAtomIds: string[]): number {
  if (cycleAtomIds.length < 3) {
    return resolveIdealBondLength(1);
  }

  let totalBondLength = 0;
  let totalBondCount = 0;

  for (let index = 0; index < cycleAtomIds.length; index += 1) {
    const sourceId = cycleAtomIds[index];
    const targetId = cycleAtomIds[(index + 1) % cycleAtomIds.length];
    const cycleBond = findBond(model, sourceId, targetId);

    totalBondLength += resolveIdealBondLength(cycleBond?.order ?? 1);
    totalBondCount += 1;
  }

  const averageBondLength = totalBondCount === 0 ? resolveIdealBondLength(1) : totalBondLength / totalBondCount;
  return averageBondLength / (2 * Math.sin(Math.PI / cycleAtomIds.length));
}

function resolveRegularCyclePositions(
  cycleAtomIds: string[],
  center: { x: number; y: number },
  radius: number,
  originalPositions: Map<string, { x: number; y: number }>,
) {
  const baseAngles = resolveIdealAngles(cycleAtomIds.length);
  const currentAngles = cycleAtomIds.flatMap((atomId) => {
    const originalPosition = originalPositions.get(atomId);

    if (originalPosition === undefined) {
      return [];
    }

    return [resolveAngleBetween(center, originalPosition)];
  });
  const rotation = chooseRootRotation(baseAngles, currentAngles);
  const rotatedAngles = rotateAngles(baseAngles, rotation);
  const nextPositions = new Map<string, { x: number; y: number }>();

  cycleAtomIds.forEach((atomId, index) => {
    const targetAngle = rotatedAngles[index] ?? rotatedAngles[rotatedAngles.length - 1] ?? 0;
    const radians = (targetAngle * Math.PI) / 180;
    nextPositions.set(atomId, {
      x: center.x + Math.cos(radians) * radius,
      y: center.y + Math.sin(radians) * radius,
    });
  });

  const score = cycleAtomIds.reduce((sum, atomId) => {
    const originalPosition = originalPositions.get(atomId);
    const nextPosition = nextPositions.get(atomId);

    if (originalPosition === undefined || nextPosition === undefined) {
      return sum;
    }

    return sum + distanceBetween(originalPosition, nextPosition);
  }, 0);

  return {
    score,
    positions: nextPositions,
  };
}

export {
  chooseRootRotation,
  findFirstCycleInComponent,
  resolveCycleCenter,
  resolveCycleRadius,
  resolveRegularCyclePositions,
  reverseCycleOrder,
};
