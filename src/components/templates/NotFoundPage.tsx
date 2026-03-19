'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import NoTranslateText from '@/components/atoms/NoTranslateText';
import ElementTile from '@/components/molecules/ElementTile';
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

type StaticElementSignalProps = {
  element: ChemicalElement;
  className: string;
  delay: string;
  duration: string;
  distance: string;
  particlePosition: {
    x: string;
    y: string;
  };
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
        url: '',
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
        url: '',
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
        url: '',
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

function StaticElementSignal({
  element,
  className,
  delay,
  duration,
  distance,
  particlePosition,
}: StaticElementSignalProps) {
  const style = {
    ['--not-found-signal-delay' as string]: delay,
    ['--not-found-signal-duration' as string]: duration,
    ['--not-found-signal-travel' as string]: distance,
    ['--not-found-particle-pos-x' as string]: particlePosition.x,
    ['--not-found-particle-pos-y' as string]: particlePosition.y,
  } satisfies CSSProperties;

  return (
    <div className={`not-found-signal ${className}`} style={style}>
      <span className="not-found-signal__particle" />
      <span className="not-found-signal__line" />
      <div className="not-found-signal__card">
        <div className="not-found-signal__card-shell">
          <ElementTile element={element} density="regular" />
        </div>
      </div>
    </div>
  );
}

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const text = getNotFoundText(locale);
  const sceneElements = buildSceneElements(locale);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <Image
        src="/assets/404/usina quebrada.png"
        alt=""
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,10,0.34),rgba(4,6,10,0.5)_34%,rgba(4,6,10,0.78)_100%)]" />

      <div className="not-found-stage__particle-flow" aria-hidden="true">
        <span className="not-found-stage__particle-stream not-found-stage__particle-stream--a" />
        <span className="not-found-stage__particle-stream not-found-stage__particle-stream--b" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <NoTranslateText as="span" className="not-found-stage__ghost-code">
          404
        </NoTranslateText>

        <StaticElementSignal
          element={sceneElements[0]}
          className="right-[8%] top-[14%] md:right-[16%] md:top-[14%]"
          delay="0s"
          duration="6.2s"
          distance="134px"
          particlePosition={{ x: '-84px', y: '-418px' }}
        />
        <StaticElementSignal
          element={sceneElements[1]}
          className="right-[44%] top-[30%] md:right-[38%] md:top-[30%]"
          delay="1.8s"
          duration="7.1s"
          distance="156px"
          particlePosition={{ x: '-395px', y: '-352px' }}
        />
        <StaticElementSignal
          element={sceneElements[2]}
          className="right-[18%] top-[54%] md:right-[22%] md:top-[54%]"
          delay="3.1s"
          duration="6.7s"
          distance="128px"
          particlePosition={{ x: '-973px', y: '-287px' }}
        />
      </div>

      <section className="relative z-10 flex min-h-screen items-end md:items-center">
        <div className="w-full px-[var(--app-inline-padding)] py-8 md:py-10">
          <div className="max-w-[min(540px,92vw)] rounded-[1.75rem] border border-white/10 bg-black/28 px-6 py-6 backdrop-blur-sm md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={buildLocalizedAppPath(locale, '/')}
                className="inline-flex items-center rounded-full border border-white/14 px-3 py-1.5 text-sm font-semibold text-white/76 transition hover:border-white/24 hover:text-white"
              >
                {text.brand}
              </Link>

              <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs font-black tracking-[0.22em] text-white/64">
                {text.eyebrow}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <h1 className="max-w-3xl text-4xl font-black tracking-[-0.08em] text-white md:text-6xl lg:text-7xl">
                {text.title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/76 md:text-lg">
                {text.description}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={buildLocalizedAppPath(locale, '/')}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
              >
                {text.actions.home}
              </Link>
              <Link
                href={buildLocalizedAppPath(locale, '/periodic-table')}
                className="inline-flex items-center justify-center rounded-full border border-white/18 px-5 py-3 text-sm font-bold text-white transition hover:border-white/32 hover:bg-white/8"
              >
                {text.actions.periodicTable}
              </Link>
            </div>

            <p className="mt-8 text-sm font-medium text-white/58">
              {text.stageHint}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
