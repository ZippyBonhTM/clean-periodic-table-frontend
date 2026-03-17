export type ChemistryBalanceExample = {
  category: 'combustion' | 'synthesis' | 'decomposition' | 'ionic';
  title: string;
  equation: string;
  description: string;
};

export const CHEMISTRY_BALANCE_EXAMPLES: ChemistryBalanceExample[] = [
  {
    category: 'combustion',
    title: 'Methane combustion',
    equation: 'CH4 + O2 -> CO2 + H2O',
    description: 'A hydrocarbon burns in oxygen to form carbon dioxide and water.',
  },
  {
    category: 'synthesis',
    title: 'Water formation',
    equation: 'H2 + O2 -> H2O',
    description: 'Two simple reactants combine into a single product family.',
  },
  {
    category: 'synthesis',
    title: 'Iron oxide formation',
    equation: 'Fe + O2 -> Fe2O3',
    description: 'Metal oxidation is a good example of coefficient growth during balancing.',
  },
  {
    category: 'decomposition',
    title: 'Calcium carbonate breakdown',
    equation: 'CaCO3 -> CaO + CO2',
    description: 'A single reactant decomposes into two simpler products.',
  },
  {
    category: 'ionic',
    title: 'Sodium chloride formation',
    equation: 'Na+ + Cl- -> NaCl',
    description: 'A small ionic example that also exercises explicit charge handling.',
  },
];
