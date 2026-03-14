'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  GalleryFeedback,
  GalleryFeedbackTone,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';

const GALLERY_FEEDBACK_AUTO_HIDE_MS = 4200;

export default function useMoleculeGalleryFeedback() {
  const [galleryFeedback, setGalleryFeedback] = useState<GalleryFeedback | null>(null);
  const galleryFeedbackTimeoutRef = useRef<number | null>(null);

  const clearGalleryFeedbackTimeout = useCallback(() => {
    if (galleryFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(galleryFeedbackTimeoutRef.current);
      galleryFeedbackTimeoutRef.current = null;
    }
  }, []);

  const showGalleryFeedback = useCallback(
    (
      tone: GalleryFeedbackTone,
      message: string,
      options?: {
        persist?: boolean;
      },
    ) => {
      clearGalleryFeedbackTimeout();
      setGalleryFeedback({ tone, message });

      if (options?.persist === true) {
        return;
      }

      galleryFeedbackTimeoutRef.current = window.setTimeout(() => {
        setGalleryFeedback((current) => (current?.message === message ? null : current));
        galleryFeedbackTimeoutRef.current = null;
      }, GALLERY_FEEDBACK_AUTO_HIDE_MS);
    },
    [clearGalleryFeedbackTimeout],
  );

  useEffect(() => {
    return () => {
      clearGalleryFeedbackTimeout();
    };
  }, [clearGalleryFeedbackTimeout]);

  return {
    galleryFeedback,
    showGalleryFeedback,
  };
}
