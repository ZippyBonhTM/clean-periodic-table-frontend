'use client';

import type { ViewerMode } from './elementDetails.types';

type ElementDetailsViewerModeControlsProps = {
  has3D: boolean;
  hasElementImage: boolean;
  viewerMode: ViewerMode;
  onViewerModeChange: (mode: ViewerMode) => void;
};

function ViewerModeButton({
  isActive,
  isDisabled = false,
  label,
  onClick,
}: {
  isActive: boolean;
  isDisabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
        isActive
          ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
      } disabled:cursor-not-allowed disabled:opacity-55`}
    >
      {label}
    </button>
  );
}

export default function ElementDetailsViewerModeControls({
  has3D,
  hasElementImage,
  viewerMode,
  onViewerModeChange,
}: ElementDetailsViewerModeControlsProps) {
  return (
    <div className="flex items-end gap-2 max-[464px]:flex-col max-[464px]:items-stretch">
      <button
        type="button"
        onClick={() => onViewerModeChange('image')}
        disabled={!hasElementImage}
        className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors max-[464px]:order-1 max-[464px]:w-full max-[464px]:text-center ${
          viewerMode === 'image'
            ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
            : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
        } disabled:cursor-not-allowed disabled:opacity-55`}
      >
        Element Image
      </button>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 max-[464px]:order-2 max-[464px]:w-full">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Bohr
        </p>
        <div className="flex flex-wrap gap-2">
          <ViewerModeButton
            isActive={viewerMode === '2d'}
            label="2D"
            onClick={() => onViewerModeChange('2d')}
          />
          <ViewerModeButton
            isActive={viewerMode === '3d'}
            isDisabled={!has3D}
            label="3D"
            onClick={() => onViewerModeChange('3d')}
          />
        </div>
      </div>
    </div>
  );
}
