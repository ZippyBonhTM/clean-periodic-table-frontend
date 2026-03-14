import {
  distanceBetween,
  resolveIdealBondLength,
} from '@/shared/utils/moleculeLayout';
import type {
  MoleculeAtom,
  MoleculeBond,
  MoleculeCounts,
  MoleculeModel,
  NormalizedMoleculeModel,
} from '@/shared/utils/moleculeEditor';

let moleculeIdCounter = 0;

const IDENTIFIER_PATTERN = /^(atom|bond)-(\d+)$/;

function nextMoleculeId(prefix: 'atom' | 'bond'): string {
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
  buildCompositionRows,
  buildMolecularFormula,
  dedupeBondConnections,
  findAtom,
  findBond,
  nextMoleculeId,
  normalizeMoleculeModel,
  summarizeMolecule,
  syncMoleculeIdCounter,
};
