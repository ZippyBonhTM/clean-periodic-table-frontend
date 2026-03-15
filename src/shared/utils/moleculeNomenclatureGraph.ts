import type { BondOrder, MoleculeModel, NeighborLink, NomenclatureAtom } from '@/shared/utils/moleculeNomenclature.types';

function buildNeighborMap(model: MoleculeModel): Map<string, NeighborLink[]> {
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

function resolveConnectedComponent(
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

function buildAtomMap(model: MoleculeModel): Map<string, NomenclatureAtom> {
  return new Map(model.atoms.map((atom) => [atom.id, atom]));
}

function resolveSymbol(atomById: Map<string, NomenclatureAtom>, atomId: string): string | null {
  return atomById.get(atomId)?.element.symbol ?? null;
}

function buildCarbonNeighborMap(
  carbonAtomIds: string[],
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): Map<string, NeighborLink[]> {
  const carbonIdSet = new Set(carbonAtomIds);
  const carbonNeighborMap = new Map<string, NeighborLink[]>();

  carbonAtomIds.forEach((atomId) => {
    const neighbors = (neighborMap.get(atomId) ?? []).filter((neighbor) => {
      return carbonIdSet.has(neighbor.atomId) && resolveSymbol(atomById, neighbor.atomId) === 'C';
    });

    carbonNeighborMap.set(atomId, neighbors);
  });

  return carbonNeighborMap;
}

function hasCycleInGraph(neighborMap: Map<string, NeighborLink[]>, startAtomId: string): boolean {
  const visited = new Set<string>();

  const visit = (atomId: string, parentAtomId: string | null): boolean => {
    visited.add(atomId);

    for (const neighbor of neighborMap.get(atomId) ?? []) {
      if (neighbor.atomId === parentAtomId) {
        continue;
      }

      if (visited.has(neighbor.atomId)) {
        return true;
      }

      if (visit(neighbor.atomId, atomId)) {
        return true;
      }
    }

    return false;
  };

  return visit(startAtomId, null);
}

function isConnectedGraph(atomIds: string[], neighborMap: Map<string, NeighborLink[]>): boolean {
  if (atomIds.length <= 1) {
    return true;
  }

  const visited = resolveConnectedComponent(atomIds[0], neighborMap);
  return atomIds.every((atomId) => visited.has(atomId));
}

function resolveBondOrderBetween(
  firstAtomId: string,
  secondAtomId: string,
  neighborMap: Map<string, NeighborLink[]>,
): BondOrder | null {
  return neighborMap.get(firstAtomId)?.find((neighbor) => neighbor.atomId === secondAtomId)?.order ?? null;
}

export {
  buildAtomMap,
  buildCarbonNeighborMap,
  buildNeighborMap,
  hasCycleInGraph,
  isConnectedGraph,
  resolveBondOrderBetween,
  resolveConnectedComponent,
  resolveSymbol,
};
