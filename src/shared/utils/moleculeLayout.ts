import type { MoleculeModel } from '@/shared/utils/moleculeEditor';
import {
  buildNeighborMap,
  findAtom,
  resolveConnectedComponent,
  resolveIdealBondLengthForAtoms,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
} from '@/shared/utils/moleculeLayoutGraph';
import { chooseAttachmentPoint, sortNeighborLinksByCurrentAngle } from '@/shared/utils/moleculeLayoutAttachment';
import { distanceBetween, normalizeAngle, resolveIdealAngles, resolveIdealBondLength, rotateAngles } from '@/shared/utils/moleculeLayoutGeometry';
import {
  applyBackboneLayout,
  applyCycleLayout,
  resolveRootChildAngles,
} from '@/shared/utils/moleculeLayoutRebalance';

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
          ? resolveRootChildAngles(
              childLinks.map((neighbor) => neighbor.atomId),
              originalPositions,
              anchorPosition,
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

  const appliedCycleLayout = applyCycleLayout({
    model,
    componentAtomIds,
    neighborMap,
    originalPositions,
    nextPositions,
    visited,
    layoutBranch,
  });

  if (!appliedCycleLayout) {
    applyBackboneLayout({
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
    });
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

export {
  chooseAttachmentPoint,
  distanceBetween,
  rebalanceMoleculeLayout,
  resolveIdealBondLength,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
};
