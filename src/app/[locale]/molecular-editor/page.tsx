import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import MolecularEditorWorkspace from '@/components/templates/MolecularEditorWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

type LocalizedMolecularEditorPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedMolecularEditorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildLocalizedPageMetadata(resolvedLocale, 'molecularEditor');
}

export default async function LocalizedMolecularEditorPage({
  params,
}: LocalizedMolecularEditorPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <MolecularEditorWorkspace />;
}
