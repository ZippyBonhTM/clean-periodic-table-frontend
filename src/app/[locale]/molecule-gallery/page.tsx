import { notFound } from 'next/navigation';

import MolecularEditorWorkspace from '@/components/templates/MolecularEditorWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedMoleculeGalleryPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedMoleculeGalleryPage({
  params,
}: LocalizedMoleculeGalleryPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <MolecularEditorWorkspace pageMode="gallery" />;
}
