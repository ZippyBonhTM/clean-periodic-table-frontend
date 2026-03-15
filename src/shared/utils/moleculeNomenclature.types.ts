type BondOrder = 1 | 2 | 3;

type NomenclatureAtom = {
  id: string;
  element: {
    symbol: string;
    name: string;
  };
};

type NomenclatureBond = {
  sourceId: string;
  targetId: string;
  order: BondOrder;
};

type MoleculeModel = {
  atoms: NomenclatureAtom[];
  bonds: NomenclatureBond[];
};

type NeighborLink = {
  atomId: string;
  order: BondOrder;
};

type MoleculeSubstituent = {
  baseName: string;
  position: number;
};

type MoleculeChainContext = {
  nitrilePositions: number[];
  hydroxyPositions: number[];
  aminoPositions: number[];
  substituents: MoleculeSubstituent[];
};

const CHAIN_ROOTS: Record<number, string> = {
  1: 'met',
  2: 'et',
  3: 'prop',
  4: 'but',
  5: 'pent',
  6: 'hex',
  7: 'hept',
  8: 'oct',
  9: 'non',
  10: 'dec',
  11: 'undec',
  12: 'dodec',
};

const ALKYL_NAMES: Record<number, string> = {
  1: 'metil',
  2: 'etil',
  3: 'propil',
  4: 'butil',
  5: 'pentil',
  6: 'hexil',
};

const HALOGEN_PREFIXES: Record<string, string> = {
  F: 'fluoro',
  Cl: 'cloro',
  Br: 'bromo',
  I: 'iodo',
};

const MULTIPLIER_PREFIXES: Record<number, string> = {
  2: 'di',
  3: 'tri',
  4: 'tetra',
  5: 'penta',
  6: 'hexa',
};

export type {
  BondOrder,
  MoleculeChainContext,
  MoleculeModel,
  MoleculeSubstituent,
  NeighborLink,
  NomenclatureAtom,
  NomenclatureBond,
};

export { ALKYL_NAMES, CHAIN_ROOTS, HALOGEN_PREFIXES, MULTIPLIER_PREFIXES };
