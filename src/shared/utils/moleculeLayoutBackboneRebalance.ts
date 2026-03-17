import { sortNeighborLinksByCurrentAngle } from '@/shared/utils/moleculeLayoutAttachment';
import {
  resolveAcyclicBackboneCandidatePositions,
  resolveAtomCentroid,
  resolvePreferredAcyclicBackbonePath,
  resolvePreferredAttachmentAngles,
} from '@/shared/utils/moleculeLayoutBackbone';
import { resolveIdealBondLengthForAtoms } from '@/shared/utils/moleculeLayoutGraph';
import { distanceBetween, normalizeAngle, resolveAngleBetween } from '@/shared/utils/moleculeLayoutGeometry';
import type { BackboneLayoutParams } from '@/shared/utils/moleculeLayoutRebalance.types';

export function applyBackboneLayout({
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
