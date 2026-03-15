import {
  hasCycleInGraph,
  isConnectedGraph,
  resolveSymbol,
} from '@/shared/utils/moleculeNomenclatureGraph';
import type { MoleculeModel, NeighborLink, NomenclatureAtom } from '@/shared/utils/moleculeNomenclature.types';

function isUnsubstitutedBenzene(
  model: MoleculeModel,
  atomById: Map<string, NomenclatureAtom>,
  carbonAtomIds: string[],
  carbonNeighborMap: Map<string, NeighborLink[]>,
  neighborMap: Map<string, NeighborLink[]>,
): boolean {
  if (carbonAtomIds.length !== 6) {
    return false;
  }

  if (!isConnectedGraph(carbonAtomIds, carbonNeighborMap) || !hasCycleInGraph(carbonNeighborMap, carbonAtomIds[0])) {
    return false;
  }

  const carbonBonds = model.bonds.filter((bond) => {
    return resolveSymbol(atomById, bond.sourceId) === 'C' && resolveSymbol(atomById, bond.targetId) === 'C';
  });

  if (carbonBonds.length !== 6) {
    return false;
  }

  const doubleBondCount = carbonBonds.filter((bond) => bond.order === 2).length;
  const singleBondCount = carbonBonds.filter((bond) => bond.order === 1).length;

  if (doubleBondCount !== 3 || singleBondCount !== 3) {
    return false;
  }

  return model.atoms.every((atom) => {
    if (atom.element.symbol === 'C') {
      return (carbonNeighborMap.get(atom.id) ?? []).length === 2;
    }

    if (atom.element.symbol !== 'H') {
      return false;
    }

    const neighbors = neighborMap.get(atom.id) ?? [];
    return neighbors.length === 1 && resolveSymbol(atomById, neighbors[0].atomId) === 'C';
  });
}

function isSupportedBoronicAcidSubstituent(
  atomId: string,
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): boolean {
  if (resolveSymbol(atomById, atomId) !== 'B') {
    return false;
  }

  const neighbors = neighborMap.get(atomId) ?? [];

  if (neighbors.length !== 3 || neighbors.some((neighbor) => neighbor.order !== 1)) {
    return false;
  }

  const carbonNeighborCount = neighbors.filter((neighbor) => resolveSymbol(atomById, neighbor.atomId) === 'C').length;
  const oxygenNeighbors = neighbors.filter((neighbor) => resolveSymbol(atomById, neighbor.atomId) === 'O');
  const hasUnsupportedNeighbor = neighbors.some((neighbor) => {
    const symbol = resolveSymbol(atomById, neighbor.atomId);
    return symbol !== 'C' && symbol !== 'O';
  });

  if (hasUnsupportedNeighbor || carbonNeighborCount !== 1 || oxygenNeighbors.length !== 2) {
    return false;
  }

  return oxygenNeighbors.every((neighbor) => {
    const oxygenLinks = neighborMap.get(neighbor.atomId) ?? [];

    if (oxygenLinks.length !== 2 || oxygenLinks.some((oxygenLink) => oxygenLink.order !== 1)) {
      return false;
    }

    const boronCount = oxygenLinks.filter((oxygenLink) => resolveSymbol(atomById, oxygenLink.atomId) === 'B').length;
    const hydrogenCount = oxygenLinks.filter((oxygenLink) => resolveSymbol(atomById, oxygenLink.atomId) === 'H').length;
    const hasUnsupportedOxygenNeighbor = oxygenLinks.some((oxygenLink) => {
      const symbol = resolveSymbol(atomById, oxygenLink.atomId);
      return symbol !== 'B' && symbol !== 'H';
    });

    return !hasUnsupportedOxygenNeighbor && boronCount === 1 && hydrogenCount === 1;
  });
}

function resolveSupportedBenzeneName(
  model: MoleculeModel,
  atomById: Map<string, NomenclatureAtom>,
  carbonAtomIds: string[],
  carbonNeighborMap: Map<string, NeighborLink[]>,
  neighborMap: Map<string, NeighborLink[]>,
): string | null {
  if (carbonAtomIds.length !== 6) {
    return null;
  }

  if (!isConnectedGraph(carbonAtomIds, carbonNeighborMap) || !hasCycleInGraph(carbonNeighborMap, carbonAtomIds[0])) {
    return null;
  }

  const carbonBonds = model.bonds.filter((bond) => {
    return resolveSymbol(atomById, bond.sourceId) === 'C' && resolveSymbol(atomById, bond.targetId) === 'C';
  });

  if (carbonBonds.length !== 6) {
    return null;
  }

  const doubleBondCount = carbonBonds.filter((bond) => bond.order === 2).length;
  const singleBondCount = carbonBonds.filter((bond) => bond.order === 1).length;

  if (doubleBondCount !== 3 || singleBondCount !== 3) {
    return null;
  }

  if (
    carbonAtomIds.some((atomId) => {
      return (carbonNeighborMap.get(atomId) ?? []).length !== 2;
    })
  ) {
    return null;
  }

  if (isUnsubstitutedBenzene(model, atomById, carbonAtomIds, carbonNeighborMap, neighborMap)) {
    return 'benzeno';
  }

  const carbonIdSet = new Set(carbonAtomIds);
  let boronicAcidCount = 0;

  for (const carbonAtomId of carbonAtomIds) {
    const externalNonHydrogenNeighbors = (neighborMap.get(carbonAtomId) ?? []).filter((neighbor) => {
      return !carbonIdSet.has(neighbor.atomId) && resolveSymbol(atomById, neighbor.atomId) !== 'H';
    });

    if (externalNonHydrogenNeighbors.length > 1) {
      return null;
    }

    if (externalNonHydrogenNeighbors.length === 0) {
      continue;
    }

    if (!isSupportedBoronicAcidSubstituent(externalNonHydrogenNeighbors[0].atomId, atomById, neighborMap)) {
      return null;
    }

    boronicAcidCount += 1;
  }

  if (boronicAcidCount === 1) {
    return 'acido benzenoboronico';
  }

  return null;
}

export { resolveSupportedBenzeneName };
