import { molecularEditorTextEn } from '@/components/organisms/molecular-editor/molecularEditorText.en';
import { molecularEditorTextPt } from '@/components/organisms/molecular-editor/molecularEditorText.pt';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import type { BondOrder } from '@/shared/utils/moleculeEditor';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const MOLECULAR_EDITOR_TEXT_BY_LOCALE = {
  'en-US': molecularEditorTextEn,
  'pt-BR': molecularEditorTextPt,
} as const;

type WidenMolecularEditorTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenMolecularEditorTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenMolecularEditorTextLiterals<T[Key]> }
        : T;

export type MolecularEditorTextCatalog = WidenMolecularEditorTextLiterals<typeof molecularEditorTextEn>;

type EditorViewMode = SavedMoleculeEditorState['activeView'];

export function getMolecularEditorText(locale: AppLocale): MolecularEditorTextCatalog {
  return MOLECULAR_EDITOR_TEXT_BY_LOCALE[locale];
}

export function getMolecularEditorViewLabel(
  text: MolecularEditorTextCatalog,
  mode: EditorViewMode,
): string {
  return text.viewOptions[mode];
}

export function getMolecularEditorBondOrderLabel(
  text: MolecularEditorTextCatalog,
  order: BondOrder,
): string {
  return text.bondOrders[order];
}

export function formatMolecularEditorSavedAtLabel(
  text: MolecularEditorTextCatalog,
  locale: AppLocale,
  value: string,
): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return text.gallery.unknownSyncTime;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function formatMolecularEditorSavedCount(
  text: MolecularEditorTextCatalog,
  count: number,
): string {
  return `${count} ${text.gallery.savedSuffix}`;
}

export function formatMolecularEditorComponentCount(
  text: MolecularEditorTextCatalog,
  count: number,
): string {
  return `${count} ${text.componentRail.componentsSuffix}`;
}

export function formatMolecularEditorComponentLabel(
  text: MolecularEditorTextCatalog,
  index: number,
): string {
  return `${text.componentRail.moleculeShort} ${index + 1}`;
}

export function formatMolecularEditorComponentFocusTitle(
  text: MolecularEditorTextCatalog,
  index: number,
  componentFormula: string,
): string {
  const label = `${text.componentRail.focusComponent} ${index + 1}`;
  return componentFormula.length > 0 ? `${label} (${componentFormula})` : label;
}

export function formatMolecularEditorPreviewLabel(
  text: MolecularEditorTextCatalog,
  title: string,
): string {
  return `${text.gallery.previewPrefix} ${title}`;
}

export function formatMolecularEditorPlacementAddedToCanvas(
  text: MolecularEditorTextCatalog,
  symbol: string,
): string {
  return `${symbol} ${text.notices.addedToCanvasSuffix}`;
}

export function formatMolecularEditorPlacementOnCanvas(
  text: MolecularEditorTextCatalog,
  symbol: string,
): string {
  return `${symbol} ${text.notices.placedOnCanvasSuffix}`;
}

export function formatMolecularEditorPlacementAttachedToSelection(
  text: MolecularEditorTextCatalog,
  symbol: string,
): string {
  return `${symbol} ${text.notices.attachedToSelectedAtomSuffix}`;
}

export function formatMolecularEditorPlacementBondMessage(
  text: MolecularEditorTextCatalog,
  symbol: string,
  bondLabel: string,
): string {
  const suffix = text.notices.linkedWithBondSuffix.startsWith('.') ? text.notices.linkedWithBondSuffix : ` ${text.notices.linkedWithBondSuffix}`;
  return `${symbol} ${text.notices.linkedWithBondPrefix} ${bondLabel.toLowerCase()}${suffix}`.trim();
}

export function formatMolecularEditorGalleryLoadedMessage(
  text: MolecularEditorTextCatalog,
  label: string,
): string {
  return `${label} ${text.notices.loadedSuffix}`;
}

export function formatMolecularEditorSimplifiedDescription(
  text: MolecularEditorTextCatalog,
  focusedComponentIndex: number,
  moleculeComponentsCount: number,
): string {
  if (moleculeComponentsCount > 1) {
    return `${text.simplifiedView.componentDescriptionPrefix} ${focusedComponentIndex + 1}.`;
  }

  return text.simplifiedView.currentMoleculeDescription;
}

export function formatMolecularEditorBondDisabledTitle(
  text: MolecularEditorTextCatalog,
  activeElementSymbol: string | null,
  activeElementMaxBondSlots: number | null,
  bondLabel: string,
): string {
  if (activeElementSymbol !== null && activeElementMaxBondSlots !== null) {
    const slotLabel =
      activeElementMaxBondSlots === 1 ? text.toolRail.bondSlotSingular : text.toolRail.bondSlotPlural;
    return `${activeElementSymbol} ${text.toolRail.supportsUpTo} ${activeElementMaxBondSlots} ${slotLabel}.`;
  }

  return bondLabel;
}
