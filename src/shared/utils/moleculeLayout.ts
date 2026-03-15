import type { MoleculeModel } from '@/shared/utils/moleculeEditor';
import {
  buildNeighborMap,
  findAtom,
  resolveConnectedComponent,
  resolveIdealBondLengthForAtoms,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
  wouldCollide,
} from '@/shared/utils/moleculeLayoutGraph';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph';
import {
  distanceBetween,
  normalizeAngle,
  resolveAngleBetween,
  resolveIdealAngles,
  resolveIdealBondLength,
  rotateAngles,
} from '@/shared/utils/moleculeLayoutGeometry';
import {
  chooseRootRotation,
  findFirstCycleInComponent,
  resolveCycleCenter,
  resolveCycleRadius,
  resolveRegularCyclePositions,
  reverseCycleOrder,
} from '@/shared/utils/moleculeLayoutCycles';
import {
  resolveAcyclicBackboneCandidatePositions,
  resolveAtomCentroid,
  resolvePreferredAcyclicBackbonePath,
  resolvePreferredAttachmentAngles,
  resolvePreferredBranchAngles,
} from '@/shared/utils/moleculeLayoutBackbone';

const ATTACHMENT_ANGLES = [0, 60, 120, 180, 240, 300, 30, 150, 210, 330];
const ATTACHMENT_RADII = [84, 106, 128, 150];

function resolveNeighborAngles(model: MoleculeModel, atomId: string): number[] {
  const centerAtom = findAtom(model, atomId);

  if (centerAtom === null) {
    return [];
  }

  return model.bonds.flatMap((bond) => {
    const neighborId = bond.sourceId === atomId ? bond.targetId : bond.targetId === atomId ? bond.sourceId : null;

    if (neighborId === null) {
      return [];
    }

    const neighbor = findAtom(model, neighborId);

    if (neighbor === null) {
      return [];
    }

    const angle = (Math.atan2(neighbor.y - centerAtom.y, neighbor.x - centerAtom.x) * 180) / Math.PI;
    return [angle];
  });
}

function sortNeighborLinksByCurrentAngle(
  atomId: string,
  neighborLinks: NeighborLink[],
  positionsByAtomId: Map<string, { x: number; y: number }>,
) {
  const atomPosition = positionsByAtomId.get(atomId);

  if (atomPosition === undefined) {
    return [...neighborLinks];
  }

  return [...neighborLinks].sort((firstNeighbor, secondNeighbor) => {
    const firstPosition = positionsByAtomId.get(firstNeighbor.atomId);
    const secondPosition = positionsByAtomId.get(secondNeighbor.atomId);

    if (firstPosition === undefined || secondPosition === undefined) {
      return firstNeighbor.atomId.localeCompare(secondNeighbor.atomId);
    }

    const firstAngle = resolveAngleBetween(atomPosition, firstPosition);
    const secondAngle = resolveAngleBetween(atomPosition, secondPosition);

    if (firstAngle !== secondAngle) {
      return firstAngle - secondAngle;
    }

    return firstNeighbor.atomId.localeCompare(secondNeighbor.atomId);
  });
}


function rebalanceMoleculeLayout(model: MoleculeModel, anchorAtomId?: string | null): MoleculeModel {
  if (model.atoms.length <= 1) {
    return model;
  }

  const resolvedAnchorAtomId = anchorAtomId ?? model.atoms[0]?.id;

  if (resolvedAnchorAtomId === undefined || findAtom(model, resolvedAnchorAtomId) === null) {
    return model;
  }

  const neighborMap = buildNeighborMap(model);
  const componentAtomIds = resolveConnectedComponent(resolvedAnchorAtomId, neighborMap);

  if (componentAtomIds.size <= 1) {
    return model;
  }

  const originalPositions = new Map(
    model.atoms.map((atom) => [
      atom.id,
      {
        x: atom.x,
        y: atom.y,
      },
    ]),
  );
  const atomById = new Map(model.atoms.map((atom) => [atom.id, atom]));
  const nextPositions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const anchorPosition = originalPositions.get(resolvedAnchorAtomId);

  if (anchorPosition === undefined) {
    return model;
  }

  nextPositions.set(resolvedAnchorAtomId, anchorPosition);

  const layoutBranch = (
    atomId: string,
    parentAtomId: string | null,
    incomingAngle?: number,
    preferredChildAngles?: number[],
  ) => {
    visited.add(atomId);

    const atomPosition = nextPositions.get(atomId) ?? originalPositions.get(atomId);

    if (atomPosition === undefined) {
      return;
    }

    const childLinks = sortNeighborLinksByCurrentAngle(
      atomId,
      (neighborMap.get(atomId) ?? []).filter((neighbor) => {
        return componentAtomIds.has(neighbor.atomId) && neighbor.atomId !== parentAtomId && !visited.has(neighbor.atomId);
      }),
      originalPositions,
    );

    if (childLinks.length === 0) {
      return;
    }

    const targetAngles =
      preferredChildAngles !== undefined && preferredChildAngles.length >= childLinks.length
        ? preferredChildAngles
        : parentAtomId === null
          ? rotateAngles(
              resolveIdealAngles(childLinks.length),
              chooseRootRotation(
                resolveIdealAngles(childLinks.length),
                childLinks.flatMap((neighbor) => {
                  const neighborPosition = originalPositions.get(neighbor.atomId);

                  if (neighborPosition === undefined) {
                    return [];
                  }

                  return [resolveAngleBetween(anchorPosition, neighborPosition)];
                }),
              ),
            )
          : rotateAngles(resolveIdealAngles(childLinks.length + 1), incomingAngle ?? 0).slice(1);

    childLinks.forEach((neighbor, index) => {
      const targetAngle = targetAngles[index] ?? targetAngles[targetAngles.length - 1] ?? 0;
      const radius = resolveIdealBondLengthForAtoms(model, atomId, neighbor.atomId, neighbor.order);
      const radians = (targetAngle * Math.PI) / 180;

      nextPositions.set(neighbor.atomId, {
        x: atomPosition.x + Math.cos(radians) * radius,
        y: atomPosition.y + Math.sin(radians) * radius,
      });
    });

    childLinks.forEach((neighbor, index) => {
      const targetAngle = targetAngles[index] ?? targetAngles[targetAngles.length - 1] ?? 0;
      layoutBranch(neighbor.atomId, atomId, normalizeAngle(targetAngle + 180));
    });
  };

  const cycleAtomIds = findFirstCycleInComponent(componentAtomIds, neighborMap);

  if (cycleAtomIds !== null && cycleAtomIds.length >= 3) {
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

    if (bestCycleLayout !== null) {
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
            return (
              componentAtomIds.has(neighbor.atomId) &&
              !cycleAtomIdSet.has(neighbor.atomId) &&
              !visited.has(neighbor.atomId)
            );
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
    }
  } else {
    const backboneAtomIds = resolvePreferredAcyclicBackbonePath(
      componentAtomIds,
      atomById,
      neighborMap,
      resolvedAnchorAtomId,
    );

    if (backboneAtomIds !== null && backboneAtomIds.length >= 3) {
      const anchorBackboneAtomId = backboneAtomIds.includes(resolvedAnchorAtomId)
        ? resolvedAnchorAtomId
        : backboneAtomIds[0];
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

      if (bestBackbonePositions !== null) {
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
              return (
                componentAtomIds.has(neighbor.atomId) &&
                !backboneAtomIdSet.has(neighbor.atomId) &&
                !visited.has(neighbor.atomId)
              );
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
      }
    }
  }

  if (nextPositions.size === 1) {
    layoutBranch(resolvedAnchorAtomId, null);
  }

  const nextAnchorPosition = nextPositions.get(resolvedAnchorAtomId);

  if (nextAnchorPosition !== undefined) {
    const translateX = anchorPosition.x - nextAnchorPosition.x;
    const translateY = anchorPosition.y - nextAnchorPosition.y;

    if (translateX !== 0 || translateY !== 0) {
      nextPositions.forEach((position, atomId) => {
        nextPositions.set(atomId, {
          x: position.x + translateX,
          y: position.y + translateY,
        });
      });
    }
  }

  return {
    atoms: model.atoms.map((atom) => {
      const nextPosition = nextPositions.get(atom.id);

      if (nextPosition === undefined) {
        return atom;
      }

      return {
        ...atom,
        x: nextPosition.x,
        y: nextPosition.y,
      };
    }),
    bonds: model.bonds,
  };
}

function chooseAttachmentPoint(model: MoleculeModel, parentId: string): { x: number; y: number } | null {
  const parent = findAtom(model, parentId);

  if (parent === null) {
    return null;
  }

  const neighborAngles = resolveNeighborAngles(model, parentId).map(normalizeAngle);

  for (const radius of ATTACHMENT_RADII) {
    for (const baseAngle of ATTACHMENT_ANGLES) {
      const isOccupied = neighborAngles.some((angle) => Math.abs(angle - normalizeAngle(baseAngle)) < 24);

      if (isOccupied) {
        continue;
      }

      const radians = (baseAngle * Math.PI) / 180;
      const candidate = {
        x: parent.x + Math.cos(radians) * radius,
        y: parent.y + Math.sin(radians) * radius,
      };

      if (!wouldCollide(model, candidate)) {
        return candidate;
      }
    }
  }

  return {
    x: parent.x + 96,
    y: parent.y,
  };
}

export {
  chooseAttachmentPoint,
  distanceBetween,
  rebalanceMoleculeLayout,
  resolveIdealBondLength,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
};
