import type { MoleculeModel } from '@/shared/utils/moleculeEditor';
import { findAtom, wouldCollide } from '@/shared/utils/moleculeLayoutGraph';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph';
import { normalizeAngle, resolveAngleBetween } from '@/shared/utils/moleculeLayoutGeometry';

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

export { chooseAttachmentPoint, sortNeighborLinksByCurrentAngle };
