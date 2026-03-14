type BondOrder = 1 | 2 | 3;

type NomenclatureAtom = {
  id: string;
  element: {
    symbol: string;
    name: string;
  };
};

type NomenclatureBond = {
  sourceId: string;
  targetId: string;
  order: BondOrder;
};

type MoleculeModel = {
  atoms: NomenclatureAtom[];
  bonds: NomenclatureBond[];
};

type NeighborLink = {
  atomId: string;
  order: BondOrder;
};

const CHAIN_ROOTS: Record<number, string> = {
  1: 'met',
  2: 'et',
  3: 'prop',
  4: 'but',
  5: 'pent',
  6: 'hex',
  7: 'hept',
  8: 'oct',
  9: 'non',
  10: 'dec',
  11: 'undec',
  12: 'dodec',
};

const ALKYL_NAMES: Record<number, string> = {
  1: 'metil',
  2: 'etil',
  3: 'propil',
  4: 'butil',
  5: 'pentil',
  6: 'hexil',
};

const HALOGEN_PREFIXES: Record<string, string> = {
  F: 'fluoro',
  Cl: 'cloro',
  Br: 'bromo',
  I: 'iodo',
};

const MULTIPLIER_PREFIXES: Record<number, string> = {
  2: 'di',
  3: 'tri',
  4: 'tetra',
  5: 'penta',
  6: 'hexa',
};

type MoleculeSubstituent = {
  baseName: string;
  position: number;
};

type MoleculeChainContext = {
  nitrilePositions: number[];
  hydroxyPositions: number[];
  aminoPositions: number[];
  substituents: MoleculeSubstituent[];
};

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

function compareLexicographicNumbers(firstValues: number[], secondValues: number[]): number {
  const length = Math.max(firstValues.length, secondValues.length);

  for (let index = 0; index < length; index += 1) {
    const firstValue = firstValues[index] ?? Number.POSITIVE_INFINITY;
    const secondValue = secondValues[index] ?? Number.POSITIVE_INFINITY;

    if (firstValue !== secondValue) {
      return firstValue - secondValue;
    }
  }

  return 0;
}

function compareLocantPriority(
  firstLocants: {
    nitrile: number[];
    hydroxy: number[];
    amino: number[];
    double: number[];
    triple: number[];
    substituent: number[];
  },
  secondLocants: {
    nitrile: number[];
    hydroxy: number[];
    amino: number[];
    double: number[];
    triple: number[];
    substituent: number[];
  },
): number {
  const comparisons = [
    compareLexicographicNumbers(firstLocants.nitrile, secondLocants.nitrile),
    compareLexicographicNumbers(firstLocants.hydroxy, secondLocants.hydroxy),
    compareLexicographicNumbers(firstLocants.amino, secondLocants.amino),
    compareLexicographicNumbers(firstLocants.double, secondLocants.double),
    compareLexicographicNumbers(firstLocants.triple, secondLocants.triple),
    compareLexicographicNumbers(firstLocants.substituent, secondLocants.substituent),
  ];

  return comparisons.find((value) => value !== 0) ?? 0;
}

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

function resolveUnsaturationLocants(
  orderedChainAtomIds: string[],
  neighborMap: Map<string, NeighborLink[]>,
): { double: number[]; triple: number[]; multipleBondCount: number } | null {
  const double: number[] = [];
  const triple: number[] = [];

  for (let index = 0; index < orderedChainAtomIds.length - 1; index += 1) {
    const order = resolveBondOrderBetween(orderedChainAtomIds[index], orderedChainAtomIds[index + 1], neighborMap);

    if (order === null) {
      return null;
    }

    if (order === 2) {
      double.push(index + 1);
    }

    if (order === 3) {
      triple.push(index + 1);
    }
  }

  if (double.length > 1 || triple.length > 1 || (double.length > 0 && triple.length > 0)) {
    return null;
  }

  return {
    double,
    triple,
    multipleBondCount: double.length + triple.length,
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

function shouldOmitUnsaturationLocant(chainLength: number, locant: number): boolean {
  return locant === 1 && chainLength <= 3;
}

function shouldOmitHydroxyLocant(chainLength: number, locant: number): boolean {
  return locant === 1 && chainLength <= 2;
}

function buildParentName(
  chainLength: number,
  doubleLocants: number[],
  tripleLocants: number[],
  nitrileLocants: number[],
  hydroxyLocants: number[],
  aminoLocants: number[],
  forceHydroxyLocant = false,
): string | null {
  const root = CHAIN_ROOTS[chainLength];

  if (root === undefined) {
    return null;
  }

  const hydroxyLocant = hydroxyLocants[0] ?? null;
  const hydroxyLocantSegment = hydroxyLocants.join(',');
  const hydroxyMultiplier = hydroxyLocants.length > 1 ? MULTIPLIER_PREFIXES[hydroxyLocants.length] : '';
  const aminoLocant = aminoLocants[0] ?? null;
  const nitrileLocant = nitrileLocants[0] ?? null;
  const doubleLocant = doubleLocants[0] ?? null;
  const tripleLocant = tripleLocants[0] ?? null;

  if (doubleLocant !== null && tripleLocant !== null) {
    return null;
  }

  if (nitrileLocant !== null) {
    if (
      nitrileLocants.length > 1 ||
      nitrileLocant !== 1 ||
      hydroxyLocant !== null ||
      aminoLocant !== null ||
      doubleLocant !== null ||
      tripleLocant !== null
    ) {
      return null;
    }

    return `${root}anonitrila`;
  }

  if (hydroxyLocant !== null) {
    if (hydroxyLocants.length > 1 && hydroxyMultiplier === undefined) {
      return null;
    }

    if (doubleLocant !== null) {
      const doubleSegment = shouldOmitUnsaturationLocant(chainLength, doubleLocant) ? 'en' : `${doubleLocant}-en`;
      return hydroxyLocants.length === 1
        ? `${root}-${doubleSegment}-${hydroxyLocant}-ol`
        : `${root}-${doubleSegment}-${hydroxyLocantSegment}-${hydroxyMultiplier}ol`;
    }

    if (tripleLocant !== null) {
      const tripleSegment = shouldOmitUnsaturationLocant(chainLength, tripleLocant) ? 'in' : `${tripleLocant}-in`;
      return hydroxyLocants.length === 1
        ? `${root}-${tripleSegment}-${hydroxyLocant}-ol`
        : `${root}-${tripleSegment}-${hydroxyLocantSegment}-${hydroxyMultiplier}ol`;
    }

    if (hydroxyLocants.length > 1) {
      return `${root}an-${hydroxyLocantSegment}-${hydroxyMultiplier}ol`;
    }

    if (!forceHydroxyLocant && shouldOmitHydroxyLocant(chainLength, hydroxyLocant)) {
      return `${root}anol`;
    }

    return `${root}an-${hydroxyLocant}-ol`;
  }

  if (aminoLocant !== null) {
    const aminoLocantSegment = aminoLocants.join(',');
    const aminoMultiplier = aminoLocants.length > 1 ? MULTIPLIER_PREFIXES[aminoLocants.length] : '';

    if (aminoLocants.length > 1 && aminoMultiplier === undefined) {
      return null;
    }

    const aminoSuffix = `${aminoMultiplier}amina`;

    if (doubleLocant !== null) {
      const doubleSegment = shouldOmitUnsaturationLocant(chainLength, doubleLocant) ? 'en' : `${doubleLocant}-en`;
      return `${root}-${doubleSegment}-${aminoLocantSegment}-${aminoSuffix}`;
    }

    if (tripleLocant !== null) {
      const tripleSegment = shouldOmitUnsaturationLocant(chainLength, tripleLocant) ? 'in' : `${tripleLocant}-in`;
      return `${root}-${tripleSegment}-${aminoLocantSegment}-${aminoSuffix}`;
    }

    return `${root}an-${aminoLocantSegment}-${aminoSuffix}`;
  }

  if (doubleLocant !== null) {
    return shouldOmitUnsaturationLocant(chainLength, doubleLocant) ? `${root}eno` : `${root}-${doubleLocant}-eno`;
  }

  if (tripleLocant !== null) {
    return shouldOmitUnsaturationLocant(chainLength, tripleLocant) ? `${root}ino` : `${root}-${tripleLocant}-ino`;
  }

  return `${root}ano`;
}

function buildSubstituentPrefix(substituents: MoleculeSubstituent[]): string | null {
  if (substituents.length === 0) {
    return '';
  }

  const groupedSubstituents = new Map<string, number[]>();

  for (const substituent of substituents) {
    const positions = groupedSubstituents.get(substituent.baseName) ?? [];
    positions.push(substituent.position);
    groupedSubstituents.set(substituent.baseName, positions);
  }

  const parts = [...groupedSubstituents.entries()]
    .sort(([firstName], [secondName]) => firstName.localeCompare(secondName))
    .map(([baseName, positions]) => {
      const sortedPositions = [...positions].sort((first, second) => first - second);
      const multiplier = sortedPositions.length > 1 ? MULTIPLIER_PREFIXES[sortedPositions.length] : '';

      if (sortedPositions.length > 1 && multiplier === undefined) {
        return null;
      }

      return `${sortedPositions.join(',')}-${multiplier}${baseName}`;
    });

  if (parts.some((part) => part === null)) {
    return null;
  }

  return parts.join('-');
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
