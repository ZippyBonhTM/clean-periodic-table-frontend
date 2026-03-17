import type { ChemistryBalanceTextCatalog } from '@/components/templates/chemistryBalanceText';

export type ChemistryBalanceExample = {
  id:
    | 'methaneCombustion'
    | 'waterFormation'
    | 'ironOxideFormation'
    | 'calciumCarbonateBreakdown'
    | 'sodiumChlorideFormation';
  category: 'combustion' | 'synthesis' | 'decomposition' | 'ionic';
  title: string;
  equation: string;
  description: string;
};

const CHEMISTRY_BALANCE_EXAMPLE_BASE = [
  {
    id: 'methaneCombustion',
    category: 'combustion',
    equation: 'CH4 + O2 -> CO2 + H2O',
  },
  {
    id: 'waterFormation',
    category: 'synthesis',
    equation: 'H2 + O2 -> H2O',
  },
  {
    id: 'ironOxideFormation',
    category: 'synthesis',
    equation: 'Fe + O2 -> Fe2O3',
  },
  {
    id: 'calciumCarbonateBreakdown',
    category: 'decomposition',
    equation: 'CaCO3 -> CaO + CO2',
  },
  {
    id: 'sodiumChlorideFormation',
    category: 'ionic',
    equation: 'Na+ + Cl- -> NaCl',
  },
] as const;

export function getChemistryBalanceExamples(
  text: ChemistryBalanceTextCatalog,
): ChemistryBalanceExample[] {
  return CHEMISTRY_BALANCE_EXAMPLE_BASE.map((example) => ({
    ...example,
    title: text.examples.items[example.id].title,
    description: text.examples.items[example.id].description,
  }));
}
