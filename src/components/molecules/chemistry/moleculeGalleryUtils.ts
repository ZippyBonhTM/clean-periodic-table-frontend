'use client';

import {
  formatMolecularEditorSavedAtLabel,
  type MolecularEditorTextCatalog,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

export function formatSavedAtLabel(
  text: MolecularEditorTextCatalog,
  locale: AppLocale,
  value: string,
): string {
  return formatMolecularEditorSavedAtLabel(text, locale, value);
}

export function stripMarkdownForPreview(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
