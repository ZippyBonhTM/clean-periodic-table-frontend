import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

let moleculeIdCounter = 0;

const IDENTIFIER_PATTERN = /^(atom|bond)-(\d+)$/;

export function nextMoleculeId(prefix: 'atom' | 'bond'): string {
  moleculeIdCounter += 1;
  return `${prefix}-${moleculeIdCounter}`;
}

export function resolveMaxMoleculeIdentifier(model: MoleculeModel): number {
  return [...model.atoms.map((atom) => atom.id), ...model.bonds.map((bond) => bond.id)].reduce((maxValue, id) => {
    const match = IDENTIFIER_PATTERN.exec(id);

    if (match === null) {
      return maxValue;
    }

    const parsed = Number(match[2]);
    return Number.isFinite(parsed) ? Math.max(maxValue, parsed) : maxValue;
  }, 0);
}

export function syncMoleculeIdCounter(model: MoleculeModel): void {
  moleculeIdCounter = Math.max(moleculeIdCounter, resolveMaxMoleculeIdentifier(model));
}
