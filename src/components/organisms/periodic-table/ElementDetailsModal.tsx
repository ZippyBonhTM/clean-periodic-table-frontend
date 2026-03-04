'use client';

import { createElement, memo, useEffect, useMemo, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import useConnectionQuality from '@/shared/hooks/useConnectionQuality';
import type { ChemicalElement } from '@/shared/types/element';
import { formatAtomicMass, isElementRadioactive } from '@/shared/utils/elementPresentation';

type ViewerMode = '2d' | '3d';
type DetailsViewMode = 'cards' | 'table';

type ElementDetailsModalProps = {
  element: ChemicalElement | null;
  isOpen: boolean;
  onClose: () => void;
};

type ElementMetaRow = {
  label: string;
  value: string;
};

type ModelViewerConstructor = {
  minimumRenderScale: number;
};

const HIGH_QUALITY_MIN_RENDER_SCALE = 0.95;

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function hasDisplayText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

function formatNullableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not informed';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return 'Not informed';
    }

    return trimmedValue;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return 'Not informed';
  }

  return String(value);
}

function buildElementRows(element: ChemicalElement): ElementMetaRow[] {
  const ionizationEnergies = Array.isArray(element.ionization_energies)
    ? element.ionization_energies
    : [];
  const shells = Array.isArray(element.shells) ? element.shells : [];

  return [
    { label: 'Name', value: formatNullableValue(element.name) },
    { label: 'Symbol', value: formatNullableValue(element.symbol) },
    { label: 'Atomic Number', value: String(element.number) },
    { label: 'Atomic Mass', value: formatAtomicMass(element.atomic_mass) },
    { label: 'Category', value: formatNullableValue(element.category) },
    { label: 'Phase', value: formatNullableValue(element.phase) },
    { label: 'Group', value: String(element.group) },
    { label: 'Period', value: String(element.period) },
    { label: 'Block', value: formatNullableValue(element.block) },
    { label: 'Appearance', value: formatNullableValue(element.appearance) },
    { label: 'Density', value: formatNullableValue(element.density) },
    { label: 'Boiling Point', value: formatNullableValue(element.boil) },
    { label: 'Melting Point', value: formatNullableValue(element.melt) },
    { label: 'Molar Heat', value: formatNullableValue(element.molar_heat) },
    { label: 'Electron Affinity', value: formatNullableValue(element.electron_affinity) },
    {
      label: 'Electronegativity (Pauling)',
      value: formatNullableValue(element.electronegativity_pauling),
    },
    { label: 'Electron Configuration', value: formatNullableValue(element.electron_configuration) },
    {
      label: 'Electron Config (Semantic)',
      value: formatNullableValue(element.electron_configuration_semantic),
    },
    {
      label: 'Ionization Energies',
      value: ionizationEnergies.length === 0 ? 'Not informed' : ionizationEnergies.join(', '),
    },
    { label: 'Shells', value: shells.length === 0 ? 'Not informed' : shells.join(', ') },
    { label: 'Discovered By', value: formatNullableValue(element.discovered_by) },
    { label: 'Named By', value: formatNullableValue(element.named_by) },
    { label: 'CPK Hex', value: formatNullableValue(element['cpk-hex']) },
    { label: 'Table Position X', value: String(element.xpos) },
    { label: 'Table Position Y', value: String(element.ypos) },
    { label: 'Wide Position X', value: String(element.wxpos) },
    { label: 'Wide Position Y', value: String(element.wypos) },
    { label: 'Image Title', value: formatNullableValue(element.image?.title) },
    { label: 'Image Attribution', value: formatNullableValue(element.image?.attribution) },
    { label: 'Source Link', value: hasDisplayText(element.source) ? 'Available below' : 'Not informed' },
    {
      label: 'Bohr 2D Link',
      value: hasDisplayText(element.bohr_model_image) ? 'Available below' : 'Not informed',
    },
    {
      label: 'Bohr 3D Link',
      value: hasDisplayText(element.bohr_model_3d) ? 'Available below' : 'Not informed',
    },
    {
      label: 'Spectral Image Link',
      value: hasDisplayText(element.spectral_img) ? 'Available below' : 'Not informed',
    },
    { label: 'Image URL', value: hasDisplayText(element.image?.url) ? 'Available below' : 'Not informed' },
    { label: 'Summary', value: formatNullableValue(element.summary) },
  ];
}

function LinkButton({ href, label }: { href: string | null | undefined; label: string }) {
  const normalizedHref = normalizeText(href);

  if (normalizedHref.length === 0) {
    return (
      <span className="text-xs font-semibold text-[var(--text-muted)]">
        {label}: unavailable
      </span>
    );
  }

  return (
    <a
      href={normalizedHref}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold text-orange-400 underline decoration-2 underline-offset-2 transition-colors hover:text-orange-300"
    >
      {label}
    </a>
  );
}

function ElementDetailsModal({ element, isOpen, onClose }: ElementDetailsModalProps) {
  const connectionQuality = useConnectionQuality();
  const [viewerMode, setViewerMode] = useState<ViewerMode>('2d');
  const [detailsViewMode, setDetailsViewMode] = useState<DetailsViewMode>('cards');
  const [is3DViewerReady, setIs3DViewerReady] = useState(false);

  const has3D = hasDisplayText(element?.bohr_model_3d);
  const twoDImageUrl = hasDisplayText(element?.bohr_model_image)
    ? normalizeText(element?.bohr_model_image)
    : normalizeText(element?.image?.url);
  const has2D = twoDImageUrl.length > 0;

  useEffect(() => {
    if (!isOpen || element === null) {
      return;
    }

    if (connectionQuality === 'wifi' && has3D) {
      setViewerMode('3d');
      return;
    }

    setViewerMode('2d');
  }, [connectionQuality, element, has3D, isOpen]);

  const dataRows = useMemo(() => {
    if (element === null) {
      return [];
    }

    return buildElementRows(element);
  }, [element]);

  const isRadioactive = useMemo(() => {
    if (element === null) {
      return false;
    }

    return isElementRadioactive(element);
  }, [element]);

  const onClick3D = () => {
    if (element === null || !has3D) {
      return;
    }

    if (connectionQuality === 'limited') {
      window.alert('3D visualization can be heavy on limited internet.');
    }

    setViewerMode('3d');
  };

  const onClick2D = () => {
    setViewerMode('2d');
  };

  const toggleDetailsViewMode = () => {
    setDetailsViewMode((previous) => (previous === 'cards' ? 'table' : 'cards'));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    import('@google/model-viewer')
      .then(() => {
        const modelViewerElement = customElements.get('model-viewer') as ModelViewerConstructor | undefined;

        // Keep a high baseline render scale so animation does not blur aggressively.
        if (modelViewerElement !== undefined) {
          modelViewerElement.minimumRenderScale = HIGH_QUALITY_MIN_RENDER_SCALE;
        }

        if (isMounted) {
          setIs3DViewerReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIs3DViewerReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || element === null) {
      return;
    }

    setDetailsViewMode('cards');
  }, [element, isOpen]);

  if (element === null) {
    return null;
  }

  return (
    <FloatingModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${element.name} (${element.symbol})`}
      panelClassName="max-w-5xl"
      bodyClassName="element-modal-scroll max-h-[75vh] overflow-y-auto scroll-smooth pr-1"
    >
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Element Details</p>
            <p className="text-sm text-[var(--text-muted)]">
              Connection mode:{' '}
              <span className="font-semibold text-[var(--text-strong)]">
                {connectionQuality === 'wifi'
                  ? 'Wi-Fi / high bandwidth'
                  : connectionQuality === 'limited'
                    ? 'Limited internet'
                    : 'Unknown'}
              </span>
            </p>
            {isRadioactive ? (
              <p className="mt-1 inline-flex rounded-md border border-rose-400/60 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-rose-300">
                Radioactive
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClick2D}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                viewerMode === '2d'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
              }`}
            >
              2D (Limited Internet)
            </button>

            <button
              type="button"
              onClick={onClick3D}
              disabled={!has3D}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                viewerMode === '3d'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
              } disabled:cursor-not-allowed disabled:opacity-55`}
            >
              3D (Wi-Fi)
            </button>
          </div>
        </section>

        <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3">
          {viewerMode === '2d' ? (
            has2D ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={twoDImageUrl}
                alt={`2D Bohr model of ${formatNullableValue(element.name)}`}
                className="h-56 w-full rounded-xl object-contain md:h-72"
                loading="lazy"
              />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-muted)] md:h-72">
                2D preview is unavailable for this element.
              </div>
            )
          ) : has3D ? (
            <div className="space-y-3">
              <div className="h-56 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] md:h-72">
                {is3DViewerReady ? (
                  createElement('model-viewer', {
                    src: normalizeText(element.bohr_model_3d) || undefined,
                    poster: normalizeText(element.bohr_model_image) || undefined,
                    alt: `3D model of ${formatNullableValue(element.name)}`,
                    'camera-controls': 'true',
                    autoplay: 'true',
                    'interaction-prompt': 'auto',
                    'shadow-intensity': '0.55',
                    exposure: '0.95',
                    className: 'h-full w-full',
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                    Loading lightweight 3D viewer...
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <LinkButton href={element.bohr_model_3d} label="Open 3D File in New Tab" />
                <span className="text-xs text-[var(--text-muted)]">
                  Powered by Google model-viewer for lightweight rendering.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-muted)] md:h-72">
              3D model is unavailable for this element.
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Element Data</p>
            <button
              type="button"
              onClick={toggleDetailsViewMode}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
            >
              {detailsViewMode === 'cards' ? 'Table View' : 'Card View'}
            </button>
          </div>

          {detailsViewMode === 'cards' ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dataRows.map((row) => (
                <article key={row.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{row.label}</p>
                  <p className="mt-1 break-words text-sm text-[var(--text-strong)]">{row.value}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--surface-2)]">
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Field
                    </th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index % 2 === 0 ? 'bg-[color-mix(in_srgb,var(--surface-2)_65%,transparent)]' : 'bg-transparent'}
                    >
                      <td className="whitespace-nowrap px-3 py-2 align-top text-xs font-semibold text-[var(--text-muted)]">
                        {row.label}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-strong)]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">External Links</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={element.source} label="Open Official Source" />
            <LinkButton href={element.image?.url} label="Open Element Image" />
            <LinkButton href={element.bohr_model_image} label="Open Bohr 2D" />
            <LinkButton href={element.bohr_model_3d} label="Open Bohr 3D" />
            <LinkButton href={element.spectral_img} label="Open Spectral Image" />
          </div>
        </section>
      </div>
    </FloatingModal>
  );
}

export default memo(ElementDetailsModal);
