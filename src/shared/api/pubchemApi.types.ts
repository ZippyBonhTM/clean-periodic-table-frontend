import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

type PubChemAutocompleteResponse = {
  dictionary_terms?: {
    compound?: string[];
  };
};

type PubChemCidResponse = {
  IdentifierList?: {
    CID?: number[];
  };
};

type PubChemPropertiesResponse = {
  PropertyTable?: {
    Properties?: Array<{
      CID: number;
      Title?: string;
      IUPACName?: string;
      MolecularFormula?: string;
    }>;
  };
};

type PubChemRecordResponse = {
  PC_Compounds?: Array<{
    atoms?: {
      aid?: number[];
      element?: number[];
    };
    bonds?: {
      aid1?: number[];
      aid2?: number[];
      order?: number[];
    };
    coords?: Array<{
      aid?: number[];
      conformers?: Array<{
        x?: number[];
        y?: number[];
      }>;
    }>;
  }>;
};

type PubChemCompoundSearchResult = {
  cid: number;
  title: string;
  iupacName: string | null;
  molecularFormula: string | null;
  matchedTerm: string;
};

type PubChemImportMode = 'main' | 'all';

type ImportedPubChemCompound = PubChemCompoundSearchResult & {
  molecule: MoleculeModel;
  mainComponentMolecule: MoleculeModel;
  componentCount: number;
  omittedFragmentCount: number;
};

type ResolvedImportedPubChemCompound = ImportedPubChemCompound & {
  importMode: PubChemImportMode;
};

export type {
  ImportedPubChemCompound,
  PubChemAutocompleteResponse,
  PubChemCidResponse,
  PubChemCompoundSearchResult,
  PubChemImportMode,
  PubChemPropertiesResponse,
  PubChemRecordResponse,
  ResolvedImportedPubChemCompound,
};
