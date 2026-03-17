import { sortNeighborLinksByCurrentAngle } from '@/shared/utils/moleculeLayoutAttachment';
import {
  chooseRootRotation,
  findFirstCycleInComponent,
  resolveCycleCenter,
  resolveCycleRadius,
  resolveRegularCyclePositions,
  reverseCycleOrder,
} from '@/shared/utils/moleculeLayoutCycles';
import { resolveIdealBondLengthForAtoms } from '@/shared/utils/moleculeLayoutGraph';
import { normalizeAngle, resolveAngleBetween, resolveIdealAngles, rotateAngles } from '@/shared/utils/moleculeLayoutGeometry';
import type { CycleLayoutParams } from '@/shared/utils/moleculeLayoutRebalance.types';

export function applyCycleLayout({
  model,
  componentAtomIds,
  neighborMap,
  originalPositions,
  nextPositions,
  visited,
  layoutBranch,
}: CycleLayoutParams): boolean {
  const cycleAtomIds = findFirstCycleInComponent(componentAtomIds, neighborMap);

  if (cycleAtomIds === null || cycleAtomIds.length < 3) {
    return false;
  }

  const cycleCenter = resolveCycleCenter(cycleAtomIds, originalPositions);
  const cycleRadius = resolveCycleRadius(model, cycleAtomIds);
  const cycleOrders = [cycleAtomIds, reverseCycleOrder(cycleAtomIds)];
  const bestCycleLayout = cycleOrders
    .map((cycleOrder) => resolveRegularCyclePositions(cycleOrder, cycleCenter, cycleRadius, originalPositions))
    .reduce((bestLayout, candidateLayout) => {
      if (bestLayout === null || candidateLayout.score < bestLayout.score) {
        return candidateLayout;
      }

      return bestLayout;
    }, null as ReturnType<typeof resolveRegularCyclePositions> | null);

  if (bestCycleLayout === null) {
    return false;
  }

  const cycleAtomIdSet = new Set(cycleAtomIds);

  bestCycleLayout.positions.forEach((position, atomId) => {
    nextPositions.set(atomId, position);
    visited.add(atomId);
  });

  cycleAtomIds.forEach((cycleAtomId) => {
    const cycleAtomPosition = nextPositions.get(cycleAtomId);

    if (cycleAtomPosition === undefined) {
      return;
    }

    const branchLinks = sortNeighborLinksByCurrentAngle(
      cycleAtomId,
      (neighborMap.get(cycleAtomId) ?? []).filter((neighbor) => {
        return componentAtomIds.has(neighbor.atomId) && !cycleAtomIdSet.has(neighbor.atomId) && !visited.has(neighbor.atomId);
      }),
      originalPositions,
    );

    if (branchLinks.length === 0) {
      return;
    }

    const outwardAngle = resolveAngleBetween(cycleCenter, cycleAtomPosition);
    const preferredBranchAngles = resolvePreferredBranchAngles(branchLinks.length, outwardAngle);

    branchLinks.forEach((neighbor, index) => {
      const targetAngle =
        preferredBranchAngles[index] ?? preferredBranchAngles[preferredBranchAngles.length - 1] ?? outwardAngle;
      const radius = resolveIdealBondLengthForAtoms(model, cycleAtomId, neighbor.atomId, neighbor.order);
      const radians = (targetAngle * Math.PI) / 180;

      nextPositions.set(neighbor.atomId, {
        x: cycleAtomPosition.x + Math.cos(radians) * radius,
        y: cycleAtomPosition.y + Math.sin(radians) * radius,
      });
    });

    branchLinks.forEach((neighbor, index) => {
      const targetAngle =
        preferredBranchAngles[index] ?? preferredBranchAngles[preferredBranchAngles.length - 1] ?? outwardAngle;
      layoutBranch(neighbor.atomId, cycleAtomId, normalizeAngle(targetAngle + 180));
    });
  });

  return true;
}

export function resolveRootChildAngles(
  childAtomIds: string[],
  originalPositions: Map<string, { x: number; y: number }>,
  anchorPosition: { x: number; y: number },
) {
  return rotateAngles(
    resolveIdealAngles(childAtomIds.length),
    chooseRootRotation(
      resolveIdealAngles(childAtomIds.length),
      childAtomIds.flatMap((atomId) => {
        const neighborPosition = originalPositions.get(atomId);

        if (neighborPosition === undefined) {
          return [];
        }

        return [resolveAngleBetween(anchorPosition, neighborPosition)];
      }),
    ),
  );
}

function resolvePreferredBranchAngles(connectionCount: number, preferredAngle: number): number[] {
  const canonicalOffsetsByCount: Record<number, number[]> = {
    1: [0],
    2: [-55, 55],
    3: [-85, 0, 85],
  };
  const canonicalOffsets = canonicalOffsetsByCount[Math.min(connectionCount, 3)] ?? [-95, -30, 30, 95];

  return canonicalOffsets.map((offset) => normalizeAngle(preferredAngle + offset));
}
