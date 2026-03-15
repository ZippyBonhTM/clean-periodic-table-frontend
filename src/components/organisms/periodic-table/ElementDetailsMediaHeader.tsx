'use client';

import type { ChemicalElement } from '@/shared/types/element';

import type { ViewerMode } from './elementDetails.types';
import { formatNullableValue } from './elementDetailsUtils';

type ElementDetailsMediaHeaderProps = {
  element: ChemicalElement;
  has3D: boolean;
  hasElementImage: boolean;
  isRadioactive: boolean;
  viewerMode: ViewerMode;
  onViewerModeChange: (mode: ViewerMode) => void;
};

type DetailBadgeTone = 'neutral' | 'radioactive';

function DetailBadge({ label, tone = 'neutral' }: { label: string; tone?: DetailBadgeTone }) {
  if (tone === 'radioactive') {
    return (
      <span className="inline-flex rounded-md border border-rose-400/60 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-rose-300">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--text-strong)]">
      {label}
    </span>
  );
}

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

export default function ElementDetailsMediaHeader({
  element,
  has3D,
  hasElementImage,
  isRadioactive,
  viewerMode,
  onViewerModeChange,
}: ElementDetailsMediaHeaderProps) {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-[344px]:grid-cols-1">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Element Details</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {isRadioactive ? <DetailBadge label="Radioactive" tone="radioactive" /> : null}
          <DetailBadge label={formatNullableValue(element.category)} />
          <DetailBadge label={formatNullableValue(element.phase)} />
        </div>
      </div>

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
    </section>
  );
}
