import { ApiError, requestJson } from '@/shared/api/httpClient';
import type { ChemicalElement } from '@/shared/types/element';
import {
  normalizeMoleculeModel,
  resolveMoleculeComponents,
  resolvePrimaryMoleculeComponentIndex,
  type BondOrder,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov';
const PUBCHEM_RESULT_LIMIT = 6;
const DEFAULT_IMPORTED_BOND_LENGTH = 92;

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

function normalizePubChemName(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized !== undefined && normalized.length > 0 ? normalized : fallback;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const nextValues: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();

    if (normalized.length === 0) {
      return;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    nextValues.push(normalized);
  });

  return nextValues;
}

function dedupeNumbers(values: number[]): number[] {
  const seen = new Set<number>();
  const nextValues: number[] = [];

  values.forEach((value) => {
    if (!Number.isFinite(value) || seen.has(value)) {
      return;
    }

    seen.add(value);
    nextValues.push(value);
  });

  return nextValues;
}

async function requestPubChemCidsByName(
  query: string,
  nameType: 'complete' | 'word',
  signal?: AbortSignal,
): Promise<number[]> {
  const encodedQuery = encodeURIComponent(query.trim());

  if (encodedQuery.length === 0) {
    return [];
  }

  try {
    const response = await requestJson<PubChemCidResponse>(
      PUBCHEM_BASE_URL,
      `/rest/pug/compound/name/${encodedQuery}/cids/JSON?name_type=${nameType}`,
      {
        signal,
      },
    );

    return dedupeNumbers(response.IdentifierList?.CID ?? []);
  } catch (caughtError: unknown) {
    if (caughtError instanceof ApiError && caughtError.statusCode === 404) {
      return [];
    }

    throw caughtError;
  }
}

async function listPubChemAutocompleteSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return trimmedQuery.length === 0 ? [] : [trimmedQuery];
  }

  const encodedQuery = encodeURIComponent(trimmedQuery);
  const response = await requestJson<PubChemAutocompleteResponse>(
    PUBCHEM_BASE_URL,
    `/rest/autocomplete/compound/${encodedQuery}/JSON`,
    {
      signal,
    },
  );

  return dedupeStrings([trimmedQuery, ...(response.dictionary_terms?.compound ?? [])]).slice(0, 8);
}

async function listPubChemCompoundResultsByTerm(
  term: string,
  signal?: AbortSignal,
): Promise<PubChemCompoundSearchResult[]> {
  const trimmedTerm = term.trim();

  if (trimmedTerm.length === 0) {
    return [];
  }

  const exactCids = await requestPubChemCidsByName(trimmedTerm, 'complete', signal);
  const fallbackCids =
    exactCids.length >= PUBCHEM_RESULT_LIMIT ? [] : await requestPubChemCidsByName(trimmedTerm, 'word', signal);
  const resolvedCids = dedupeNumbers([...exactCids, ...fallbackCids]).slice(0, PUBCHEM_RESULT_LIMIT);

  if (resolvedCids.length === 0) {
    return [];
  }

  const response = await requestJson<PubChemPropertiesResponse>(
    PUBCHEM_BASE_URL,
    `/rest/pug/compound/cid/${resolvedCids.join(',')}/property/Title,IUPACName,MolecularFormula/JSON`,
    {
      signal,
    },
  );
  const propertiesByCid = new Map(
    (response.PropertyTable?.Properties ?? []).map((entry) => [entry.CID, entry]),
  );

  return resolvedCids.map((cid) => {
    const properties = propertiesByCid.get(cid);

    return {
      cid,
      title: normalizePubChemName(properties?.Title, `CID ${cid}`),
      iupacName: properties?.IUPACName?.trim() ?? null,
      molecularFormula: properties?.MolecularFormula?.trim() ?? null,
      matchedTerm: trimmedTerm,
    };
  });
}

async function listPubChemCompoundSearchResults(
  query: string,
  signal?: AbortSignal,
): Promise<{
  activeTerm: string | null;
  suggestions: string[];
  results: PubChemCompoundSearchResult[];
}> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return {
      activeTerm: null,
      suggestions: [],
      results: [],
    };
  }

  const suggestions = await listPubChemAutocompleteSuggestions(trimmedQuery, signal);
  const activeTerm = suggestions[0] ?? trimmedQuery;

  return {
    activeTerm,
    suggestions,
    results: await listPubChemCompoundResultsByTerm(activeTerm, signal),
  };
}

function resolveImportedBondLengthScale(
  rawPointsByAid: Map<number, { x: number; y: number }>,
  aid1: number[],
  aid2: number[],
): number {
  const bondLengths = aid1.flatMap((firstAid, index) => {
    const secondAid = aid2[index];
    const firstPoint = rawPointsByAid.get(firstAid);
    const secondPoint = rawPointsByAid.get(secondAid);

    if (firstPoint === undefined || secondPoint === undefined) {
      return [];
    }

    const length = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
    return Number.isFinite(length) && length > 0 ? [length] : [];
  });

  if (bondLengths.length === 0) {
    return 56;
  }

  const averageLength = bondLengths.reduce((total, value) => total + value, 0) / bondLengths.length;
  return DEFAULT_IMPORTED_BOND_LENGTH / averageLength;
}

function recenterImportedModel(model: MoleculeModel): MoleculeModel {
  if (model.atoms.length === 0) {
    return model;
  }

  const centerX = model.atoms.reduce((total, atom) => total + atom.x, 0) / model.atoms.length;
  const centerY = model.atoms.reduce((total, atom) => total + atom.y, 0) / model.atoms.length;

  return {
    atoms: model.atoms.map((atom) => ({
      ...atom,
      x: atom.x - centerX,
      y: atom.y - centerY,
    })),
    bonds: model.bonds,
  };
}

function convertPubChemRecordToMoleculeModel(
  record: PubChemRecordResponse,
  elements: ChemicalElement[],
): {
  molecule: MoleculeModel;
  mainComponentMolecule: MoleculeModel;
  componentCount: number;
  omittedFragmentCount: number;
} {
  const compound = record.PC_Compounds?.[0];
  const atomIds = compound?.atoms?.aid ?? [];
  const atomicNumbers = compound?.atoms?.element ?? [];
  const aid1 = compound?.bonds?.aid1 ?? [];
  const aid2 = compound?.bonds?.aid2 ?? [];
  const orders = compound?.bonds?.order ?? [];
  const coordinateSet = compound?.coords?.find((entry) => {
    const conformer = entry.conformers?.[0];
    return (
      entry.aid !== undefined &&
      conformer?.x !== undefined &&
      conformer?.y !== undefined &&
      entry.aid.length === conformer.x.length &&
      entry.aid.length === conformer.y.length
    );
  });

  if (
    atomIds.length === 0 ||
    atomIds.length !== atomicNumbers.length ||
    coordinateSet === undefined ||
    coordinateSet.conformers === undefined ||
    coordinateSet.conformers[0] === undefined
  ) {
    throw new Error('PubChem did not return a usable 2D structure for this compound.');
  }

  const conformer = coordinateSet.conformers[0];
  const elementByNumber = new Map(elements.map((element) => [element.number, element]));
  const rawPointsByAid = new Map<number, { x: number; y: number }>();

  coordinateSet.aid?.forEach((aid, index) => {
    const x = conformer.x?.[index];
    const y = conformer.y?.[index];

    if (x === undefined || y === undefined) {
      return;
    }

    rawPointsByAid.set(aid, { x, y });
  });

  if (rawPointsByAid.size !== atomIds.length) {
    throw new Error('PubChem returned incomplete coordinates for this structure.');
  }

  const scale = resolveImportedBondLengthScale(rawPointsByAid, aid1, aid2);
  const rawPoints = [...rawPointsByAid.values()];
  const centerX = rawPoints.reduce((total, point) => total + point.x, 0) / rawPoints.length;
  const centerY = rawPoints.reduce((total, point) => total + point.y, 0) / rawPoints.length;

  const atoms = atomIds.map((aid, index) => {
    const element = elementByNumber.get(atomicNumbers[index]);
    const point = rawPointsByAid.get(aid);

    if (element === undefined || point === undefined) {
      throw new Error('This imported compound uses an element the editor could not resolve.');
    }

    return {
      id: `atom-${aid}`,
      element,
      x: (point.x - centerX) * scale,
      y: -(point.y - centerY) * scale,
    };
  });

  const bonds = aid1.flatMap((firstAid, index) => {
    const secondAid = aid2[index];
    const rawOrder = orders[index];

    if (secondAid === undefined || rawOrder === undefined || rawOrder < 1 || rawOrder > 3) {
      return [];
    }

    return [
      {
        id: `bond-${index + 1}`,
        sourceId: `atom-${firstAid}`,
        targetId: `atom-${secondAid}`,
        order: rawOrder as BondOrder,
      },
    ];
  });

  const normalizedModel = normalizeMoleculeModel({ atoms, bonds }).model;
  const components = resolveMoleculeComponents(normalizedModel);
  const primaryComponentIndex = resolvePrimaryMoleculeComponentIndex(components);
  const primaryComponent = components[primaryComponentIndex]?.model ?? normalizedModel;
  const hasDistinctDominantComponent =
    components.length > 1 &&
    (() => {
      const sortedHeavyComponents = components
        .map((component) => ({
          heavyAtomCount: component.heavyAtomCount,
          bondCount: component.model.bonds.length,
          atomCount: component.model.atoms.length,
        }))
        .sort((first, second) => {
          if (first.heavyAtomCount !== second.heavyAtomCount) {
            return second.heavyAtomCount - first.heavyAtomCount;
          }

          if (first.bondCount !== second.bondCount) {
            return second.bondCount - first.bondCount;
          }

          return second.atomCount - first.atomCount;
        });

      const dominant = sortedHeavyComponents[0];
      const secondary = sortedHeavyComponents[1];

      if (dominant === undefined || secondary === undefined) {
        return false;
      }

      return (
        dominant.heavyAtomCount !== secondary.heavyAtomCount ||
        dominant.bondCount !== secondary.bondCount ||
        dominant.atomCount !== secondary.atomCount
      );
    })();

  return {
    molecule: normalizedModel,
    mainComponentMolecule: normalizeMoleculeModel(recenterImportedModel(primaryComponent)).model,
    componentCount: components.length,
    omittedFragmentCount: hasDistinctDominantComponent ? components.length - 1 : 0,
  };
}

async function importPubChemCompound(
  compound: PubChemCompoundSearchResult,
  elements: ChemicalElement[],
  signal?: AbortSignal,
): Promise<ImportedPubChemCompound> {
  const record = await requestJson<PubChemRecordResponse>(
    PUBCHEM_BASE_URL,
    `/rest/pug/compound/cid/${compound.cid}/record/JSON?record_type=2d`,
    {
      signal,
    },
  );

  return {
    ...compound,
    ...convertPubChemRecordToMoleculeModel(record, elements),
  };
}

export {
  importPubChemCompound,
  listPubChemAutocompleteSuggestions,
  listPubChemCompoundResultsByTerm,
  listPubChemCompoundSearchResults,
};
export type {
  ImportedPubChemCompound,
  PubChemCompoundSearchResult,
  PubChemImportMode,
  ResolvedImportedPubChemCompound,
};
