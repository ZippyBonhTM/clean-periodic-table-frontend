'use client';

import { useState } from 'react';

type NativeElementImageProps = {
  src: string;
  alt: string;
  containerClassName: string;
  imageClassName: string;
  loading?: 'eager' | 'lazy';
  onClick?: () => void;
  onError?: (src: string) => void;
};

function ImageUnavailableState({ elementName }: { elementName: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 text-center text-sm text-[var(--text-muted)] md:h-72">
      {`Image of element ${elementName}; Not available.`}
    </div>
  );
}

function NativeElementImage({
  src,
  alt,
  containerClassName,
  imageClassName,
  loading = 'lazy',
  onClick,
  onError,
}: NativeElementImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);

  if (hasErrored) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden bg-[var(--surface-2)] ${containerClassName}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.12),transparent_52%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.72))] transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 animate-pulse bg-white/4 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={`${imageClassName} transition-[opacity,filter,transform] duration-300 ${
          onClick !== undefined ? 'cursor-zoom-in hover:scale-[1.01]' : ''
        } ${isLoaded ? 'scale-100 blur-0 opacity-100' : 'scale-[1.01] blur-[6px] opacity-70'}`}
        onLoad={() => {
          setIsLoaded(true);
        }}
        onClick={onClick}
        onError={() => {
          setHasErrored(true);
          onError?.(src);
        }}
      />
    </div>
  );
}

export { ImageUnavailableState, NativeElementImage };
