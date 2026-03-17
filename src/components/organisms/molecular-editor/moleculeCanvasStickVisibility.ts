'use client';

import {
  findAtom,
  type MoleculeAtom,
  type MoleculeBond,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

export function shouldHideHydrogenInStick(model: MoleculeModel, atom: MoleculeAtom): boolean {
  if (atom.element.symbol !== 'H') {
    return false;
  }

  const attachedBonds = model.bonds.filter((bond) => bond.sourceId === atom.id || bond.targetId === atom.id);

  if (attachedBonds.length !== 1) {
    return false;
  }

  const attachedBond = attachedBonds[0];
  const neighborAtomId = attachedBond.sourceId === atom.id ? attachedBond.targetId : attachedBond.sourceId;
  const neighborAtom = findAtom(model, neighborAtomId);

  if (neighborAtom === null) {
    return false;
  }

  if (neighborAtom.element.symbol === 'C') {
    return true;
  }

  if (neighborAtom.element.symbol === 'H' || attachedBond.order !== 1) {
    return false;
  }

  return model.bonds.some((bond) => {
    if (bond.sourceId !== neighborAtom.id && bond.targetId !== neighborAtom.id) {
      return false;
    }

    const bondedAtomId = bond.sourceId === neighborAtom.id ? bond.targetId : bond.sourceId;

    if (bondedAtomId === atom.id) {
      return false;
    }

    const bondedAtom = findAtom(model, bondedAtomId);
    return bondedAtom !== null && bondedAtom.element.symbol !== 'H';
  });
}

export function resolveStickAttachedHydrogenCount(model: MoleculeModel, atom: MoleculeAtom): number {
  if (atom.element.symbol === 'C' || atom.element.symbol === 'H') {
    return 0;
  }

  return model.bonds.reduce((count, bond) => {
    if (bond.sourceId !== atom.id && bond.targetId !== atom.id) {
      return count;
    }

    const neighborAtomId = bond.sourceId === atom.id ? bond.targetId : bond.sourceId;
    const neighborAtom = findAtom(model, neighborAtomId);

    if (neighborAtom === null || !shouldHideHydrogenInStick(model, neighborAtom)) {
      return count;
    }

    return count + 1;
  }, 0);
}

export function resolveStickVisibleNeighborAtoms(model: MoleculeModel, atom: MoleculeAtom): MoleculeAtom[] {
  return model.bonds.flatMap((bond) => {
    if (bond.sourceId !== atom.id && bond.targetId !== atom.id) {
      return [];
    }

    const neighborAtomId = bond.sourceId === atom.id ? bond.targetId : bond.sourceId;
    const neighborAtom = findAtom(model, neighborAtomId);

    if (neighborAtom === null || shouldHideHydrogenInStick(model, neighborAtom)) {
      return [];
    }

    return [neighborAtom];
  });
}

export function shouldHideAtomInStick(model: MoleculeModel, atom: MoleculeAtom): boolean {
  if (atom.element.symbol === 'C') {
    return true;
  }

  return shouldHideHydrogenInStick(model, atom);
}

export function shouldHideBondInStick(model: MoleculeModel, bond: MoleculeBond): boolean {
  const sourceAtom = findAtom(model, bond.sourceId);
  const targetAtom = findAtom(model, bond.targetId);

  if (sourceAtom === null || targetAtom === null) {
    return false;
  }

  return shouldHideHydrogenInStick(model, sourceAtom) || shouldHideHydrogenInStick(model, targetAtom);
}
