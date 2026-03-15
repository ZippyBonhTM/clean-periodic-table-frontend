import type { ChemicalElement } from '@/shared/types/element';

import {
  buildCompositionRows,
  buildMolecularFormula,
  dedupeBondConnections,
  findAtom,
  findBond,
  nextMoleculeId,
  normalizeMoleculeModel,
  summarizeMolecule,
  syncMoleculeIdCounter,
} from '@/shared/utils/moleculeGraph';
import {
  chooseAttachmentPoint,
  rebalanceMoleculeLayout,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
} from '@/shared/utils/moleculeLayout';
import { canApplyBondOrder, getUsedBondSlots, resolveMaxBondSlots } from '@/shared/utils/moleculeValence';
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

function addStandaloneAtom(model: MoleculeModel, element: ChemicalElement, point: { x: number; y: number }) {
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
    id: nextMoleculeId('bond'),
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
    id: nextMoleculeId('atom'),
    element,
    x: attachmentPoint.x,
    y: attachmentPoint.y,
  };

  const nextBond: MoleculeBond = {
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

function removeAtom(model: MoleculeModel, atomId: string): MoleculeModel {
  return {
    atoms: model.atoms.filter((atom) => atom.id !== atomId),
    bonds: model.bonds.filter((bond) => bond.sourceId !== atomId && bond.targetId !== atomId),
  };
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
