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
