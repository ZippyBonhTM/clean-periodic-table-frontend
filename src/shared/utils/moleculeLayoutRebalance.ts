import type { MoleculeAtom, MoleculeModel } from '@/shared/utils/moleculeEditor';
import { sortNeighborLinksByCurrentAngle } from '@/shared/utils/moleculeLayoutAttachment';
import {
  resolveAcyclicBackboneCandidatePositions,
  resolveAtomCentroid,
  resolvePreferredAcyclicBackbonePath,
  resolvePreferredAttachmentAngles,
  resolvePreferredBranchAngles,
} from '@/shared/utils/moleculeLayoutBackbone';
import {
  chooseRootRotation,
  findFirstCycleInComponent,
  resolveCycleCenter,
  resolveCycleRadius,
  resolveRegularCyclePositions,
  reverseCycleOrder,
} from '@/shared/utils/moleculeLayoutCycles';
import {
  resolveIdealBondLengthForAtoms,
} from '@/shared/utils/moleculeLayoutGraph';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph';
import {
  distanceBetween,
  normalizeAngle,
  resolveAngleBetween,
  resolveIdealAngles,
  rotateAngles,
} from '@/shared/utils/moleculeLayoutGeometry';

type LayoutBranchFn = (
  atomId: string,
  parentAtomId: string | null,
  incomingAngle?: number,
  preferredChildAngles?: number[],
) => void;

type SharedLayoutParams = {
  model: MoleculeModel;
  componentAtomIds: Set<string>;
  neighborMap: Map<string, NeighborLink[]>;
  originalPositions: Map<string, { x: number; y: number }>;
  nextPositions: Map<string, { x: number; y: number }>;
  visited: Set<string>;
  layoutBranch: LayoutBranchFn;
};

type CycleLayoutParams = SharedLayoutParams;

type BackboneLayoutParams = SharedLayoutParams & {
  atomById: Map<string, MoleculeAtom>;
  anchorPosition: { x: number; y: number };
  resolvedAnchorAtomId: string;
};

function applyCycleLayout({
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

function applyBackboneLayout({
  model,
  atomById,
  componentAtomIds,
  neighborMap,
  originalPositions,
  nextPositions,
  visited,
  anchorPosition,
  resolvedAnchorAtomId,
  layoutBranch,
}: BackboneLayoutParams): boolean {
  const backboneAtomIds = resolvePreferredAcyclicBackbonePath(
    componentAtomIds,
    atomById,
    neighborMap,
    resolvedAnchorAtomId,
  );

  if (backboneAtomIds === null || backboneAtomIds.length < 3) {
    return false;
  }

  const anchorBackboneAtomId = backboneAtomIds.includes(resolvedAnchorAtomId) ? resolvedAnchorAtomId : backboneAtomIds[0];
  const anchorBackbonePosition = originalPositions.get(anchorBackboneAtomId) ?? anchorPosition;
  const backboneCandidates = [
    resolveAcyclicBackboneCandidatePositions(
      model,
      backboneAtomIds,
      anchorBackboneAtomId,
      anchorBackbonePosition,
      1,
      1,
    ),
    resolveAcyclicBackboneCandidatePositions(
      model,
      backboneAtomIds,
      anchorBackboneAtomId,
      anchorBackbonePosition,
      1,
      -1,
    ),
    resolveAcyclicBackboneCandidatePositions(
      model,
      backboneAtomIds,
      anchorBackboneAtomId,
      anchorBackbonePosition,
      -1,
      1,
    ),
    resolveAcyclicBackboneCandidatePositions(
      model,
      backboneAtomIds,
      anchorBackboneAtomId,
      anchorBackbonePosition,
      -1,
      -1,
    ),
  ];
  const bestBackbonePositions = backboneCandidates.reduce((bestCandidate, candidate) => {
    const candidateScore = backboneAtomIds.reduce((sum, atomId) => {
      const candidatePosition = candidate.get(atomId);
      const originalPosition = originalPositions.get(atomId);

      if (candidatePosition === undefined || originalPosition === undefined) {
        return sum;
      }

      return sum + distanceBetween(candidatePosition, originalPosition);
    }, 0);

    if (bestCandidate === null || candidateScore < bestCandidate.score) {
      return {
        score: candidateScore,
        positions: candidate,
      };
    }

    return bestCandidate;
  }, null as { score: number; positions: Map<string, { x: number; y: number }> } | null);

  if (bestBackbonePositions === null) {
    return false;
  }

  const backboneAtomIdSet = new Set(backboneAtomIds);
  const backboneCenter = resolveAtomCentroid(backboneAtomIds, bestBackbonePositions.positions);

  bestBackbonePositions.positions.forEach((position, atomId) => {
    nextPositions.set(atomId, position);
    visited.add(atomId);
  });

  backboneAtomIds.forEach((backboneAtomId) => {
    const backboneAtomPosition = nextPositions.get(backboneAtomId);

    if (backboneAtomPosition === undefined) {
      return;
    }

    const occupiedAngles = (neighborMap.get(backboneAtomId) ?? []).flatMap((neighbor) => {
      if (!backboneAtomIdSet.has(neighbor.atomId)) {
        return [];
      }

      const neighborPosition = nextPositions.get(neighbor.atomId);

      if (neighborPosition === undefined) {
        return [];
      }

      return [resolveAngleBetween(backboneAtomPosition, neighborPosition)];
    });
    const branchLinks = sortNeighborLinksByCurrentAngle(
      backboneAtomId,
      (neighborMap.get(backboneAtomId) ?? []).filter((neighbor) => {
        return componentAtomIds.has(neighbor.atomId) && !backboneAtomIdSet.has(neighbor.atomId) && !visited.has(neighbor.atomId);
      }),
      originalPositions,
    );

    if (branchLinks.length === 0) {
      return;
    }

    const preferredOutwardAngle = resolveAngleBetween(backboneCenter, backboneAtomPosition);
    const attachmentAngles = resolvePreferredAttachmentAngles(
      occupiedAngles,
      branchLinks.length,
      preferredOutwardAngle,
    );

    branchLinks.forEach((neighbor, index) => {
      const targetAngle =
        attachmentAngles[index] ?? attachmentAngles[attachmentAngles.length - 1] ?? preferredOutwardAngle;
      const radius = resolveIdealBondLengthForAtoms(model, backboneAtomId, neighbor.atomId, neighbor.order);
      const radians = (targetAngle * Math.PI) / 180;

      nextPositions.set(neighbor.atomId, {
        x: backboneAtomPosition.x + Math.cos(radians) * radius,
        y: backboneAtomPosition.y + Math.sin(radians) * radius,
      });
    });

    branchLinks.forEach((neighbor, index) => {
      const targetAngle =
        attachmentAngles[index] ?? attachmentAngles[attachmentAngles.length - 1] ?? preferredOutwardAngle;
      layoutBranch(neighbor.atomId, backboneAtomId, normalizeAngle(targetAngle + 180));
    });
  });

  return true;
}

function resolveRootChildAngles(
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

export { applyBackboneLayout, applyCycleLayout, resolveRootChildAngles };
