import type { ChemicalElement } from '@/shared/types/element';

import {
  dedupeBondConnections,
  findAtom,
  nextMoleculeId,
  syncMoleculeIdCounter,
} from '@/shared/utils/moleculeGraph';
import {
  chooseAttachmentPoint,
  rebalanceMoleculeLayout,
} from '@/shared/utils/moleculeLayout';
import { getUsedBondSlots, resolveMaxBondSlots } from '@/shared/utils/moleculeValence';
import type {
  BondOrder,
  MoleculeAtom,
  MoleculeModel,
} from '@/shared/utils/moleculeEditor.types';

export function addStandaloneAtom(model: MoleculeModel, element: ChemicalElement, point: { x: number; y: number }) {
  syncMoleculeIdCounter(model);

  const nextAtom: MoleculeAtom = {
    id: nextMoleculeId('atom'),
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

export function addAttachedAtom(model: MoleculeModel, sourceAtomId: string, element: ChemicalElement, order: BondOrder) {
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
    id: nextMoleculeId('atom'),
    element,
    x: attachmentPoint.x,
    y: attachmentPoint.y,
  };

  const nextBond = {
    id: nextMoleculeId('bond'),
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

export function removeAtom(model: MoleculeModel, atomId: string): MoleculeModel {
  return {
    atoms: model.atoms.filter((atom) => atom.id !== atomId),
    bonds: model.bonds.filter((bond) => bond.sourceId !== atomId && bond.targetId !== atomId),
  };
}
