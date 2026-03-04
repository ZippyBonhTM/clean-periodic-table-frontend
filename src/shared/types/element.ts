type ElementImage = {
  title: string;
  url: string;
  attribution: string;
};

type ChemicalElement = {
  appearance: string | null;
  atomic_mass: number;
  block: string;
  bohr_model_3d: string | null;
  bohr_model_image: string | null;
  boil: number | null;
  category: string;
  'cpk-hex': string | null;
  density: number | null;
  discovered_by: string | null;
  electron_affinity: number | null;
  electron_configuration: string;
  electron_configuration_semantic: string;
  electronegativity_pauling: number | null;
  group: number;
  image: ElementImage;
  ionization_energies: number[];
  melt: number | null;
  molar_heat: number | null;
  name: string;
  named_by: string | null;
  number: number;
  period: number;
  phase: string;
  shells: number[];
  source: string;
  spectral_img: string | null;
  summary: string;
  symbol: string;
  wxpos: number;
  wypos: number;
  xpos: number;
  ypos: number;
};

export type { ChemicalElement, ElementImage };
