import type { MoleculeCounts, MoleculeModel } from '@/shared/utils/moleculeEditor';

export function summarizeMolecule(model: MoleculeModel): MoleculeCounts {
  return {
    atomCount: model.atoms.length,
    bondCount: model.bonds.length,
    totalBondOrder: model.bonds.reduce((sum, bond) => sum + bond.order, 0),
  };
}

export function buildMolecularFormula(model: MoleculeModel): string {
  if (model.atoms.length === 0) {
    return 'Empty molecule';
  }

  const counts = new Map<string, number>();

  model.atoms.forEach((atom) => {
    counts.set(atom.element.symbol, (counts.get(atom.element.symbol) ?? 0) + 1);
  });

  const symbols = [...counts.keys()];
  const hasCarbon = counts.has('C');

  symbols.sort((first, second) => {
    if (hasCarbon) {
      if (first === 'C') {
        return -1;
      }

      if (second === 'C') {
        return 1;
      }

      if (first === 'H') {
        return second === 'C' ? 1 : -1;
      }

      if (second === 'H') {
        return first === 'C' ? -1 : 1;
      }
    }

    return first.localeCompare(second);
  });

  return symbols
    .map((symbol) => {
      const count = counts.get(symbol) ?? 0;
      return `${symbol}${count > 1 ? count : ''}`;
    })
    .join('');
}

export function buildCompositionRows(model: MoleculeModel): Array<{ symbol: string; count: number; name: string }> {
  const counts = new Map<string, { count: number; name: string }>();

  model.atoms.forEach((atom) => {
    const current = counts.get(atom.element.symbol);

    if (current === undefined) {
      counts.set(atom.element.symbol, {
        count: 1,
        name: atom.element.name,
      });
      return;
    }

    counts.set(atom.element.symbol, {
      count: current.count + 1,
      name: current.name,
    });
  });

  return [...counts.entries()]
    .map(([symbol, entry]) => ({ symbol, count: entry.count, name: entry.name }))
    .sort((first, second) => first.symbol.localeCompare(second.symbol));
}
