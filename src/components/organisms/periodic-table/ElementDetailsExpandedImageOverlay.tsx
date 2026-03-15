'use client';

import { NativeElementImage } from './ElementDetailsNativeImage';
import type { ExpandedImageState } from './elementDetails.types';

type ElementDetailsExpandedImageOverlayProps = {
  expandedImage: ExpandedImageState;
  onClose: () => void;
};

export default function ElementDetailsExpandedImageOverlay({
  expandedImage,
  onClose,
}: ElementDetailsExpandedImageOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-3 md:p-6"
      onClick={onClose}
      role="button"
      tabIndex={0}
      aria-label="Close expanded image"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onClose();
        }
      }}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-7xl items-center justify-center rounded-2xl border border-white/20 bg-[var(--surface-2)] p-2 shadow-2xl md:p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-lg border border-white/35 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-white/75"
        >
          Close
        </button>
        <NativeElementImage
          key={`${expandedImage.kind}:${expandedImage.src}`}
          src={expandedImage.src}
          alt={expandedImage.alt}
          loading="eager"
          containerClassName={
            expandedImage.kind === 'bohr'
              ? 'max-h-[84vh] w-[min(92vw,1200px)] rounded-xl'
              : 'max-h-[84vh] w-auto max-w-[92vw] rounded-xl'
          }
          imageClassName="h-full w-full rounded-xl object-contain"
        />
      </div>
    </div>
  );
}
