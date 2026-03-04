type ElementImage = {
  title: string;
  url: string;
  attribution: string;
};

type ChemicalElement = {
  symbol: string;
  name: string;
  number: number;
  category: string;
  phase: string;
  atomic_mass: number;
  summary: string;
  image: ElementImage;
};

export type { ChemicalElement, ElementImage };
