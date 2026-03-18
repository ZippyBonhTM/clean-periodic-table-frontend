import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import MolecularEditorWorkspace from '@/components/templates/MolecularEditorWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

type LocalizedMoleculeGalleryPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedMoleculeGalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildLocalizedPageMetadata(resolvedLocale, 'moleculeGallery');
}

export default async function LocalizedMoleculeGalleryPage({
  params,
}: LocalizedMoleculeGalleryPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <MolecularEditorWorkspace pageMode="gallery" />;
}
