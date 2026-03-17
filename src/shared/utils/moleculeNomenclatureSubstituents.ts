import { HALOGEN_PREFIXES } from '@/shared/utils/moleculeNomenclature.types';
import { resolveSymbol } from '@/shared/utils/moleculeNomenclatureGraph';
import {
  resolveLinearAlkylSubstituentName,
} from '@/shared/utils/moleculeNomenclatureAlkylSubstituents';
import {
  isSupportedAminoSubstituent,
  isSupportedNitrileGroup,
} from '@/shared/utils/moleculeNomenclatureHeteroSubstituents';
import type {
  MoleculeChainContext,
  MoleculeSubstituent,
  NeighborLink,
  NomenclatureAtom,
} from '@/shared/utils/moleculeNomenclature.types';

function resolveSupportedContextForChain(
  orderedChainAtomIds: string[],
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): MoleculeChainContext | null {
  const chainAtomIdSet = new Set(orderedChainAtomIds);
  const nitrilePositions: number[] = [];
  const hydroxyPositions: number[] = [];
  const aminoPositions: number[] = [];
  const substituents: MoleculeSubstituent[] = [];
  const processedNitrileAtomIds = new Set<string>();
  const processedHydroxyAtomIds = new Set<string>();
  const processedAminoAtomIds = new Set<string>();
  const processedSubtreeRoots = new Set<string>();

  for (const [index, atomId] of orderedChainAtomIds.entries()) {
    const neighbors = neighborMap.get(atomId) ?? [];

    for (const neighbor of neighbors) {
      if (chainAtomIdSet.has(neighbor.atomId)) {
        continue;
      }

      const symbol = resolveSymbol(atomById, neighbor.atomId);

      if (symbol === 'H') {
        continue;
      }

      if (symbol === 'O') {
        if (processedHydroxyAtomIds.has(neighbor.atomId) || neighbor.order !== 1) {
          return null;
        }

        const oxygenNeighbors = neighborMap.get(neighbor.atomId) ?? [];
        const carbonNeighborIds = oxygenNeighbors.filter((oxygenNeighbor) => {
          return resolveSymbol(atomById, oxygenNeighbor.atomId) === 'C';
        });

        const hasUnsupportedNeighbor = oxygenNeighbors.some((oxygenNeighbor) => {
          const oxygenNeighborSymbol = resolveSymbol(atomById, oxygenNeighbor.atomId);
          return oxygenNeighbor.order !== 1 || (oxygenNeighborSymbol !== 'C' && oxygenNeighborSymbol !== 'H');
        });

        if (hasUnsupportedNeighbor || carbonNeighborIds.length !== 1) {
          return null;
        }

        processedHydroxyAtomIds.add(neighbor.atomId);
        hydroxyPositions.push(index + 1);
        continue;
      }

      if (symbol !== null && HALOGEN_PREFIXES[symbol] !== undefined) {
        const halogenNeighbors = neighborMap.get(neighbor.atomId) ?? [];

        if (neighbor.order !== 1 || halogenNeighbors.length !== 1) {
          return null;
        }

        substituents.push({
          baseName: HALOGEN_PREFIXES[symbol],
          position: index + 1,
        });
        continue;
      }

      if (symbol === 'N') {
        if (neighbor.order === 3) {
          if (processedNitrileAtomIds.has(neighbor.atomId)) {
            return null;
          }

          if (!isSupportedNitrileGroup(atomId, neighbor.atomId, atomById, neighborMap)) {
            return null;
          }

          processedNitrileAtomIds.add(neighbor.atomId);
          nitrilePositions.push(index + 1);
          continue;
        }

        if (processedAminoAtomIds.has(neighbor.atomId) || neighbor.order !== 1) {
          return null;
        }

        if (!isSupportedAminoSubstituent(neighbor.atomId, atomById, neighborMap)) {
          return null;
        }

        processedAminoAtomIds.add(neighbor.atomId);
        aminoPositions.push(index + 1);
        continue;
      }

      if (symbol === 'C') {
        if (processedSubtreeRoots.has(neighbor.atomId)) {
          continue;
        }

        const alkylName = resolveLinearAlkylSubstituentName(neighbor.atomId, chainAtomIdSet, atomById, neighborMap);

        if (alkylName === null) {
          return null;
        }

        processedSubtreeRoots.add(neighbor.atomId);
        substituents.push({
          baseName: alkylName,
          position: index + 1,
        });
        continue;
      }

      return null;
    }
  }

  return {
    nitrilePositions: nitrilePositions.sort((first, second) => first - second),
    hydroxyPositions: hydroxyPositions.sort((first, second) => first - second),
    aminoPositions: aminoPositions.sort((first, second) => first - second),
    substituents,
  };
}

export { resolveSupportedContextForChain };
