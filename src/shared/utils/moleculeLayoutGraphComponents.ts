import type { MoleculeAtom, MoleculeComponent, MoleculeModel } from '@/shared/utils/moleculeEditor';
import type { NeighborLink } from '@/shared/utils/moleculeLayoutGraph.types';

export function buildNeighborMap(model: MoleculeModel): Map<string, NeighborLink[]> {
  const neighborMap = new Map<string, NeighborLink[]>();

  model.atoms.forEach((atom) => {
    neighborMap.set(atom.id, []);
  });

  model.bonds.forEach((bond) => {
    neighborMap.get(bond.sourceId)?.push({ atomId: bond.targetId, order: bond.order });
    neighborMap.get(bond.targetId)?.push({ atomId: bond.sourceId, order: bond.order });
  });

  return neighborMap;
}

export function resolveConnectedComponent(
  startAtomId: string,
  neighborMap: Map<string, NeighborLink[]>,
): Set<string> {
  const visited = new Set<string>();
  const queue = [startAtomId];

  while (queue.length > 0) {
    const atomId = queue.pop();

    if (atomId === undefined || visited.has(atomId)) {
      continue;
    }

    visited.add(atomId);
    const neighbors = neighborMap.get(atomId) ?? [];

    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor.atomId)) {
        queue.push(neighbor.atomId);
      }
    });
  }

  return visited;
}

function resolveAtomCollectionCenter(atoms: MoleculeAtom[]): { x: number; y: number } {
  if (atoms.length === 0) {
    return { x: 0, y: 0 };
  }

  const sums = atoms.reduce(
    (current, atom) => ({
      x: current.x + atom.x,
      y: current.y + atom.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: sums.x / atoms.length,
    y: sums.y / atoms.length,
  };
}

export function resolveMoleculeComponents(model: MoleculeModel): MoleculeComponent[] {
  if (model.atoms.length === 0) {
    return [];
  }

  const neighborMap = buildNeighborMap(model);
  const visited = new Set<string>();
  const components: MoleculeComponent[] = [];

  model.atoms.forEach((startAtom) => {
    if (visited.has(startAtom.id)) {
      return;
    }

    const componentAtomIds = resolveConnectedComponent(startAtom.id, neighborMap);
    componentAtomIds.forEach((atomId) => {
      visited.add(atomId);
    });

    const componentModel = {
      atoms: model.atoms.filter((atom) => componentAtomIds.has(atom.id)),
      bonds: model.bonds.filter(
        (bond) => componentAtomIds.has(bond.sourceId) && componentAtomIds.has(bond.targetId),
      ),
    };

    components.push({
      atomIds: componentModel.atoms.map((atom) => atom.id),
      bondIds: componentModel.bonds.map((bond) => bond.id),
      model: componentModel,
      center: resolveAtomCollectionCenter(componentModel.atoms),
      heavyAtomCount: componentModel.atoms.filter((atom) => atom.element.symbol !== 'H').length,
    });
  });

  return components.sort((first, second) => {
    if (first.center.x !== second.center.x) {
      return first.center.x - second.center.x;
    }

    if (first.center.y !== second.center.y) {
      return first.center.y - second.center.y;
    }

    return first.atomIds.length - second.atomIds.length;
  });
}

export function resolvePrimaryMoleculeComponentIndex(components: MoleculeComponent[]): number {
  if (components.length <= 1) {
    return 0;
  }

  let bestIndex = 0;

  for (let index = 1; index < components.length; index += 1) {
    const candidate = components[index];
    const best = components[bestIndex];

    if (candidate.heavyAtomCount !== best.heavyAtomCount) {
      if (candidate.heavyAtomCount > best.heavyAtomCount) {
        bestIndex = index;
      }

      continue;
    }

    if (candidate.model.bonds.length !== best.model.bonds.length) {
      if (candidate.model.bonds.length > best.model.bonds.length) {
        bestIndex = index;
      }

      continue;
    }

    if (candidate.model.atoms.length !== best.model.atoms.length) {
      if (candidate.model.atoms.length > best.model.atoms.length) {
        bestIndex = index;
      }

      continue;
    }
  }

  return bestIndex;
}
