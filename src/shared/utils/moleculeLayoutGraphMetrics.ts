import type { BondOrder, MoleculeModel } from '@/shared/utils/moleculeEditor';
import { distanceBetween, resolveIdealBondLength } from '@/shared/utils/moleculeLayoutGeometry';
import { findAtom } from '@/shared/utils/moleculeLayoutGraphLookup';

const TERMINAL_BRANCH_BOND_SHORTENING = 10;
const TERMINAL_HYDROGEN_BOND_SHORTENING = 22;

function resolveAtomDegree(model: MoleculeModel, atomId: string): number {
  return model.bonds.reduce((count, bond) => {
    if (bond.sourceId === atomId || bond.targetId === atomId) {
      return count + 1;
    }

    return count;
  }, 0);
}

export function resolveIdealBondLengthForAtoms(
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

export function wouldCollide(model: MoleculeModel, point: { x: number; y: number }, ignoreAtomId?: string): boolean {
  return model.atoms.some((atom) => {
    if (ignoreAtomId !== undefined && atom.id === ignoreAtomId) {
      return false;
    }

    return distanceBetween(atom, point) < 42;
  });
}
