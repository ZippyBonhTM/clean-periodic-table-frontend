'use client';

import type { GalleryFeedback } from '@/components/organisms/molecular-editor/moleculeEditorSession';

type MoleculeEditorFeedbackToastProps = {
  feedback: GalleryFeedback | null;
  pageMode: 'editor' | 'gallery';
};

export default function MoleculeEditorFeedbackToast({
  feedback,
  pageMode,
}: MoleculeEditorFeedbackToastProps) {
  if (feedback === null) {
    return null;
  }

  const label =
    feedback.tone === 'error'
      ? 'Sync issue'
      : feedback.tone === 'success'
        ? pageMode === 'editor'
          ? 'Work saved'
          : 'Gallery ready'
        : pageMode === 'editor'
          ? 'Saving'
          : 'Gallery';

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] w-[min(22rem,calc(100vw-2rem))]">
      <div
        role={feedback.tone === 'error' ? 'alert' : 'status'}
        aria-live={feedback.tone === 'error' ? 'assertive' : 'polite'}
        className={`rounded-[1.4rem] border px-4 py-3 shadow-xl backdrop-blur-xl ${
          feedback.tone === 'error'
            ? 'border-rose-400/40 bg-[#3a0f19]/92 text-rose-50'
            : feedback.tone === 'success'
              ? 'border-emerald-400/35 bg-[#08281d]/92 text-emerald-50'
              : 'border-(--border-subtle) bg-[#0f1726]/90 text-white'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
        <p className="mt-1 text-sm leading-relaxed">{feedback.message}</p>
      </div>
    </div>
  );
}
