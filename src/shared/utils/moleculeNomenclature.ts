import { resolveSupportedBenzeneName } from '@/shared/utils/moleculeNomenclatureAromatic';
import {
  buildAtomMap,
  buildCarbonNeighborMap,
  buildNeighborMap,
  hasCycleInGraph,
  isConnectedGraph,
  resolveSymbol,
} from '@/shared/utils/moleculeNomenclatureGraph';
import {
  HALOGEN_PREFIXES,
  ALKYL_NAMES,
} from '@/shared/utils/moleculeNomenclature.types';
import type {
  MoleculeChainContext,
  MoleculeModel,
  MoleculeSubstituent,
  NeighborLink,
  NomenclatureAtom,
} from '@/shared/utils/moleculeNomenclature.types';
import {
  buildParentName,
  buildSubstituentPrefix,
  compareLocantPriority,
  resolveUnsaturationLocants,
} from '@/shared/utils/moleculeNomenclatureNaming';

function resolveSubtreeAtoms(
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

function resolveLinearAlkylSubstituentName(
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

function isSupportedAminoSubstituent(
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

function isSupportedNitrileGroup(
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

function comparePathCandidates(
  firstCandidate: {
    length: number;
    nitrileCount: number;
    hydroxyCount: number;
    aminoCount: number;
    multipleBondCount: number;
    substituentCount: number;
  },
  secondCandidate: {
    length: number;
    nitrileCount: number;
    hydroxyCount: number;
    aminoCount: number;
    multipleBondCount: number;
    substituentCount: number;
  },
): number {
  if (firstCandidate.length !== secondCandidate.length) {
    return firstCandidate.length - secondCandidate.length;
  }

  if (firstCandidate.nitrileCount !== secondCandidate.nitrileCount) {
    return firstCandidate.nitrileCount - secondCandidate.nitrileCount;
  }

  if (firstCandidate.hydroxyCount !== secondCandidate.hydroxyCount) {
    return firstCandidate.hydroxyCount - secondCandidate.hydroxyCount;
  }

  if (firstCandidate.aminoCount !== secondCandidate.aminoCount) {
    return firstCandidate.aminoCount - secondCandidate.aminoCount;
  }

  if (firstCandidate.multipleBondCount !== secondCandidate.multipleBondCount) {
    return firstCandidate.multipleBondCount - secondCandidate.multipleBondCount;
  }

  return firstCandidate.substituentCount - secondCandidate.substituentCount;
}

function resolveBestParentChain(
  carbonAtomIds: string[],
  atomById: Map<string, NomenclatureAtom>,
  neighborMap: Map<string, NeighborLink[]>,
  carbonNeighborMap: Map<string, NeighborLink[]>,
): string[] | null {
  let bestPath: string[] | null = null;
  let bestScore:
    | {
        length: number;
        nitrileCount: number;
        hydroxyCount: number;
        aminoCount: number;
        multipleBondCount: number;
        substituentCount: number;
      }
    | null = null;

  const visit = (currentAtomId: string, visited: Set<string>, path: string[]) => {
    const context = resolveSupportedContextForChain(path, atomById, neighborMap);
    const unsaturation = resolveUnsaturationLocants(path, neighborMap);

    if (context !== null && unsaturation !== null) {
      const currentScore = {
        length: path.length,
        nitrileCount: context.nitrilePositions.length,
        hydroxyCount: context.hydroxyPositions.length,
        aminoCount: context.aminoPositions.length,
        multipleBondCount: unsaturation.multipleBondCount,
        substituentCount: context.substituents.length,
      };

      if (bestScore === null || comparePathCandidates(currentScore, bestScore) > 0) {
        bestPath = [...path];
        bestScore = currentScore;
      }
    }

    for (const neighbor of carbonNeighborMap.get(currentAtomId) ?? []) {
      if (visited.has(neighbor.atomId)) {
        continue;
      }

      visited.add(neighbor.atomId);
      path.push(neighbor.atomId);
      visit(neighbor.atomId, visited, path);
      path.pop();
      visited.delete(neighbor.atomId);
    }
  };

  for (const atomId of carbonAtomIds) {
    visit(atomId, new Set([atomId]), [atomId]);
  }

  return bestPath;
}

function buildSystematicMoleculeName(model: MoleculeModel): string | null {
  if (model.atoms.length === 0) {
    return null;
  }

  const atomById = buildAtomMap(model);
  const neighborMap = buildNeighborMap(model);
  const carbonAtomIds = model.atoms.filter((atom) => atom.element.symbol === 'C').map((atom) => atom.id);

  if (carbonAtomIds.length === 0) {
    return null;
  }

  const carbonNeighborMap = buildCarbonNeighborMap(carbonAtomIds, atomById, neighborMap);

  const supportedBenzeneName = resolveSupportedBenzeneName(
    model,
    atomById,
    carbonAtomIds,
    carbonNeighborMap,
    neighborMap,
  );

  if (supportedBenzeneName !== null) {
    return supportedBenzeneName;
  }

  if (!isConnectedGraph(carbonAtomIds, carbonNeighborMap)) {
    return null;
  }

  if (hasCycleInGraph(carbonNeighborMap, carbonAtomIds[0])) {
    return null;
  }

  const parentChain = resolveBestParentChain(carbonAtomIds, atomById, neighborMap, carbonNeighborMap);

  if (parentChain === null) {
    return null;
  }

  const forwardContext = resolveSupportedContextForChain(parentChain, atomById, neighborMap);
  const reverseContext = resolveSupportedContextForChain([...parentChain].reverse(), atomById, neighborMap);
  const forwardUnsaturation = resolveUnsaturationLocants(parentChain, neighborMap);
  const reverseUnsaturation = resolveUnsaturationLocants([...parentChain].reverse(), neighborMap);

  if (
    forwardContext === null ||
    reverseContext === null ||
    forwardUnsaturation === null ||
    reverseUnsaturation === null
  ) {
    return null;
  }

  const forwardUsesAminoAsPrincipal = forwardContext.hydroxyPositions.length === 0 && forwardContext.aminoPositions.length > 0;
  const reverseUsesAminoAsPrincipal = reverseContext.hydroxyPositions.length === 0 && reverseContext.aminoPositions.length > 0;
  const forwardUsesNitrileAsPrincipal = forwardContext.nitrilePositions.length > 0;
  const reverseUsesNitrileAsPrincipal = reverseContext.nitrilePositions.length > 0;

  const forwardLocants = {
    nitrile: forwardUsesNitrileAsPrincipal ? forwardContext.nitrilePositions : [],
    hydroxy: forwardContext.hydroxyPositions,
    amino: !forwardUsesNitrileAsPrincipal && forwardUsesAminoAsPrincipal ? forwardContext.aminoPositions : [],
    double: forwardUnsaturation.double,
    triple: forwardUnsaturation.triple,
    substituent: [
      ...forwardContext.substituents.map((substituent) => substituent.position),
      ...(!forwardUsesNitrileAsPrincipal && forwardUsesAminoAsPrincipal ? [] : forwardContext.aminoPositions),
    ].sort((first, second) => first - second),
  };
  const reverseLocants = {
    nitrile: reverseUsesNitrileAsPrincipal ? reverseContext.nitrilePositions : [],
    hydroxy: reverseContext.hydroxyPositions,
    amino: !reverseUsesNitrileAsPrincipal && reverseUsesAminoAsPrincipal ? reverseContext.aminoPositions : [],
    double: reverseUnsaturation.double,
    triple: reverseUnsaturation.triple,
    substituent: [
      ...reverseContext.substituents.map((substituent) => substituent.position),
      ...(!reverseUsesNitrileAsPrincipal && reverseUsesAminoAsPrincipal ? [] : reverseContext.aminoPositions),
    ].sort((first, second) => first - second),
  };

  const useReverseOrientation = compareLocantPriority(reverseLocants, forwardLocants) < 0;
  const resolvedContext = useReverseOrientation ? reverseContext : forwardContext;
  const resolvedUnsaturation = useReverseOrientation ? reverseUnsaturation : forwardUnsaturation;
  const usesNitrileAsPrincipal = resolvedContext.nitrilePositions.length > 0;
  const usesAminoAsPrincipal =
    !usesNitrileAsPrincipal && resolvedContext.hydroxyPositions.length === 0 && resolvedContext.aminoPositions.length > 0;
  const resolvedSubstituents = [
    ...resolvedContext.substituents,
    ...(usesAminoAsPrincipal
      ? []
      : resolvedContext.aminoPositions.map((position) => ({
          baseName: 'amino',
          position,
        }))),
  ];
  const parentName = buildParentName(
    parentChain.length,
    resolvedUnsaturation.double,
    resolvedUnsaturation.triple,
    usesNitrileAsPrincipal ? resolvedContext.nitrilePositions : [],
    resolvedContext.hydroxyPositions,
    usesAminoAsPrincipal ? resolvedContext.aminoPositions : [],
    resolvedSubstituents.length > 0,
  );

  if (parentName === null) {
    return null;
  }

  const substituentPrefix = buildSubstituentPrefix(resolvedSubstituents);

  if (substituentPrefix === null) {
    return null;
  }

  return substituentPrefix.length > 0 ? `${substituentPrefix}${parentName}` : parentName;
}

export { buildSystematicMoleculeName };
