import type { MoleculeAtom, MoleculeBond, MoleculeModel } from '@/shared/utils/moleculeEditor';

export function findBond(model: MoleculeModel, firstAtomId: string, secondAtomId: string): MoleculeBond | null {
  return (
    model.bonds.find((bond) => {
      return (
        (bond.sourceId === firstAtomId && bond.targetId === secondAtomId) ||
        (bond.sourceId === secondAtomId && bond.targetId === firstAtomId)
      );
    }) ?? null
  );
}

export function findAtom(model: MoleculeModel, atomId: string): MoleculeAtom | null {
  return model.atoms.find((atom) => atom.id === atomId) ?? null;
}
