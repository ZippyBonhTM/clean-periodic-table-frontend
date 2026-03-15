import { findAtom } from '@/shared/utils/moleculeGraph';
import type { BondOrder, MoleculeElementSnapshot, MoleculeModel } from '@/shared/utils/moleculeEditor';

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

  const existingBond = model.bonds.find((bond) => {
    return (
      (bond.sourceId === firstAtomId && bond.targetId === secondAtomId) ||
      (bond.sourceId === secondAtomId && bond.targetId === firstAtomId)
    );
  });
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

export { canApplyBondOrder, getUsedBondSlots, resolveMaxBondSlots };
