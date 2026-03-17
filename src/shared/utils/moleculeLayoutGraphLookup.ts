import type { MoleculeAtom, MoleculeModel } from '@/shared/utils/moleculeEditor';

export function findAtom(model: MoleculeModel, atomId: string): MoleculeAtom | null {
  return model.atoms.find((atom) => atom.id === atomId) ?? null;
}

export function findBond(model: MoleculeModel, firstAtomId: string, secondAtomId: string) {
  return (
    model.bonds.find((bond) => {
      return (
        (bond.sourceId === firstAtomId && bond.targetId === secondAtomId) ||
        (bond.sourceId === secondAtomId && bond.targetId === firstAtomId)
      );
    }) ?? null
  );
}
