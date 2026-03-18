'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import LinkButton from '@/components/atoms/LinkButton';
import NoTranslateText from '@/components/atoms/NoTranslateText';
import ElementTile from '@/components/molecules/ElementTile';
import {
  formatElementCategoryLabel,
  formatElementPhaseLabel,
} from '@/components/organisms/periodic-table/periodicTableText';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import { HOME_HERO_ELEMENTS, type HomeHeroElement } from './homeHeroElements';

type HomeHeroElementClusterProps = {
  locale: AppLocale;
  idleLabel: string;
  openTableLabel: string;
};

const HOME_HERO_SLOT_COUNT = 3;
const HOME_HERO_ROTATION_MS = 5600;

const slotClassNames = [
  'absolute left-0 top-0 w-[8.25rem] rotate-[-6deg] md:w-[9.5rem]',
  'absolute right-0 top-6 w-[8.25rem] rotate-[7deg] md:w-[9.5rem]',
  'absolute bottom-2 left-[20%] w-[8.75rem] rotate-[-2deg] md:w-[10rem]',
] as const;

function pickRandomElements(count: number): HomeHeroElement[] {
  const shuffled = [...HOME_HERO_ELEMENTS];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
}

function pickReplacementElement(current: HomeHeroElement[]): HomeHeroElement {
  const excludedNumbers = new Set(current.map((element) => element.number));
  const candidates = HOME_HERO_ELEMENTS.filter((element) => !excludedNumbers.has(element.number));

  if (candidates.length === 0) {
    return HOME_HERO_ELEMENTS[0];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function formatHeroAtomicMass(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 100 ? 1 : 3,
  }).format(value);
}

export default function HomeHeroElementCluster({
  locale,
  idleLabel,
  openTableLabel,
}: HomeHeroElementClusterProps) {
  const text = usePeriodicTableText();
  const [activeElements, setActiveElements] = useState<HomeHeroElement[]>(() =>
    HOME_HERO_ELEMENTS.slice(0, HOME_HERO_SLOT_COUNT),
  );
  const [selectedElement, setSelectedElement] = useState<HomeHeroElement | null>(null);
  const [animatingSlotIndex, setAnimatingSlotIndex] = useState<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const periodicTableHref = useMemo(() => buildLocalizedAppPath(locale, '/periodic-table'), [locale]);
  const selectedSlotIndex = selectedElement === null
    ? -1
    : activeElements.findIndex((element) => element.number === selectedElement.number);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setActiveElements(pickRandomElements(HOME_HERO_SLOT_COUNT));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const clearRegisteredTimeouts = () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };

    const intervalId = window.setInterval(() => {
      const slotIndex = Math.floor(Math.random() * HOME_HERO_SLOT_COUNT);

      setAnimatingSlotIndex(slotIndex);

      const replaceTimeoutId = window.setTimeout(() => {
        setActiveElements((currentElements) => {
          const nextElements = [...currentElements];
          const replacementElement = pickReplacementElement(currentElements);
          const replacedElement = nextElements[slotIndex];

          nextElements[slotIndex] = replacementElement;

          setSelectedElement((currentSelectedElement) => {
            if (currentSelectedElement === null) {
              return null;
            }

            if (currentSelectedElement.number === replacedElement.number) {
              return null;
            }

            return currentSelectedElement;
          });

          return nextElements;
        });
      }, 180);

      const clearAnimationTimeoutId = window.setTimeout(() => {
        setAnimatingSlotIndex((currentIndex) => (currentIndex === slotIndex ? null : currentIndex));
      }, 620);

      timeoutIdsRef.current.push(replaceTimeoutId, clearAnimationTimeoutId);
    }, HOME_HERO_ROTATION_MS);

    return () => {
      window.clearInterval(intervalId);
      clearRegisteredTimeouts();
    };
  }, []);

  return (
    <div className="relative rounded-[2.2rem] border border-white/10 bg-black/16 p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.95)] backdrop-blur-sm md:p-5">
      <div className="relative h-[18.75rem] overflow-visible md:h-[20rem]">
        {activeElements.map((element, index) => {
          const isAnimating = animatingSlotIndex === index;
          const isSelected = selectedElement?.number === element.number;

          return (
            <div
              key={`${String(element.number)}-${String(index)}`}
              className={`${slotClassNames[index]} transition-all duration-500 ${
                isAnimating ? 'translate-y-4 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'
              } ${isSelected ? 'z-20' : 'z-10'}`}
            >
              <div className={`transition-transform duration-300 ${isSelected ? 'scale-[1.03]' : 'scale-100'}`}>
                <ElementTile
                  element={element}
                  density="regular"
                  onOpen={() => {
                    setSelectedElement((currentSelectedElement) => {
                      if (currentSelectedElement?.number === element.number) {
                        return null;
                      }

                      return element;
                    });
                  }}
                />
              </div>
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex items-center justify-between gap-3 px-1">
          <p className="text-xs font-medium text-(--text-muted)">{idleLabel}</p>
          <LinkButton
            href={periodicTableHref}
            variant="ghost"
            size="md"
            className="pointer-events-auto rounded-full px-4"
          >
            {openTableLabel}
          </LinkButton>
        </div>

        {selectedElement !== null && selectedSlotIndex >= 0 ? (
          <div
            className={`absolute z-30 w-[14.5rem] overflow-hidden rounded-[1.45rem] border border-white/12 bg-[linear-gradient(160deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,1)] backdrop-blur-md transition-all duration-300 ${
              selectedSlotIndex === 0
                ? 'left-[5.75rem] top-3 md:left-[7rem] md:top-2'
                : selectedSlotIndex === 1
                  ? 'right-[5.75rem] top-12 md:right-[7rem] md:top-12'
                  : 'left-4 top-[9.25rem] md:left-6 md:top-[10.75rem]'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <NoTranslateText as="p" className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">
                    {selectedElement.symbol}
                  </NoTranslateText>
                  <h3 className="text-2xl font-black text-(--text-strong)">{selectedElement.name}</h3>
                </div>
                <span className="rounded-full border border-white/12 bg-black/20 px-2.5 py-1 text-xs font-semibold text-(--text-muted)">
                  #{selectedElement.number}
                </span>
              </div>

              <p className="text-sm leading-7 text-(--text-muted)">{selectedElement.teaser[locale]}</p>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.details.fields.atomicMass}
                  </p>
                  <p className="font-semibold text-(--text-strong)">
                    {formatHeroAtomicMass(selectedElement.atomic_mass, locale)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.details.fields.phase}
                  </p>
                  <p className="font-semibold text-(--text-strong)">
                    {formatElementPhaseLabel(text, selectedElement.phase, text.common.notAvailableShort)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                    {text.details.fields.category}
                  </p>
                  <p className="font-semibold text-(--text-strong)">
                    {formatElementCategoryLabel(text, selectedElement.category, text.common.notAvailableShort)}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <LinkButton href={periodicTableHref} variant="ghost" size="md" className="rounded-full px-4">
                  {openTableLabel}
                </LinkButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
