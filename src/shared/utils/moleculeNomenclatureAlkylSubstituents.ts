import { ALKYL_NAMES } from '@/shared/utils/moleculeNomenclature.types';
import { resolveSymbol } from '@/shared/utils/moleculeNomenclatureGraph';
import type {
  NeighborLink,
  NomenclatureAtom,
} from '@/shared/utils/moleculeNomenclature.types';

export function resolveSubtreeAtoms(
  rootAtomId: string,
  chainAtomIds: Set<string>,
  neighborMap: Map<string, NeighborLink[]>,
): Set<string> {
  const visited = new Set<string>();
  const queue = [rootAtomId];

  while (queue.length > 0) {
    const atomId = queue.pop();

    if (atomId === undefined || visited.has(atomId) || chainAtomIds.has(atomId)) {
      continue;
    }

    visited.add(atomId);

    for (const neighbor of neighborMap.get(atomId) ?? []) {
      if (!visited.has(neighbor.atomId) && !chainAtomIds.has(neighbor.atomId)) {
        queue.push(neighbor.atomId);
      }
    }
  }

  return visited;
}

export function resolveLinearAlkylSubstituentName(
  rootAtomId: string,
  chainAtomIds: Set<string>,
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): string | null {
  const subtreeAtomIds = resolveSubtreeAtoms(rootAtomId, chainAtomIds, neighborMap);

  if (subtreeAtomIds.size === 0) {
    return null;
  }

  const subtreeCarbonIds = [...subtreeAtomIds].filter((atomId) => resolveSymbol(atomById, atomId) === 'C');

  if (subtreeCarbonIds.length === 0 || !subtreeCarbonIds.includes(rootAtomId)) {
    return null;
  }

  for (const atomId of subtreeAtomIds) {
    const symbol = resolveSymbol(atomById, atomId);

    if (symbol !== 'C' && symbol !== 'H') {
      return null;
    }

    const externalNeighbors = (neighborMap.get(atomId) ?? []).filter((neighbor) => {
      return !subtreeAtomIds.has(neighbor.atomId) && !chainAtomIds.has(neighbor.atomId);
    });

    if (externalNeighbors.length > 0) {
      return null;
    }
  }

  const subtreeCarbonIdSet = new Set(subtreeCarbonIds);

  for (const carbonAtomId of subtreeCarbonIds) {
    const carbonNeighbors = (neighborMap.get(carbonAtomId) ?? []).filter((neighbor) => {
      return subtreeCarbonIdSet.has(neighbor.atomId) && resolveSymbol(atomById, neighbor.atomId) === 'C';
    });

    if (carbonNeighbors.some((neighbor) => neighbor.order !== 1)) {
      return null;
    }

    if (carbonNeighbors.length > 2) {
      return null;
    }
  }

  const rootNeighbors = (neighborMap.get(rootAtomId) ?? []).filter((neighbor) => {
    return subtreeCarbonIdSet.has(neighbor.atomId) && resolveSymbol(atomById, neighbor.atomId) === 'C';
  });

  if (rootNeighbors.length > 1) {
    return null;
  }

  const endpointCount = subtreeCarbonIds.filter((carbonAtomId) => {
    const carbonNeighbors = (neighborMap.get(carbonAtomId) ?? []).filter((neighbor) => {
      return subtreeCarbonIdSet.has(neighbor.atomId) && resolveSymbol(atomById, neighbor.atomId) === 'C';
    });

    return carbonNeighbors.length <= 1;
  }).length;

  if (!(subtreeCarbonIds.length === 1 || endpointCount === 2)) {
    return null;
  }

  return ALKYL_NAMES[subtreeCarbonIds.length] ?? null;
}
