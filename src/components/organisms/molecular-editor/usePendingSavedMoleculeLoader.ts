'use client';

import { useEffect, useRef, useState } from 'react';

import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import type { SavedMoleculePageMode } from '@/components/organisms/molecular-editor/savedMoleculeWorkflowOptions.types';
import {
  clearPendingSavedMoleculeId,
  readPendingSavedMoleculeId,
} from '@/shared/storage/pendingSavedMoleculeStorage';
import type { SavedMolecule } from '@/shared/types/molecule';

type UsePendingSavedMoleculeLoaderOptions = {
  applySavedMolecule: (savedMolecule: SavedMolecule, notice: string) => void;
  isSavedMoleculesLoading: boolean;
  normalizedSavedMolecules: SavedMolecule[];
  pageMode: SavedMoleculePageMode;
  showGalleryFeedback: ShowGalleryFeedback;
};

export default function usePendingSavedMoleculeLoader({
  applySavedMolecule,
  isSavedMoleculesLoading,
  normalizedSavedMolecules,
  pageMode,
  showGalleryFeedback,
}: UsePendingSavedMoleculeLoaderOptions) {
  const [hasCheckedPendingSavedMolecule, setHasCheckedPendingSavedMolecule] = useState(pageMode !== 'editor');
  const [hasPendingSavedMolecule, setHasPendingSavedMolecule] = useState(false);
  const pendingSavedMoleculeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (pageMode !== 'editor') {
      return;
    }

    if (pendingSavedMoleculeIdRef.current === null) {
      pendingSavedMoleculeIdRef.current = readPendingSavedMoleculeId();
    }

    setHasPendingSavedMolecule(pendingSavedMoleculeIdRef.current !== null);
    setHasCheckedPendingSavedMolecule(true);

    const pendingSavedMoleculeId = pendingSavedMoleculeIdRef.current;

    if (pendingSavedMoleculeId === null || isSavedMoleculesLoading) {
      return;
    }

    const pendingSavedMolecule = normalizedSavedMolecules.find((entry) => entry.id === pendingSavedMoleculeId);

    if (pendingSavedMolecule === undefined) {
      const timeoutId = window.setTimeout(() => {
        clearPendingSavedMoleculeId();
        pendingSavedMoleculeIdRef.current = null;
        setHasPendingSavedMolecule(false);
        showGalleryFeedback('error', 'Could not find the selected gallery molecule.');
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      clearPendingSavedMoleculeId();
      pendingSavedMoleculeIdRef.current = null;
      setHasPendingSavedMolecule(false);
      applySavedMolecule(
        pendingSavedMolecule,
        `${pendingSavedMolecule.name ?? pendingSavedMolecule.summary.formula} loaded from gallery.`,
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applySavedMolecule, isSavedMoleculesLoading, normalizedSavedMolecules, pageMode, showGalleryFeedback]);

  return {
    hasCheckedPendingSavedMolecule,
    hasPendingSavedMolecule,
  };
}
