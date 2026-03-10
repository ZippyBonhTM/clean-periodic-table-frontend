import type { ChemicalElement } from '@/shared/types/element';

export type BondOrder = 1 | 2 | 3;

export type MoleculeElementSnapshot = Pick<
  ChemicalElement,
  'number' | 'symbol' | 'name' | 'category' | 'group' | 'shells'
>;

export type MoleculeAtom = {
  id: string;
  element: MoleculeElementSnapshot;
  x: number;
  y: number;
};

export type MoleculeBond = {
  id: string;
  sourceId: string;
  targetId: string;
  order: BondOrder;
};

export type MoleculeModel = {
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
};

export type MoleculeCounts = {
  atomCount: number;
  bondCount: number;
  totalBondOrder: number;
};

export type MoleculeComponent = {
  atomIds: string[];
  bondIds: string[];
  model: MoleculeModel;
  center: {
    x: number;
    y: number;
  };
  heavyAtomCount: number;
};

export type NormalizedMoleculeModel = {
  model: MoleculeModel;
  atomIdsByOriginalId: Map<string, string[]>;
};

type NeighborLink = {
  atomId: string;
  order: BondOrder;
};

const COMMON_VALENCE_OVERRIDES: Record<string, number> = {
  H: 1,
  B: 3,
  C: 4,
  N: 3,
  O: 2,
  F: 1,
  Si: 4,
  P: 3,
  S: 2,
  Cl: 1,
  Br: 1,
  I: 1,
};

const ATTACHMENT_ANGLES = [0, 60, 120, 180, 240, 300, 30, 150, 210, 330];
const ATTACHMENT_RADII = [84, 106, 128, 150];
const COLLISION_RADIUS = 42;
const SINGLE_BOND_LENGTH = 92;
const DOUBLE_BOND_LENGTH = 88;
const TRIPLE_BOND_LENGTH = 84;
const TERMINAL_BRANCH_BOND_SHORTENING = 10;
const TERMINAL_HYDROGEN_BOND_SHORTENING = 22;
const CANONICAL_ANGLE_STEP = 30;

let moleculeIdCounter = 0;

const IDENTIFIER_PATTERN = /^(atom|bond)-(\d+)$/;

function nextId(prefix: 'atom' | 'bond'): string {
  moleculeIdCounter += 1;
  return `${prefix}-${moleculeIdCounter}`;
}

function resolveMaxMoleculeIdentifier(model: MoleculeModel): number {
  return [...model.atoms.map((atom) => atom.id), ...model.bonds.map((bond) => bond.id)].reduce((maxValue, id) => {
    const match = IDENTIFIER_PATTERN.exec(id);

    if (match === null) {
      return maxValue;
    }

    const parsed = Number(match[2]);
    return Number.isFinite(parsed) ? Math.max(maxValue, parsed) : maxValue;
  }, 0);
}

function syncMoleculeIdCounter(model: MoleculeModel): void {
  moleculeIdCounter = Math.max(moleculeIdCounter, resolveMaxMoleculeIdentifier(model));
}

function normalizeMoleculeModel(model: MoleculeModel): NormalizedMoleculeModel {
  const localNextId = (() => {
    let counter = resolveMaxMoleculeIdentifier(model);

    return (prefix: 'atom' | 'bond') => {
      counter += 1;
      return `${prefix}-${counter}`;
    };
  })();
  const seenAtomIds = new Set<string>();
  const seenBondIds = new Set<string>();
  const atomIdsByOriginalId = new Map<string, string[]>();
  const normalizedAtoms = model.atoms.map((atom) => {
    const originalId = atom.id;
    const normalizedId =
      originalId.trim().length > 0 && !seenAtomIds.has(originalId) ? originalId : localNextId('atom');

    seenAtomIds.add(normalizedId);

    const mappedIds = atomIdsByOriginalId.get(originalId) ?? [];
    mappedIds.push(normalizedId);
    atomIdsByOriginalId.set(originalId, mappedIds);

    return {
      ...atom,
      id: normalizedId,
    };
  });
  const atomCandidatesByNormalizedId = new Map(normalizedAtoms.map((atom) => [atom.id, atom]));
  const seenBondConnections = new Set<string>();
  const normalizedBonds = model.bonds.flatMap((bond) => {
    const sourceCandidates = atomIdsByOriginalId.get(bond.sourceId) ?? [];
    const targetCandidates = atomIdsByOriginalId.get(bond.targetId) ?? [];

    if (sourceCandidates.length === 0 || targetCandidates.length === 0) {
      return [];
    }

    let selectedConnection: { sourceId: string; targetId: string } | null = null;
    let selectedDistanceDelta = Number.POSITIVE_INFINITY;
    const idealLength = resolveIdealBondLength(bond.order);

    for (const sourceId of sourceCandidates) {
      for (const targetId of targetCandidates) {
        if (sourceId === targetId) {
          continue;
        }

        const sourceAtom = atomCandidatesByNormalizedId.get(sourceId);
        const targetAtom = atomCandidatesByNormalizedId.get(targetId);

        if (sourceAtom === undefined || targetAtom === undefined) {
          continue;
        }

        const distanceDelta = Math.abs(distanceBetween(sourceAtom, targetAtom) - idealLength);

        if (distanceDelta < selectedDistanceDelta) {
          selectedDistanceDelta = distanceDelta;
          selectedConnection = {
            sourceId,
            targetId,
          };
        }
      }
    }

    if (selectedConnection === null) {
      return [];
    }

    const normalizedPairKey =
      selectedConnection.sourceId < selectedConnection.targetId
        ? `${selectedConnection.sourceId}:${selectedConnection.targetId}`
        : `${selectedConnection.targetId}:${selectedConnection.sourceId}`;

    if (seenBondConnections.has(normalizedPairKey)) {
      return [];
    }

    seenBondConnections.add(normalizedPairKey);
    const normalizedId =
      bond.id.trim().length > 0 && !seenBondIds.has(bond.id) ? bond.id : localNextId('bond');

    seenBondIds.add(normalizedId);

    return [
      {
        ...bond,
        id: normalizedId,
        sourceId: selectedConnection.sourceId,
        targetId: selectedConnection.targetId,
      },
    ];
  });

  return {
    model: {
      atoms: normalizedAtoms,
      bonds: normalizedBonds,
    },
    atomIdsByOriginalId,
  };
}

function dedupeBondConnections(model: MoleculeModel): MoleculeModel {
  if (model.bonds.length <= 1) {
    return model;
  }

  const nextBonds: MoleculeBond[] = [];
  const bondIndexByPairKey = new Map<string, number>();
  let didChange = false;

  model.bonds.forEach((bond) => {
    if (bond.sourceId === bond.targetId) {
      didChange = true;
      return;
    }

    const canonicalSourceId = bond.sourceId < bond.targetId ? bond.sourceId : bond.targetId;
    const canonicalTargetId = bond.sourceId < bond.targetId ? bond.targetId : bond.sourceId;
    const pairKey = `${canonicalSourceId}:${canonicalTargetId}`;
    const existingIndex = bondIndexByPairKey.get(pairKey);

    if (existingIndex === undefined) {
      nextBonds.push({
        ...bond,
        sourceId: canonicalSourceId,
        targetId: canonicalTargetId,
      });
      bondIndexByPairKey.set(pairKey, nextBonds.length - 1);

      if (canonicalSourceId !== bond.sourceId || canonicalTargetId !== bond.targetId) {
        didChange = true;
      }

      return;
    }

    didChange = true;
    const existingBond = nextBonds[existingIndex];

    if (bond.order > existingBond.order) {
      nextBonds[existingIndex] = {
        ...existingBond,
        order: bond.order,
      };
    }
  });

  if (!didChange) {
    return model;
  }

  return {
    atoms: model.atoms,
    bonds: nextBonds,
  };
}

function findBond(model: MoleculeModel, firstAtomId: string, secondAtomId: string): MoleculeBond | null {
  return (
    model.bonds.find((bond) => {
      return (
        (bond.sourceId === firstAtomId && bond.targetId === secondAtomId) ||
        (bond.sourceId === secondAtomId && bond.targetId === firstAtomId)
      );
    }) ?? null
  );
}

function findAtom(model: MoleculeModel, atomId: string): MoleculeAtom | null {
  return model.atoms.find((atom) => atom.id === atomId) ?? null;
}

function resolveFallbackValence(element: MoleculeElementSnapshot): number {
  const outerShellElectrons = element.shells.at(-1);

  if (outerShellElectrons !== undefined) {
    if (outerShellElectrons <= 4) {
      return Math.max(1, outerShellElectrons);
    }

    return Math.max(1, 8 - outerShellElectrons);
  }

  if (element.group >= 1 && element.group <= 2) {
    return element.group;
  }

  if (element.group >= 13 && element.group <= 17) {
    return 18 - element.group;
  }

  if (element.group === 18) {
    return 0;
  }

  if (element.category.toLowerCase().includes('transition metal')) {
    return 2;
  }

  return 4;
}

function resolveMaxBondSlots(element: MoleculeElementSnapshot): number {
  const override = COMMON_VALENCE_OVERRIDES[element.symbol];

  if (override !== undefined) {
    return override;
  }

  const normalizedCategory = element.category.toLowerCase();

  if (normalizedCategory.includes('noble gas')) {
    return 0;
  }

  if (normalizedCategory.includes('halogen')) {
    return 1;
  }

  return resolveFallbackValence(element);
}

function getUsedBondSlots(model: MoleculeModel, atomId: string): number {
  return model.bonds.reduce((sum, bond) => {
    if (bond.sourceId === atomId || bond.targetId === atomId) {
      return sum + bond.order;
    }

    return sum;
  }, 0);
}

function distanceBetween(first: { x: number; y: number }, second: { x: number; y: number }): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function wouldCollide(model: MoleculeModel, point: { x: number; y: number }, ignoreAtomId?: string): boolean {
  return model.atoms.some((atom) => {
    if (ignoreAtomId !== undefined && atom.id === ignoreAtomId) {
      return false;
    }

    return distanceBetween(atom, point) < COLLISION_RADIUS;
  });
}

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

function normalizeAngle(angle: number): number {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function circularAngleDistance(firstAngle: number, secondAngle: number): number {
  const distance = Math.abs(normalizeAngle(firstAngle) - normalizeAngle(secondAngle));
  return Math.min(distance, 360 - distance);
}

function resolveAngleBetween(first: { x: number; y: number }, second: { x: number; y: number }): number {
  return normalizeAngle((Math.atan2(second.y - first.y, second.x - first.x) * 180) / Math.PI);
}

function resolveIdealAngles(connectionCount: number): number[] {
  if (connectionCount <= 0) {
    return [];
  }

  if (connectionCount === 1) {
    return [0];
  }

  if (connectionCount === 2) {
    return [0, 180];
  }

  if (connectionCount === 3) {
    return [0, 120, 240];
  }

  if (connectionCount === 4) {
    // Prefer a 2D tetrahedral-like spread for saturated centers to avoid square-looking chains.
    return [30, 150, 210, 330];
  }

  const step = 360 / connectionCount;
  return Array.from({ length: connectionCount }, (_, index) => index * step);
}

function rotateAngles(angles: number[], rotation: number): number[] {
  return angles.map((angle) => normalizeAngle(angle + rotation));
}

function snapAngleToCanonicalGrid(angle: number): number {
  return normalizeAngle(Math.round(angle / CANONICAL_ANGLE_STEP) * CANONICAL_ANGLE_STEP);
}

function resolveIdealBondLength(order: BondOrder): number {
  if (order === 3) {
    return TRIPLE_BOND_LENGTH;
  }

  if (order === 2) {
    return DOUBLE_BOND_LENGTH;
  }

  return SINGLE_BOND_LENGTH;
}

function resolveAtomDegree(model: MoleculeModel, atomId: string): number {
  return model.bonds.reduce((count, bond) => {
    if (bond.sourceId === atomId || bond.targetId === atomId) {
      return count + 1;
    }

    return count;
  }, 0);
}

function resolveIdealBondLengthForAtoms(
  model: MoleculeModel,
  firstAtomId: string,
  secondAtomId: string,
  order: BondOrder,
): number {
  const baseLength = resolveIdealBondLength(order);
  const firstAtom = findAtom(model, firstAtomId);
  const secondAtom = findAtom(model, secondAtomId);

  if (firstAtom === null || secondAtom === null) {
    return baseLength;
  }

  const firstDegree = resolveAtomDegree(model, firstAtomId);
  const secondDegree = resolveAtomDegree(model, secondAtomId);
  const hasTerminalEndpoint = firstDegree === 1 || secondDegree === 1;

  if (!hasTerminalEndpoint) {
    return baseLength;
  }

  const terminalAtom = firstDegree === 1 ? firstAtom : secondAtom;
  const shortening =
    terminalAtom.element.symbol === 'H' ? TERMINAL_HYDROGEN_BOND_SHORTENING : TERMINAL_BRANCH_BOND_SHORTENING;

  return Math.max(56, baseLength - shortening);
}

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

function resolveMoleculeComponents(model: MoleculeModel): MoleculeComponent[] {
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

function resolvePrimaryMoleculeComponentIndex(components: MoleculeComponent[]): number {
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

function chooseRootRotation(baseAngles: number[], currentAngles: number[]): number {
  if (baseAngles.length === 0 || currentAngles.length === 0) {
    return 0;
  }

  const normalizedCurrentAngles = [...currentAngles].map(normalizeAngle).sort((first, second) => first - second);
  let bestRotation = snapAngleToCanonicalGrid(normalizedCurrentAngles[0] - baseAngles[0]);
  let bestScore = Number.POSITIVE_INFINITY;
  const testedRotations = new Set<number>();

  baseAngles.forEach((baseAngle) => {
    const candidateRotation = snapAngleToCanonicalGrid(normalizedCurrentAngles[0] - baseAngle);

    if (testedRotations.has(candidateRotation)) {
      return;
    }

    testedRotations.add(candidateRotation);
    const rotatedAngles = rotateAngles(baseAngles, candidateRotation).sort((first, second) => first - second);
    const score = normalizedCurrentAngles.reduce((sum, currentAngle, index) => {
      const rotatedAngle = rotatedAngles[index] ?? rotatedAngles[rotatedAngles.length - 1] ?? 0;
      return sum + circularAngleDistance(currentAngle, rotatedAngle);
    }, 0);

    if (score < bestScore) {
      bestScore = score;
      bestRotation = candidateRotation;
    }
  });

  return bestRotation;
}

function findFirstCycleInComponent(
  componentAtomIds: Set<string>,
  neighborMap: Map<string, NeighborLink[]>,
): string[] | null {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const walk = (atomId: string, parentAtomId: string | null): string[] | null => {
    visited.add(atomId);
    recursionStack.add(atomId);
    path.push(atomId);

    for (const neighbor of neighborMap.get(atomId) ?? []) {
      if (!componentAtomIds.has(neighbor.atomId) || neighbor.atomId === parentAtomId) {
        continue;
      }

      if (!visited.has(neighbor.atomId)) {
        const nestedCycle = walk(neighbor.atomId, atomId);

        if (nestedCycle !== null) {
          return nestedCycle;
        }

        continue;
      }

      if (recursionStack.has(neighbor.atomId)) {
        const cycleStartIndex = path.lastIndexOf(neighbor.atomId);

        if (cycleStartIndex !== -1) {
          return path.slice(cycleStartIndex);
        }
      }
    }

    path.pop();
    recursionStack.delete(atomId);
    return null;
  };

  for (const atomId of componentAtomIds) {
    if (visited.has(atomId)) {
      continue;
    }

    const cycleAtomIds = walk(atomId, null);

    if (cycleAtomIds !== null && cycleAtomIds.length >= 3) {
      return cycleAtomIds;
    }
  }

  return null;
}

function reverseCycleOrder(cycleAtomIds: string[]): string[] {
  if (cycleAtomIds.length <= 2) {
    return [...cycleAtomIds];
  }

  return [cycleAtomIds[0], ...cycleAtomIds.slice(1).reverse()];
}

function resolveCycleCenter(cycleAtomIds: string[], positionsByAtomId: Map<string, { x: number; y: number }>) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  cycleAtomIds.forEach((atomId) => {
    const position = positionsByAtomId.get(atomId);

    if (position === undefined) {
      return;
    }

    sumX += position.x;
    sumY += position.y;
    count += 1;
  });

  if (count === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

function resolveCycleRadius(
  model: MoleculeModel,
  cycleAtomIds: string[],
): number {
  if (cycleAtomIds.length < 3) {
    return SINGLE_BOND_LENGTH;
  }

  let totalBondLength = 0;
  let totalBondCount = 0;

  for (let index = 0; index < cycleAtomIds.length; index += 1) {
    const sourceId = cycleAtomIds[index];
    const targetId = cycleAtomIds[(index + 1) % cycleAtomIds.length];
    const cycleBond = findBond(model, sourceId, targetId);

    totalBondLength += resolveIdealBondLength(cycleBond?.order ?? 1);
    totalBondCount += 1;
  }

  const averageBondLength = totalBondCount === 0 ? SINGLE_BOND_LENGTH : totalBondLength / totalBondCount;
  return averageBondLength / (2 * Math.sin(Math.PI / cycleAtomIds.length));
}

function resolveRegularCyclePositions(
  cycleAtomIds: string[],
  center: { x: number; y: number },
  radius: number,
  originalPositions: Map<string, { x: number; y: number }>,
) {
  const baseAngles = resolveIdealAngles(cycleAtomIds.length);
  const currentAngles = cycleAtomIds.flatMap((atomId) => {
    const originalPosition = originalPositions.get(atomId);

    if (originalPosition === undefined) {
      return [];
    }

    return [resolveAngleBetween(center, originalPosition)];
  });
  const rotation = chooseRootRotation(baseAngles, currentAngles);
  const rotatedAngles = rotateAngles(baseAngles, rotation);
  const nextPositions = new Map<string, { x: number; y: number }>();

  cycleAtomIds.forEach((atomId, index) => {
    const targetAngle = rotatedAngles[index] ?? rotatedAngles[rotatedAngles.length - 1] ?? 0;
    const radians = (targetAngle * Math.PI) / 180;
    nextPositions.set(atomId, {
      x: center.x + Math.cos(radians) * radius,
      y: center.y + Math.sin(radians) * radius,
    });
  });

  const score = cycleAtomIds.reduce((sum, atomId) => {
    const originalPosition = originalPositions.get(atomId);
    const nextPosition = nextPositions.get(atomId);

    if (originalPosition === undefined || nextPosition === undefined) {
      return sum;
    }

    return sum + distanceBetween(originalPosition, nextPosition);
  }, 0);

  return {
    score,
    positions: nextPositions,
  };
}

function resolvePreferredBranchAngles(connectionCount: number, preferredAngle: number): number[] {
  if (connectionCount <= 0) {
    return [];
  }

  if (connectionCount === 1) {
    return [snapAngleToCanonicalGrid(preferredAngle)];
  }

  const baseAngles = resolveIdealAngles(connectionCount);
  return rotateAngles(baseAngles, snapAngleToCanonicalGrid(preferredAngle) - baseAngles[0]);
}

function resolveAtomCentroid(atomIds: string[], positionsByAtomId: Map<string, { x: number; y: number }>) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  atomIds.forEach((atomId) => {
    const position = positionsByAtomId.get(atomId);

    if (position === undefined) {
      return;
    }

    sumX += position.x;
    sumY += position.y;
    count += 1;
  });

  if (count === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

function compareBackbonePathCandidates(
  firstPath: string[],
  secondPath: string[],
  atomById: Map<string, MoleculeAtom>,
  anchorAtomId: string,
): number {
  if (firstPath.length !== secondPath.length) {
    return firstPath.length - secondPath.length;
  }

  const firstContainsAnchor = firstPath.includes(anchorAtomId);
  const secondContainsAnchor = secondPath.includes(anchorAtomId);

  if (firstContainsAnchor !== secondContainsAnchor) {
    return firstContainsAnchor ? 1 : -1;
  }

  const countCarbons = (path: string[]) => {
    return path.reduce((count, atomId) => {
      return count + (atomById.get(atomId)?.element.symbol === 'C' ? 1 : 0);
    }, 0);
  };

  const carbonCountDifference = countCarbons(firstPath) - countCarbons(secondPath);

  if (carbonCountDifference !== 0) {
    return carbonCountDifference;
  }

  return firstPath.join(':').localeCompare(secondPath.join(':')) * -1;
}

function resolvePreferredAcyclicBackbonePath(
  componentAtomIds: Set<string>,
  atomById: Map<string, MoleculeAtom>,
  neighborMap: Map<string, NeighborLink[]>,
  anchorAtomId: string,
): string[] | null {
  const heavyAtomIds = [...componentAtomIds].filter((atomId) => atomById.get(atomId)?.element.symbol !== 'H');

  if (heavyAtomIds.length < 3) {
    return null;
  }

  const heavyAtomIdSet = new Set(heavyAtomIds);
  let bestPath: string[] | null = null;

  const visit = (currentAtomId: string, visited: Set<string>, path: string[]) => {
    if (
      bestPath === null ||
      compareBackbonePathCandidates(path, bestPath, atomById, anchorAtomId) > 0
    ) {
      bestPath = [...path];
    }

    for (const neighbor of neighborMap.get(currentAtomId) ?? []) {
      if (!heavyAtomIdSet.has(neighbor.atomId) || visited.has(neighbor.atomId)) {
        continue;
      }

      visited.add(neighbor.atomId);
      path.push(neighbor.atomId);
      visit(neighbor.atomId, visited, path);
      path.pop();
      visited.delete(neighbor.atomId);
    }
  };

  heavyAtomIds.forEach((atomId) => {
    visit(atomId, new Set([atomId]), [atomId]);
  });

  return bestPath;
}

function resolveAcyclicBackboneCandidatePositions(
  model: MoleculeModel,
  backboneAtomIds: string[],
  targetAnchorAtomId: string,
  targetAnchorPosition: { x: number; y: number },
  direction: 1 | -1,
  bendSign: 1 | -1,
) {
  const candidatePositions = new Map<string, { x: number; y: number }>();

  if (backboneAtomIds.length === 0) {
    return candidatePositions;
  }

  candidatePositions.set(backboneAtomIds[0], { x: 0, y: 0 });

  for (let index = 0; index < backboneAtomIds.length - 1; index += 1) {
    const currentAtomId = backboneAtomIds[index];
    const nextAtomId = backboneAtomIds[index + 1];
    const currentPosition = candidatePositions.get(currentAtomId);

    if (currentPosition === undefined) {
      continue;
    }

    const segmentAngle =
      backboneAtomIds.length === 2
        ? direction === 1
          ? 0
          : 180
        : normalizeAngle(direction === 1 ? (index % 2 === 0 ? bendSign * 30 : bendSign * -30) : 180 + (index % 2 === 0 ? bendSign * -30 : bendSign * 30));
    const segmentLength = resolveIdealBondLengthForAtoms(model, currentAtomId, nextAtomId, findBond(model, currentAtomId, nextAtomId)?.order ?? 1);
    const radians = (segmentAngle * Math.PI) / 180;

    candidatePositions.set(nextAtomId, {
      x: currentPosition.x + Math.cos(radians) * segmentLength,
      y: currentPosition.y + Math.sin(radians) * segmentLength,
    });
  }

  const anchorCandidatePosition = candidatePositions.get(targetAnchorAtomId);

  if (anchorCandidatePosition === undefined) {
    return candidatePositions;
  }

  const translateX = targetAnchorPosition.x - anchorCandidatePosition.x;
  const translateY = targetAnchorPosition.y - anchorCandidatePosition.y;

  candidatePositions.forEach((position, atomId) => {
    candidatePositions.set(atomId, {
      x: position.x + translateX,
      y: position.y + translateY,
    });
  });

  return candidatePositions;
}

function resolvePreferredAttachmentAngles(
  occupiedAngles: number[],
  connectionCount: number,
  preferredAngle: number,
): number[] {
  if (connectionCount <= 0) {
    return [];
  }

  const candidateAngles = Array.from({ length: 12 }, (_, index) => index * 30);
  const resolvedAngles: number[] = [];

  while (resolvedAngles.length < connectionCount) {
    let bestAngle = preferredAngle;
    let bestScore = Number.NEGATIVE_INFINITY;

    candidateAngles.forEach((candidateAngle) => {
      if (resolvedAngles.some((angle) => circularAngleDistance(angle, candidateAngle) < 1)) {
        return;
      }

      const avoidedAngles = [...occupiedAngles, ...resolvedAngles];
      const separationScore =
        avoidedAngles.length === 0
          ? 180
          : Math.min(...avoidedAngles.map((angle) => circularAngleDistance(angle, candidateAngle)));
      const preferenceScore = 180 - circularAngleDistance(preferredAngle, candidateAngle);
      const score = separationScore * 2 + preferenceScore;

      if (score > bestScore) {
        bestScore = score;
        bestAngle = candidateAngle;
      }
    });

    resolvedAngles.push(bestAngle);
  }

  return resolvedAngles;
}

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
        ? rotateAngles(
            resolveIdealAngles(childLinks.length),
            chooseRootRotation(
              resolveIdealAngles(childLinks.length),
              childLinks.flatMap((neighbor) => {
                const neighborPosition = originalPositions.get(neighbor.atomId);

                if (neighborPosition === undefined) {
                  return [];
                }

                return [resolveAngleBetween(anchorPosition, neighborPosition)];
              }),
            ),
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

  const cycleAtomIds = findFirstCycleInComponent(componentAtomIds, neighborMap);

  if (cycleAtomIds !== null && cycleAtomIds.length >= 3) {
    const cycleCenter = resolveCycleCenter(cycleAtomIds, originalPositions);
    const cycleRadius = resolveCycleRadius(model, cycleAtomIds);
    const cycleOrders = [cycleAtomIds, reverseCycleOrder(cycleAtomIds)];
    const bestCycleLayout = cycleOrders
      .map((cycleOrder) => resolveRegularCyclePositions(cycleOrder, cycleCenter, cycleRadius, originalPositions))
      .reduce((bestLayout, candidateLayout) => {
        if (bestLayout === null || candidateLayout.score < bestLayout.score) {
          return candidateLayout;
        }

        return bestLayout;
      }, null as ReturnType<typeof resolveRegularCyclePositions> | null);

    if (bestCycleLayout !== null) {
      const cycleAtomIdSet = new Set(cycleAtomIds);

      bestCycleLayout.positions.forEach((position, atomId) => {
        nextPositions.set(atomId, position);
        visited.add(atomId);
      });

      cycleAtomIds.forEach((cycleAtomId) => {
        const cycleAtomPosition = nextPositions.get(cycleAtomId);

        if (cycleAtomPosition === undefined) {
          return;
        }

        const branchLinks = sortNeighborLinksByCurrentAngle(
          cycleAtomId,
          (neighborMap.get(cycleAtomId) ?? []).filter((neighbor) => {
            return (
              componentAtomIds.has(neighbor.atomId) &&
              !cycleAtomIdSet.has(neighbor.atomId) &&
              !visited.has(neighbor.atomId)
            );
          }),
          originalPositions,
        );

        if (branchLinks.length === 0) {
          return;
        }

        const outwardAngle = resolveAngleBetween(cycleCenter, cycleAtomPosition);
        const preferredBranchAngles = resolvePreferredBranchAngles(branchLinks.length, outwardAngle);

        branchLinks.forEach((neighbor, index) => {
          const targetAngle = preferredBranchAngles[index] ?? preferredBranchAngles[preferredBranchAngles.length - 1] ?? outwardAngle;
          const radius = resolveIdealBondLengthForAtoms(model, cycleAtomId, neighbor.atomId, neighbor.order);
          const radians = (targetAngle * Math.PI) / 180;

          nextPositions.set(neighbor.atomId, {
            x: cycleAtomPosition.x + Math.cos(radians) * radius,
            y: cycleAtomPosition.y + Math.sin(radians) * radius,
          });
        });

        branchLinks.forEach((neighbor, index) => {
          const targetAngle = preferredBranchAngles[index] ?? preferredBranchAngles[preferredBranchAngles.length - 1] ?? outwardAngle;
          layoutBranch(neighbor.atomId, cycleAtomId, normalizeAngle(targetAngle + 180));
        });
      });
    }
  } else {
    const backboneAtomIds = resolvePreferredAcyclicBackbonePath(
      componentAtomIds,
      atomById,
      neighborMap,
      resolvedAnchorAtomId,
    );

    if (backboneAtomIds !== null && backboneAtomIds.length >= 3) {
      const anchorBackboneAtomId = backboneAtomIds.includes(resolvedAnchorAtomId)
        ? resolvedAnchorAtomId
        : backboneAtomIds[0];
      const anchorBackbonePosition = originalPositions.get(anchorBackboneAtomId) ?? anchorPosition;
      const backboneCandidates = [
        resolveAcyclicBackboneCandidatePositions(model, backboneAtomIds, anchorBackboneAtomId, anchorBackbonePosition, 1, 1),
        resolveAcyclicBackboneCandidatePositions(model, backboneAtomIds, anchorBackboneAtomId, anchorBackbonePosition, 1, -1),
        resolveAcyclicBackboneCandidatePositions(model, backboneAtomIds, anchorBackboneAtomId, anchorBackbonePosition, -1, 1),
        resolveAcyclicBackboneCandidatePositions(model, backboneAtomIds, anchorBackboneAtomId, anchorBackbonePosition, -1, -1),
      ];
      const bestBackbonePositions = backboneCandidates.reduce((bestCandidate, candidate) => {
        const candidateScore = backboneAtomIds.reduce((sum, atomId) => {
          const candidatePosition = candidate.get(atomId);
          const originalPosition = originalPositions.get(atomId);

          if (candidatePosition === undefined || originalPosition === undefined) {
            return sum;
          }

          return sum + distanceBetween(candidatePosition, originalPosition);
        }, 0);

        if (bestCandidate === null || candidateScore < bestCandidate.score) {
          return {
            score: candidateScore,
            positions: candidate,
          };
        }

        return bestCandidate;
      }, null as { score: number; positions: Map<string, { x: number; y: number }> } | null);

      if (bestBackbonePositions !== null) {
        const backboneAtomIdSet = new Set(backboneAtomIds);
        const backboneCenter = resolveAtomCentroid(backboneAtomIds, bestBackbonePositions.positions);

        bestBackbonePositions.positions.forEach((position, atomId) => {
          nextPositions.set(atomId, position);
          visited.add(atomId);
        });

        backboneAtomIds.forEach((backboneAtomId) => {
          const backboneAtomPosition = nextPositions.get(backboneAtomId);

          if (backboneAtomPosition === undefined) {
            return;
          }

          const occupiedAngles = (neighborMap.get(backboneAtomId) ?? []).flatMap((neighbor) => {
            if (!backboneAtomIdSet.has(neighbor.atomId)) {
              return [];
            }

            const neighborPosition = nextPositions.get(neighbor.atomId);

            if (neighborPosition === undefined) {
              return [];
            }

            return [resolveAngleBetween(backboneAtomPosition, neighborPosition)];
          });
          const branchLinks = sortNeighborLinksByCurrentAngle(
            backboneAtomId,
            (neighborMap.get(backboneAtomId) ?? []).filter((neighbor) => {
              return (
                componentAtomIds.has(neighbor.atomId) &&
                !backboneAtomIdSet.has(neighbor.atomId) &&
                !visited.has(neighbor.atomId)
              );
            }),
            originalPositions,
          );

          if (branchLinks.length === 0) {
            return;
          }

          const preferredOutwardAngle = resolveAngleBetween(backboneCenter, backboneAtomPosition);
          const attachmentAngles = resolvePreferredAttachmentAngles(
            occupiedAngles,
            branchLinks.length,
            preferredOutwardAngle,
          );

          branchLinks.forEach((neighbor, index) => {
            const targetAngle = attachmentAngles[index] ?? attachmentAngles[attachmentAngles.length - 1] ?? preferredOutwardAngle;
            const radius = resolveIdealBondLengthForAtoms(model, backboneAtomId, neighbor.atomId, neighbor.order);
            const radians = (targetAngle * Math.PI) / 180;

            nextPositions.set(neighbor.atomId, {
              x: backboneAtomPosition.x + Math.cos(radians) * radius,
              y: backboneAtomPosition.y + Math.sin(radians) * radius,
            });
          });

          branchLinks.forEach((neighbor, index) => {
            const targetAngle = attachmentAngles[index] ?? attachmentAngles[attachmentAngles.length - 1] ?? preferredOutwardAngle;
            layoutBranch(neighbor.atomId, backboneAtomId, normalizeAngle(targetAngle + 180));
          });
        });
      }
    }
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

function addStandaloneAtom(model: MoleculeModel, element: ChemicalElement, point: { x: number; y: number }) {
  syncMoleculeIdCounter(model);

  const nextAtom: MoleculeAtom = {
    id: nextId('atom'),
    element,
    x: point.x,
    y: point.y,
  };

  return {
    molecule: {
      atoms: [...model.atoms, nextAtom],
      bonds: model.bonds,
    },
    selectedAtomId: nextAtom.id,
  };
}

function canApplyBondOrder(
  model: MoleculeModel,
  firstAtomId: string,
  secondAtomId: string,
  nextOrder: BondOrder,
): { ok: boolean; message?: string } {
  if (firstAtomId === secondAtomId) {
    return { ok: false, message: 'Choose two different atoms to create a bond.' };
  }

  const firstAtom = findAtom(model, firstAtomId);
  const secondAtom = findAtom(model, secondAtomId);

  if (firstAtom === null || secondAtom === null) {
    return { ok: false, message: 'One of the selected atoms no longer exists.' };
  }

  const existingBond = findBond(model, firstAtomId, secondAtomId);
  const existingOrder = existingBond?.order ?? 0;
  const delta = nextOrder - existingOrder;

  if (delta <= 0) {
    return { ok: true };
  }

  const firstLimit = resolveMaxBondSlots(firstAtom.element);
  const secondLimit = resolveMaxBondSlots(secondAtom.element);
  const firstUsed = getUsedBondSlots(model, firstAtomId);
  const secondUsed = getUsedBondSlots(model, secondAtomId);

  if (firstUsed + delta > firstLimit) {
    return {
      ok: false,
      message: `${firstAtom.element.symbol} commonly supports up to ${firstLimit} bond slot${firstLimit === 1 ? '' : 's'}.`,
    };
  }

  if (secondUsed + delta > secondLimit) {
    return {
      ok: false,
      message: `${secondAtom.element.symbol} commonly supports up to ${secondLimit} bond slot${secondLimit === 1 ? '' : 's'}.`,
    };
  }

  return { ok: true };
}

function connectAtoms(model: MoleculeModel, firstAtomId: string, secondAtomId: string, order: BondOrder) {
  const sanitizedModel = dedupeBondConnections(model);

  syncMoleculeIdCounter(sanitizedModel);

  const validation = canApplyBondOrder(sanitizedModel, firstAtomId, secondAtomId, order);

  if (!validation.ok) {
    return {
      molecule: sanitizedModel,
      selectedAtomId: firstAtomId,
      error: validation.message,
    };
  }

  const existingBond = findBond(sanitizedModel, firstAtomId, secondAtomId);

  if (existingBond !== null) {
    if (existingBond.order === order) {
      return {
        molecule: sanitizedModel,
        selectedAtomId: secondAtomId,
      };
    }

    const nextBonds = sanitizedModel.bonds.map((bond) => {
      if (bond.id !== existingBond.id) {
        return bond;
      }

      return {
        ...bond,
        order,
      };
    });

    return {
      molecule: rebalanceMoleculeLayout(
        {
          atoms: sanitizedModel.atoms,
          bonds: nextBonds,
        },
        firstAtomId,
      ),
      selectedAtomId: secondAtomId,
    };
  }

  const nextBond: MoleculeBond = {
    id: nextId('bond'),
    sourceId: firstAtomId,
    targetId: secondAtomId,
    order,
  };

  return {
    molecule: rebalanceMoleculeLayout(
      {
        atoms: sanitizedModel.atoms,
        bonds: [...sanitizedModel.bonds, nextBond],
      },
      firstAtomId,
    ),
    selectedAtomId: secondAtomId,
  };
}

function addAttachedAtom(model: MoleculeModel, sourceAtomId: string, element: ChemicalElement, order: BondOrder) {
  const sanitizedModel = dedupeBondConnections(model);

  syncMoleculeIdCounter(sanitizedModel);

  const sourceAtom = findAtom(sanitizedModel, sourceAtomId);

  if (sourceAtom === null) {
    return {
      molecule: sanitizedModel,
      selectedAtomId: null,
      error: 'Select an atom before attaching a new one.',
    };
  }

  const sourceLimit = resolveMaxBondSlots(sourceAtom.element);
  const sourceUsed = getUsedBondSlots(sanitizedModel, sourceAtomId);

  if (sourceUsed + order > sourceLimit) {
    return {
      molecule: sanitizedModel,
      selectedAtomId: sourceAtomId,
      error: `${sourceAtom.element.symbol} already reached its common bond limit of ${sourceLimit}.`,
    };
  }

  const targetLimit = resolveMaxBondSlots(element);

  if (order > targetLimit) {
    return {
      molecule: sanitizedModel,
      selectedAtomId: sourceAtomId,
      error: `${element.symbol} cannot start with a bond order of ${order} using the current valence rule.`,
    };
  }

  const attachmentPoint = chooseAttachmentPoint(sanitizedModel, sourceAtomId);

  if (attachmentPoint === null) {
    return {
      molecule: sanitizedModel,
      selectedAtomId: sourceAtomId,
      error: 'Could not find a good place for the new atom.',
    };
  }

  const nextAtom: MoleculeAtom = {
    id: nextId('atom'),
    element,
    x: attachmentPoint.x,
    y: attachmentPoint.y,
  };

  const nextBond: MoleculeBond = {
    id: nextId('bond'),
    sourceId: sourceAtomId,
    targetId: nextAtom.id,
    order,
  };

  return {
    molecule: rebalanceMoleculeLayout(
      {
        atoms: [...sanitizedModel.atoms, nextAtom],
        bonds: [...sanitizedModel.bonds, nextBond],
      },
      sourceAtomId,
    ),
    selectedAtomId: nextAtom.id,
  };
}

function removeAtom(model: MoleculeModel, atomId: string): MoleculeModel {
  return {
    atoms: model.atoms.filter((atom) => atom.id !== atomId),
    bonds: model.bonds.filter((bond) => bond.sourceId !== atomId && bond.targetId !== atomId),
  };
}

function summarizeMolecule(model: MoleculeModel): MoleculeCounts {
  return {
    atomCount: model.atoms.length,
    bondCount: model.bonds.length,
    totalBondOrder: model.bonds.reduce((sum, bond) => sum + bond.order, 0),
  };
}

function buildMolecularFormula(model: MoleculeModel): string {
  if (model.atoms.length === 0) {
    return 'Empty molecule';
  }

  const counts = new Map<string, number>();

  model.atoms.forEach((atom) => {
    counts.set(atom.element.symbol, (counts.get(atom.element.symbol) ?? 0) + 1);
  });

  const symbols = [...counts.keys()];
  const hasCarbon = counts.has('C');

  symbols.sort((first, second) => {
    if (hasCarbon) {
      if (first === 'C') {
        return -1;
      }

      if (second === 'C') {
        return 1;
      }

      if (first === 'H') {
        return second === 'C' ? 1 : -1;
      }

      if (second === 'H') {
        return first === 'C' ? -1 : 1;
      }
    }

    return first.localeCompare(second);
  });

  return symbols
    .map((symbol) => {
      const count = counts.get(symbol) ?? 0;
      return `${symbol}${count > 1 ? count : ''}`;
    })
    .join('');
}

function buildCompositionRows(model: MoleculeModel): Array<{ symbol: string; count: number; name: string }> {
  const counts = new Map<string, { count: number; name: string }>();

  model.atoms.forEach((atom) => {
    const current = counts.get(atom.element.symbol);

    if (current === undefined) {
      counts.set(atom.element.symbol, {
        count: 1,
        name: atom.element.name,
      });
      return;
    }

    counts.set(atom.element.symbol, {
      count: current.count + 1,
      name: current.name,
    });
  });

  return [...counts.entries()]
    .map(([symbol, entry]) => ({ symbol, count: entry.count, name: entry.name }))
    .sort((first, second) => first.symbol.localeCompare(second.symbol));
}

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
  hydroxyPositions: number[];
  aminoPositions: number[];
  substituents: MoleculeSubstituent[];
};

function buildAtomMap(model: MoleculeModel): Map<string, MoleculeAtom> {
  return new Map(model.atoms.map((atom) => [atom.id, atom]));
}

function resolveSymbol(atomById: Map<string, MoleculeAtom>, atomId: string): string | null {
  return atomById.get(atomId)?.element.symbol ?? null;
}

function buildCarbonNeighborMap(
  carbonAtomIds: string[],
  atomById: Map<string, MoleculeAtom>,
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
  atomById: Map<string, MoleculeAtom>,
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
  atomById: Map<string, MoleculeAtom>,
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
  atomById: Map<string, MoleculeAtom>,
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
    hydroxy: number[];
    amino: number[];
    double: number[];
    triple: number[];
    substituent: number[];
  },
  secondLocants: {
    hydroxy: number[];
    amino: number[];
    double: number[];
    triple: number[];
    substituent: number[];
  },
): number {
  const comparisons = [
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
  atomById: Map<string, MoleculeAtom>,
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
  atomById: Map<string, MoleculeAtom>,
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

function resolveSupportedContextForChain(
  orderedChainAtomIds: string[],
  atomById: Map<string, MoleculeAtom>,
  neighborMap: Map<string, NeighborLink[]>,
): MoleculeChainContext | null {
  const chainAtomIdSet = new Set(orderedChainAtomIds);
  const hydroxyPositions: number[] = [];
  const aminoPositions: number[] = [];
  const substituents: MoleculeSubstituent[] = [];
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
    hydroxyCount: number;
    aminoCount: number;
    multipleBondCount: number;
    substituentCount: number;
  },
  secondCandidate: {
    length: number;
    hydroxyCount: number;
    aminoCount: number;
    multipleBondCount: number;
    substituentCount: number;
  },
): number {
  if (firstCandidate.length !== secondCandidate.length) {
    return firstCandidate.length - secondCandidate.length;
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
  atomById: Map<string, MoleculeAtom>,
  neighborMap: Map<string, NeighborLink[]>,
  carbonNeighborMap: Map<string, NeighborLink[]>,
): string[] | null {
  let bestPath: string[] | null = null;
  let bestScore:
    | {
        length: number;
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
  const doubleLocant = doubleLocants[0] ?? null;
  const tripleLocant = tripleLocants[0] ?? null;

  if (doubleLocant !== null && tripleLocant !== null) {
    return null;
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

// v1.2: supports unsubstituted benzene plus simple acyclic organic chains with one unsaturation,
// polyhydroxy alcohols, and straightforward hydroxy/amino/halogen/linear alkyl substituents.
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

  const forwardLocants = {
    hydroxy: forwardContext.hydroxyPositions,
    amino: forwardUsesAminoAsPrincipal ? forwardContext.aminoPositions : [],
    double: forwardUnsaturation.double,
    triple: forwardUnsaturation.triple,
    substituent: [
      ...forwardContext.substituents.map((substituent) => substituent.position),
      ...(forwardUsesAminoAsPrincipal ? [] : forwardContext.aminoPositions),
    ]
      .sort((first, second) => first - second),
  };
  const reverseLocants = {
    hydroxy: reverseContext.hydroxyPositions,
    amino: reverseUsesAminoAsPrincipal ? reverseContext.aminoPositions : [],
    double: reverseUnsaturation.double,
    triple: reverseUnsaturation.triple,
    substituent: [
      ...reverseContext.substituents.map((substituent) => substituent.position),
      ...(reverseUsesAminoAsPrincipal ? [] : reverseContext.aminoPositions),
    ].sort((first, second) => first - second),
  };

  const useReverseOrientation = compareLocantPriority(reverseLocants, forwardLocants) < 0;
  const resolvedContext = useReverseOrientation ? reverseContext : forwardContext;
  const resolvedUnsaturation = useReverseOrientation ? reverseUnsaturation : forwardUnsaturation;
  const usesAminoAsPrincipal = resolvedContext.hydroxyPositions.length === 0 && resolvedContext.aminoPositions.length > 0;
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

export {
  addAttachedAtom,
  addStandaloneAtom,
  buildCompositionRows,
  dedupeBondConnections,
  buildMolecularFormula,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
  buildSystematicMoleculeName,
  connectAtoms,
  findAtom,
  findBond,
  getUsedBondSlots,
  normalizeMoleculeModel,
  removeAtom,
  rebalanceMoleculeLayout,
  resolveMaxBondSlots,
  syncMoleculeIdCounter,
  summarizeMolecule,
};
