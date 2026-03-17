import {
  distanceBetween,
  resolveIdealBondLength,
} from '@/shared/utils/moleculeLayout';
import type {
  MoleculeBond,
  MoleculeModel,
  NormalizedMoleculeModel,
} from '@/shared/utils/moleculeEditor';
import { resolveMaxMoleculeIdentifier } from '@/shared/utils/moleculeGraphIds';

export function normalizeMoleculeModel(model: MoleculeModel): NormalizedMoleculeModel {
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

export function dedupeBondConnections(model: MoleculeModel): MoleculeModel {
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
