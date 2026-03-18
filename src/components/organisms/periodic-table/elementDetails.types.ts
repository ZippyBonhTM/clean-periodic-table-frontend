export type ViewerMode = '2d' | '3d' | 'image';
export type DetailsViewMode = 'cards' | 'table';
export type ElementMetaRowKey =
  | 'name'
  | 'symbol'
  | 'atomicNumber'
  | 'atomicMass'
  | 'category'
  | 'phase'
  | 'group'
  | 'period'
  | 'block'
  | 'appearance'
  | 'density'
  | 'boilingPoint'
  | 'meltingPoint'
  | 'molarHeat'
  | 'electronAffinity'
  | 'electronegativityPauling'
  | 'electronConfiguration'
  | 'electronConfigSemantic'
  | 'ionizationEnergies'
  | 'shells'
  | 'discoveredBy'
  | 'namedBy'
  | 'cpkHex'
  | 'tablePositionX'
  | 'tablePositionY'
  | 'widePositionX'
  | 'widePositionY'
  | 'imageTitle'
  | 'imageAttribution'
  | 'summary';

export type ElementMetaRow = {
  key: ElementMetaRowKey;
  label: string;
  value: string;
};

export type ExpandedImageState = {
  kind: 'bohr' | 'element';
  src: string;
  alt: string;
};
