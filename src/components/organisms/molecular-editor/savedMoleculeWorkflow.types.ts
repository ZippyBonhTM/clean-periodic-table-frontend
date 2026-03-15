'use client';

export type GalleryFeedbackTone = 'info' | 'success' | 'error';

export type ShowGalleryFeedback = (
  tone: GalleryFeedbackTone,
  message: string,
  options?: {
    persist?: boolean;
  },
) => void;
