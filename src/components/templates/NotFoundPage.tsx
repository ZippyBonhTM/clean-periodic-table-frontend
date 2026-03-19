'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import NoTranslateText from '@/components/atoms/NoTranslateText';
import { getNotFoundText } from '@/components/templates/notFoundText';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { ChemicalElement } from '@/shared/types/element';

type NotFoundPageProps = {
  locale: AppLocale;
};

type SceneElementSeed = {
  names: Record<AppLocale, string>;
  element: ChemicalElement;
};

type FallingElementSignalProps = {
  element: ChemicalElement;
  className: string;
  delay: string;
  duration: string;
  distance: string;
};

const sceneElementSeeds: readonly SceneElementSeed[] = [
  {
    names: {
      'pt-BR': 'Enxofre',
      'en-US': 'Sulfur',
    },
    element: {
      appearance: 'lemon yellow sintered microcrystals',
      atomic_mass: 32.06,
      block: 'p',
      bohr_model_3d: null,
      bohr_model_image: null,
      boil: 717.8,
      category: 'polyatomic nonmetal',
      'cpk-hex': 'ffff30',
      density: 2.07,
      discovered_by: 'Ancient china',
      electron_affinity: 200.4101,
      electron_configuration: '1s2 2s2 2p6 3s2 3p4',
      electron_configuration_semantic: '[Ne] 3s2 3p4',
      electronegativity_pauling: 2.58,
      group: 16,
      image: {
        title: 'Sulfur specimen',
        url: '/assets/404/usina quebrada.png',
        attribution: '',
      },
      ionization_energies: [999.6, 2252],
      melt: 388.36,
      molar_heat: 22.75,
      name: 'Sulfur',
      named_by: null,
      number: 16,
      period: 3,
      phase: 'Solid',
      source: '',
      spectral_img: null,
      summary: 'Sulfur sample',
      symbol: 'S',
      wxpos: 30,
      wypos: 3,
      xpos: 16,
      ypos: 3,
      shells: [2, 8, 6],
    },
  },
  {
    names: {
      'pt-BR': 'Urânio',
      'en-US': 'Uranium',
    },
    element: {
      appearance: 'silvery-white metal',
      atomic_mass: 238.02891,
      block: 'f',
      bohr_model_3d: null,
      bohr_model_image: null,
      boil: 4404,
      category: 'actinide',
      'cpk-hex': '008fff',
      density: 19.1,
      discovered_by: 'Martin Heinrich Klaproth',
      electron_affinity: 50.94,
      electron_configuration: '[Rn] 5f3 6d1 7s2',
      electron_configuration_semantic: '[Rn] 5f3 6d1 7s2',
      electronegativity_pauling: 1.38,
      group: 3,
      image: {
        title: 'Uranium specimen',
        url: '/assets/404/usina quebrada.png',
        attribution: '',
      },
      ionization_energies: [597.6, 1420],
      melt: 1405.3,
      molar_heat: 27.665,
      name: 'Uranium',
      named_by: null,
      number: 92,
      period: 7,
      phase: 'Solid',
      source: '',
      spectral_img: null,
      summary: 'Uranium sample',
      symbol: 'U',
      wxpos: 6,
      wypos: 7,
      xpos: 6,
      ypos: 10,
      shells: [2, 8, 18, 32, 21, 9, 2],
    },
  },
  {
    names: {
      'pt-BR': 'Ouro',
      'en-US': 'Gold',
    },
    element: {
      appearance: 'metallic yellow',
      atomic_mass: 196.96657,
      block: 'd',
      bohr_model_3d: null,
      bohr_model_image: null,
      boil: 3243,
      category: 'transition metal',
      'cpk-hex': 'ffd123',
      density: 19.3,
      discovered_by: 'Middle East',
      electron_affinity: 222.747,
      electron_configuration: '[Xe] 4f14 5d10 6s1',
      electron_configuration_semantic: '[Xe] 4f14 5d10 6s1',
      electronegativity_pauling: 2.54,
      group: 11,
      image: {
        title: 'Gold specimen',
        url: '/assets/404/usina quebrada.png',
        attribution: '',
      },
      ionization_energies: [890.1, 1980],
      melt: 1337.33,
      molar_heat: 25.418,
      name: 'Gold',
      named_by: null,
      number: 79,
      period: 6,
      phase: 'Solid',
      source: '',
      spectral_img: null,
      summary: 'Gold sample',
      symbol: 'Au',
      wxpos: 25,
      wypos: 6,
      xpos: 11,
      ypos: 6,
      shells: [2, 8, 18, 32, 18, 1],
    },
  },
] as const;

function buildSceneElements(locale: AppLocale): ChemicalElement[] {
  return sceneElementSeeds.map(({ names, element }) => ({
    ...element,
    name: names[locale],
  }));
}

function FallingElementSignal({
  element,
  className,
  delay,
  duration,
  distance,
}: FallingElementSignalProps) {
  const style = {
    ['--not-found-drop-delay' as string]: delay,
    ['--not-found-drop-duration' as string]: duration,
    ['--not-found-drop-distance' as string]: distance,
  } satisfies CSSProperties;

  return (
    <div className={`not-found-drop ${className}`} style={style}>
      <span className="not-found-drop__particle" />
      <span className="not-found-drop__line" />
      <div className="not-found-drop__card">
        <div className="not-found-drop__card-shell">
          <ElementTile element={element} mode="classic" />
        </div>
      </div>
    </div>
  );
}

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const text = getNotFoundText(locale);
  const sceneElements = buildSceneElements(locale);

  return (
    <main className="min-h-screen px-[var(--app-inline-padding)] py-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[var(--app-max-width)] items-center">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[color:color-mix(in_oklab,var(--surface-1)_92%,transparent)] shadow-[0_28px_90px_rgba(2,8,23,0.26)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(245,158,11,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_60%)]" />

          <div className="relative grid min-h-[720px] gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,520px)]">
            <div className="flex flex-col justify-between px-6 py-7 md:px-10 md:py-10 lg:px-14 lg:py-14">
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={buildLocalizedAppPath(locale, '/')}
                    className="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
                  >
                    {text.brand}
                  </Link>

                  <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-white/6 px-3 py-1.5 text-xs font-black tracking-[0.22em] text-[var(--text-muted)]">
                    {text.eyebrow}
                  </span>
                </div>

                <div className="max-w-2xl space-y-5">
                  <h1 className="max-w-3xl text-4xl font-black tracking-[-0.08em] text-[var(--text-strong)] md:text-6xl lg:text-7xl">
                    {text.title}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-[var(--text-muted)] md:text-lg">
                    {text.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={buildLocalizedAppPath(locale, '/')}
                    className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)]"
                  >
                    {text.actions.home}
                  </Link>
                  <Link
                    href={buildLocalizedAppPath(locale, '/periodic-table')}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border-subtle)] px-5 py-3 text-sm font-bold text-[var(--text-strong)] transition hover:border-[var(--accent)] hover:bg-white/6"
                  >
                    {text.actions.periodicTable}
                  </Link>
                </div>
              </div>

              <p className="mt-10 text-sm font-medium text-[var(--text-muted)]">
                {text.stageHint}
              </p>
            </div>

            <div className="relative border-t border-[var(--border-subtle)] px-5 py-6 lg:border-t-0 lg:border-l lg:px-8 lg:py-8">
              <div className="not-found-stage">
                <Image
                  src="/assets/404/usina quebrada.png"
                  alt=""
                  fill
                  priority
                  className="not-found-stage__plant object-cover"
                />
                <Image
                  src="/assets/404/particulas.png"
                  alt=""
                  fill
                  className="not-found-stage__particles not-found-stage__particles--slow object-cover"
                />
                <Image
                  src="/assets/404/particulas.png"
                  alt=""
                  fill
                  className="not-found-stage__particles not-found-stage__particles--fast object-cover"
                />

                <div className="not-found-stage__veil" />

                <NoTranslateText as="span" className="not-found-stage__ghost-code">
                  404
                </NoTranslateText>

                <FallingElementSignal
                  element={sceneElements[0]}
                  className="left-[4%] top-[8%] md:left-[14%]"
                  delay="0s"
                  duration="9.2s"
                  distance="170px"
                />
                <FallingElementSignal
                  element={sceneElements[1]}
                  className="left-[48%] top-[2%] md:left-[58%]"
                  delay="1.8s"
                  duration="10.8s"
                  distance="210px"
                />
                <FallingElementSignal
                  element={sceneElements[2]}
                  className="left-[18%] top-[18%] md:left-[34%]"
                  delay="3.2s"
                  duration="8.8s"
                  distance="155px"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
