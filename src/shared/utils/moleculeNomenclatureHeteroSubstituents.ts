import { resolveSymbol } from '@/shared/utils/moleculeNomenclatureGraph';
import type {
  NeighborLink,
  NomenclatureAtom,
} from '@/shared/utils/moleculeNomenclature.types';

export function isSupportedAminoSubstituent(
  atomId: string,
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): boolean {
  if (resolveSymbol(atomById, atomId) !== 'N') {
    return false;
  }

  const neighbors = neighborMap.get(atomId) ?? [];

  if (neighbors.length === 0 || neighbors.some((neighbor) => neighbor.order !== 1)) {
    return false;
  }

  const carbonNeighborCount = neighbors.filter((neighbor) => resolveSymbol(atomById, neighbor.atomId) === 'C').length;
  const hydrogenNeighborCount = neighbors.filter((neighbor) => resolveSymbol(atomById, neighbor.atomId) === 'H').length;
  const hasUnsupportedNeighbor = neighbors.some((neighbor) => {
    const symbol = resolveSymbol(atomById, neighbor.atomId);
    return symbol !== 'C' && symbol !== 'H';
  });

  if (hasUnsupportedNeighbor || carbonNeighborCount !== 1) {
    return false;
  }

  return hydrogenNeighborCount >= 1 && carbonNeighborCount + hydrogenNeighborCount === neighbors.length;
}

export function isSupportedNitrileGroup(
  chainCarbonAtomId: string,
  nitrogenAtomId: string,
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): boolean {
  if (resolveSymbol(atomById, nitrogenAtomId) !== 'N') {
    return false;
  }

  const nitrogenNeighbors = neighborMap.get(nitrogenAtomId) ?? [];

  if (
    nitrogenNeighbors.length !== 1 ||
    nitrogenNeighbors[0]?.atomId !== chainCarbonAtomId ||
    nitrogenNeighbors[0]?.order !== 3
  ) {
    return false;
  }

  const carbonNeighbors = (neighborMap.get(chainCarbonAtomId) ?? []).filter((neighbor) => neighbor.atomId !== nitrogenAtomId);
  const carbonNeighborCount = carbonNeighbors.filter((neighbor) => resolveSymbol(atomById, neighbor.atomId) === 'C').length;
  const hydrogenNeighborCount = carbonNeighbors.filter((neighbor) => resolveSymbol(atomById, neighbor.atomId) === 'H').length;
  const hasUnsupportedNeighbor = carbonNeighbors.some((neighbor) => {
    const symbol = resolveSymbol(atomById, neighbor.atomId);
    return neighbor.order !== 1 || (symbol !== 'C' && symbol !== 'H');
  });

  if (hasUnsupportedNeighbor || carbonNeighborCount > 1) {
    return false;
  }

  return carbonNeighborCount + hydrogenNeighborCount === carbonNeighbors.length;
}
