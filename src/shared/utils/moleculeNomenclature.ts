import { resolveSupportedBenzeneName } from '@/shared/utils/moleculeNomenclatureAromatic';
import {
  buildAtomMap,
  buildCarbonNeighborMap,
  buildNeighborMap,
  hasCycleInGraph,
  isConnectedGraph,
} from '@/shared/utils/moleculeNomenclatureGraph';
import type { MoleculeModel } from '@/shared/utils/moleculeNomenclature.types';
import {
  buildParentName,
  buildSubstituentPrefix,
  compareLocantPriority,
  resolveUnsaturationLocants,
} from '@/shared/utils/moleculeNomenclatureNaming';
import {
  resolveBestParentChain,
  resolveSupportedContextForChain,
} from '@/shared/utils/moleculeNomenclatureChain';

function buildSystematicMoleculeName(model: MoleculeModel): string | null {
  if (model.atoms.length === 0) {
    return null;
  }

  const atomById = buildAtomMap(model);
  const neighborMap = buildNeighborMap(model);
  const carbonAtomIds = model.atoms.filter((atom) => atom.element.symbol === 'C').map((atom) => atom.id);

  if (carbonAtomIds.length === 0) {
    return null;
  }

  const carbonNeighborMap = buildCarbonNeighborMap(carbonAtomIds, atomById, neighborMap);

  const supportedBenzeneName = resolveSupportedBenzeneName(
    model,
    atomById,
    carbonAtomIds,
    carbonNeighborMap,
    neighborMap,
  );

  if (supportedBenzeneName !== null) {
    return supportedBenzeneName;
  }

  if (!isConnectedGraph(carbonAtomIds, carbonNeighborMap)) {
    return null;
  }

  if (hasCycleInGraph(carbonNeighborMap, carbonAtomIds[0])) {
    return null;
  }

  const parentChain = resolveBestParentChain(carbonAtomIds, atomById, neighborMap, carbonNeighborMap);

  if (parentChain === null) {
    return null;
  }

  const forwardContext = resolveSupportedContextForChain(parentChain, atomById, neighborMap);
  const reverseContext = resolveSupportedContextForChain([...parentChain].reverse(), atomById, neighborMap);
  const forwardUnsaturation = resolveUnsaturationLocants(parentChain, neighborMap);
  const reverseUnsaturation = resolveUnsaturationLocants([...parentChain].reverse(), neighborMap);

  if (
    forwardContext === null ||
    reverseContext === null ||
    forwardUnsaturation === null ||
    reverseUnsaturation === null
  ) {
    return null;
  }

  const forwardUsesAminoAsPrincipal = forwardContext.hydroxyPositions.length === 0 && forwardContext.aminoPositions.length > 0;
  const reverseUsesAminoAsPrincipal = reverseContext.hydroxyPositions.length === 0 && reverseContext.aminoPositions.length > 0;
  const forwardUsesNitrileAsPrincipal = forwardContext.nitrilePositions.length > 0;
  const reverseUsesNitrileAsPrincipal = reverseContext.nitrilePositions.length > 0;

  const forwardLocants = {
    nitrile: forwardUsesNitrileAsPrincipal ? forwardContext.nitrilePositions : [],
    hydroxy: forwardContext.hydroxyPositions,
    amino: !forwardUsesNitrileAsPrincipal && forwardUsesAminoAsPrincipal ? forwardContext.aminoPositions : [],
    double: forwardUnsaturation.double,
    triple: forwardUnsaturation.triple,
    substituent: [
      ...forwardContext.substituents.map((substituent) => substituent.position),
      ...(!forwardUsesNitrileAsPrincipal && forwardUsesAminoAsPrincipal ? [] : forwardContext.aminoPositions),
    ].sort((first, second) => first - second),
  };
  const reverseLocants = {
    nitrile: reverseUsesNitrileAsPrincipal ? reverseContext.nitrilePositions : [],
    hydroxy: reverseContext.hydroxyPositions,
    amino: !reverseUsesNitrileAsPrincipal && reverseUsesAminoAsPrincipal ? reverseContext.aminoPositions : [],
    double: reverseUnsaturation.double,
    triple: reverseUnsaturation.triple,
    substituent: [
      ...reverseContext.substituents.map((substituent) => substituent.position),
      ...(!reverseUsesNitrileAsPrincipal && reverseUsesAminoAsPrincipal ? [] : reverseContext.aminoPositions),
    ].sort((first, second) => first - second),
  };

  const useReverseOrientation = compareLocantPriority(reverseLocants, forwardLocants) < 0;
  const resolvedContext = useReverseOrientation ? reverseContext : forwardContext;
  const resolvedUnsaturation = useReverseOrientation ? reverseUnsaturation : forwardUnsaturation;
  const usesNitrileAsPrincipal = resolvedContext.nitrilePositions.length > 0;
  const usesAminoAsPrincipal =
    !usesNitrileAsPrincipal && resolvedContext.hydroxyPositions.length === 0 && resolvedContext.aminoPositions.length > 0;
  const resolvedSubstituents = [
    ...resolvedContext.substituents,
    ...(usesAminoAsPrincipal
      ? []
      : resolvedContext.aminoPositions.map((position) => ({
          baseName: 'amino',
          position,
        }))),
  ];
  const parentName = buildParentName(
    parentChain.length,
    resolvedUnsaturation.double,
    resolvedUnsaturation.triple,
    usesNitrileAsPrincipal ? resolvedContext.nitrilePositions : [],
    resolvedContext.hydroxyPositions,
    usesAminoAsPrincipal ? resolvedContext.aminoPositions : [],
    resolvedSubstituents.length > 0,
  );

  if (parentName === null) {
    return null;
  }

  const substituentPrefix = buildSubstituentPrefix(resolvedSubstituents);

  if (substituentPrefix === null) {
    return null;
  }

  return substituentPrefix.length > 0 ? `${substituentPrefix}${parentName}` : parentName;
}

export { buildSystematicMoleculeName };
