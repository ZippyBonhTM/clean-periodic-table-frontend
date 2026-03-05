'use client';

import { createElement, memo, useEffect, useMemo, useRef, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import type { ChemicalElement } from '@/shared/types/element';
import { formatAtomicMass, isElementRadioactive } from '@/shared/utils/elementPresentation';

type ViewerMode = '2d' | '3d' | 'image';
type DetailsViewMode = 'cards' | 'table';

type ElementDetailsModalProps = {
  element: ChemicalElement | null;
  isOpen: boolean;
  onClose: () => void;
  hasPreviousElement?: boolean;
  hasNextElement?: boolean;
  onOpenPreviousElement?: () => void;
  onOpenNextElement?: () => void;
};

type ElementMetaRow = {
  label: string;
  value: string;
};

type ExpandedImageState = {
  kind: 'bohr' | 'element';
  src: string;
  alt: string;
};

type ModelViewerConstructor = {
  minimumRenderScale: number;
};

const HIGH_QUALITY_MIN_RENDER_SCALE = 0.95;
const GENERIC_ELEMENT_IMAGE_PATH = '/s/transactinoid.png';

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function hasDisplayText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

function normalizeElementImageUrl(value: unknown): string {
  const normalized = normalizeText(value);

  if (normalized.length === 0) {
    return '';
  }

  if (normalized.toLowerCase().includes(GENERIC_ELEMENT_IMAGE_PATH)) {
    return '';
  }

  return normalized;
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
    { label: 'Summary', value: formatNullableValue(element.summary) },
  ];
}

function buildCardOptimizedRows(rows: ElementMetaRow[]): ElementMetaRow[] {
  const pinnedTopLabels = new Set([
    'Name',
    'Symbol',
    'Atomic Number',
    'Atomic Mass',
    'Category',
    'Phase',
    'Group',
    'Period',
    'Block',
  ]);
  const pinnedBottomLabels = new Set(['Ionization Energies']);

  const pinnedTop: ElementMetaRow[] = [];
  const compactRows: ElementMetaRow[] = [];
  const expansiveRows: ElementMetaRow[] = [];
  const pinnedBottom: ElementMetaRow[] = [];

  for (const row of rows) {
    if (pinnedTopLabels.has(row.label)) {
      pinnedTop.push(row);
      continue;
    }
    if (pinnedBottomLabels.has(row.label)) {
      pinnedBottom.push(row);
      continue;
    }

    const normalizedValue = row.value.trim();
    const visualWeight = Math.max(row.label.length, normalizedValue.length);
    const isExpansive = visualWeight >= 22 || normalizedValue.includes(',') || normalizedValue.includes(';');

    if (isExpansive) {
      expansiveRows.push(row);
      continue;
    }

    compactRows.push(row);
  }

  return [...pinnedTop, ...compactRows, ...expansiveRows, ...pinnedBottom];
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

function ImageUnavailableState({ elementName }: { elementName: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 text-center text-sm text-[var(--text-muted)] md:h-72">
      {`Image of element ${elementName}; Not available.`}
    </div>
  );
}

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

function ElementDetailsModal({
  element,
  isOpen,
  onClose,
  hasPreviousElement = false,
  hasNextElement = false,
  onOpenPreviousElement,
  onOpenNextElement,
}: ElementDetailsModalProps) {
  const [viewerMode, setViewerMode] = useState<ViewerMode>('image');
  const [detailsViewMode, setDetailsViewMode] = useState<DetailsViewMode>('cards');
  const [is3DViewerReady, setIs3DViewerReady] = useState(false);
  const [expandedImage, setExpandedImage] = useState<ExpandedImageState | null>(null);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});
  const wasOpenRef = useRef(false);

  const has3D = hasDisplayText(element?.bohr_model_3d);
  const elementImageUrl = normalizeElementImageUrl(element?.image?.url);
  const hasElementImage = elementImageUrl.length > 0;
  const twoDImageUrl = hasDisplayText(element?.bohr_model_image)
    ? normalizeText(element?.bohr_model_image)
    : elementImageUrl;
  const has2D = twoDImageUrl.length > 0;

  const dataRows = useMemo(() => {
    if (element === null) {
      return [];
    }

    return buildElementRows(element);
  }, [element]);

  const cardRows = useMemo(() => {
    return buildCardOptimizedRows(dataRows);
  }, [dataRows]);

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

    setViewerMode('3d');
  };

  const onClick2D = () => {
    setViewerMode('2d');
  };

  const onClickElementImage = () => {
    if (!hasElementImage) {
      return;
    }

    setViewerMode('image');
  };

  const isImageFailed = (url: string): boolean => {
    return failedImageUrls[url] === true;
  };

  const onImageLoadError = (url: string) => {
    if (url.length === 0) {
      return;
    }

    setFailedImageUrls((previous) => {
      if (previous[url] === true) {
        return previous;
      }

      return {
        ...previous,
        [url]: true,
      };
    });
  };

  const toggleDetailsViewMode = () => {
    setDetailsViewMode((previous) => (previous === 'cards' ? 'table' : 'cards'));
  };

  const openExpandedImage = (
    sourceUrl: string,
    altText: string,
    kind: ExpandedImageState['kind'],
  ) => {
    if (sourceUrl.trim().length === 0) {
      return;
    }

    setExpandedImage({
      kind,
      src: sourceUrl,
      alt: altText,
    });
  };

  const closeExpandedImage = () => {
    setExpandedImage(null);
  };

  useEffect(() => {
    if (!isOpen || viewerMode !== '3d' || !has3D) {
      setIs3DViewerReady(false);
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
  }, [has3D, isOpen, viewerMode]);

  useEffect(() => {
    if (!isOpen || element === null) {
      wasOpenRef.current = false;
      setExpandedImage(null);
      setFailedImageUrls({});
      return;
    }

    // Only initialize viewer mode when opening the modal.
    // Keep details (card/table) mode persistent across opens and navigation.
    if (!wasOpenRef.current) {
      setViewerMode(hasElementImage ? 'image' : '2d');
      wasOpenRef.current = true;
    }
  }, [element, hasElementImage, isOpen]);

  useEffect(() => {
    if (expandedImage === null) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedImage(null);
      }
    };

    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [expandedImage]);

  if (element === null) {
    return null;
  }

  const onClickPrevious = () => {
    if (!hasPreviousElement || onOpenPreviousElement === undefined) {
      return;
    }

    onOpenPreviousElement();
  };

  const onClickNext = () => {
    if (!hasNextElement || onOpenNextElement === undefined) {
      return;
    }

    onOpenNextElement();
  };

  return (
    <>
      <FloatingModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${element.name} (${element.symbol})`}
        panelClassName="max-w-5xl self-start mt-1 sm:mt-3"
        bodyClassName="element-modal-scroll pr-1 pb-1"
        headerActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClickPrevious}
              disabled={!hasPreviousElement}
              aria-label="Previous element"
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              ←
            </button>
            <button
              type="button"
              onClick={onClickNext}
              disabled={!hasNextElement}
              aria-label="Next element"
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              →
            </button>
          </div>
        }
      >
        <div className="space-y-5">
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
                onClick={onClickElementImage}
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
                  Borh
                </p>
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
                    2D
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
                    3D
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3">
          {viewerMode === '2d' ? (
            has2D && !isImageFailed(twoDImageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={twoDImageUrl}
                alt={`2D Bohr model of ${formatNullableValue(element.name)}`}
                className="h-56 w-full cursor-zoom-in rounded-xl object-contain transition-transform hover:scale-[1.01] md:h-72"
                loading="lazy"
                onClick={() => {
                  openExpandedImage(
                    twoDImageUrl,
                    `2D Bohr model of ${formatNullableValue(element.name)}`,
                    'bohr',
                  );
                }}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  onImageLoadError(twoDImageUrl);
                }}
              />
            ) : (
              <ImageUnavailableState elementName={formatNullableValue(element.name)} />
            )
          ) : viewerMode === 'image' ? (
            hasElementImage && !isImageFailed(elementImageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={elementImageUrl}
                alt={`Image of ${formatNullableValue(element.name)}`}
                className="h-56 w-full cursor-zoom-in rounded-xl object-contain transition-transform hover:scale-[1.01] md:h-72"
                loading="lazy"
                onClick={() => {
                  openExpandedImage(
                    elementImageUrl,
                    `Image of ${formatNullableValue(element.name)}`,
                    'element',
                  );
                }}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  onImageLoadError(elementImageUrl);
                }}
              />
            ) : (
              <ImageUnavailableState elementName={formatNullableValue(element.name)} />
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
            <div className="element-data-cards-grid grid gap-2">
              {cardRows.map((row) => (
                <article key={row.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                  <p className="element-data-card__label uppercase tracking-[0.12em] text-[var(--text-muted)]">{row.label}</p>
                  <p className="element-data-card__value mt-1 break-words text-[var(--text-strong)]">{row.value}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--surface-2)]">
                    <th className="element-data-table__head px-2 py-2 font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] min-[420px]:px-3">
                      Field
                    </th>
                    <th className="element-data-table__head px-2 py-2 font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] min-[420px]:px-3">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index % 2 === 0 ? 'bg-[var(--surface-2)]/60' : 'bg-transparent'}
                    >
                      <td className="element-data-table__field whitespace-nowrap px-2 py-2 align-top font-semibold text-[var(--text-muted)] min-[420px]:px-3">
                        {row.label}
                      </td>
                      <td className="element-data-table__value px-2 py-2 text-[var(--text-strong)] min-[420px]:px-3">{row.value}</td>
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
            <LinkButton href={elementImageUrl} label="Open Element Image" />
            <LinkButton href={element.bohr_model_image} label="Open Bohr 2D" />
            <LinkButton href={element.bohr_model_3d} label="Open Bohr 3D" />
            <LinkButton href={element.spectral_img} label="Open Spectral Image" />
          </div>
        </section>
        </div>
      </FloatingModal>

      {expandedImage !== null ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-3 md:p-6"
          onClick={closeExpandedImage}
          role="button"
          tabIndex={0}
          aria-label="Close expanded image"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              closeExpandedImage();
            }
          }}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-7xl items-center justify-center rounded-2xl border border-white/20 bg-[var(--surface-2)] p-2 shadow-2xl md:p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeExpandedImage}
              className="absolute right-3 top-3 z-20 rounded-lg border border-white/35 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-white/75"
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImage.src}
              alt={expandedImage.alt}
              className={
                expandedImage.kind === 'bohr'
                  ? 'max-h-[84vh] w-[min(92vw,1200px)] rounded-xl object-contain'
                  : 'max-h-[84vh] w-auto max-w-[92vw] rounded-xl object-contain'
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default memo(ElementDetailsModal);
