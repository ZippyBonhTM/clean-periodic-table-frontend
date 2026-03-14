export type ViewerMode = '2d' | '3d' | 'image';
export type DetailsViewMode = 'cards' | 'table';

export type ElementMetaRow = {
  label: string;
  value: string;
};

export type ExpandedImageState = {
  kind: 'bohr' | 'element';
  src: string;
  alt: string;
};
