import {
  dedupeBondConnections,
  findBond,
  nextMoleculeId,
  syncMoleculeIdCounter,
} from '@/shared/utils/moleculeGraph';
import { rebalanceMoleculeLayout } from '@/shared/utils/moleculeLayout';
import { canApplyBondOrder } from '@/shared/utils/moleculeValence';
import type { BondOrder, MoleculeBond, MoleculeModel } from '@/shared/utils/moleculeEditor.types';

export function connectAtoms(model: MoleculeModel, firstAtomId: string, secondAtomId: string, order: BondOrder) {
  const sanitizedModel = dedupeBondConnections(model);

  syncMoleculeIdCounter(sanitizedModel);

  const validation = canApplyBondOrder(sanitizedModel, firstAtomId, secondAtomId, order);

  if (!validation.ok) {
    return {
      molecule: sanitizedModel,
      selectedAtomId: firstAtomId,
      issue: validation.issue,
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
