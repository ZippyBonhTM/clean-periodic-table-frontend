import type { ChemicalElement } from '@/shared/types/element';

import {
  chooseAttachmentPoint,
  distanceBetween,
  rebalanceMoleculeLayout,
  resolveIdealBondLength,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
} from '@/shared/utils/moleculeLayout';
import { buildSystematicMoleculeName } from '@/shared/utils/moleculeNomenclature';

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
