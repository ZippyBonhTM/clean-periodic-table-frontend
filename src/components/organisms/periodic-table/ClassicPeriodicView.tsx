'use client';

import { memo, useRef, type CSSProperties } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import type { ChemicalElement } from '@/shared/types/element';

import ClassicPeriodicControls from './ClassicPeriodicControls';
import useClassicPeriodicScrollFade from './useClassicPeriodicScrollFade';

type ClassicPeriodicViewProps = {
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
  zoomPercent: number;
  onZoomChange: (nextZoomPercent: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

function ClassicPeriodicView({
  elements,
  onElementOpen,
  zoomPercent,
  onZoomChange,
  isFullscreen,
  onToggleFullscreen,
}: ClassicPeriodicViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);

  useClassicPeriodicScrollFade({
    scrollRef,
    fadeRef,
    dependencyKey: elements.length + zoomPercent,
  });

  const zoomScale = zoomPercent / 100;

  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-4">
      <div ref={fadeRef} className="scroll-fade-x relative">
        <ClassicPeriodicControls
          zoomPercent={zoomPercent}
          isFullscreen={isFullscreen}
          onZoomChange={onZoomChange}
          onToggleFullscreen={onToggleFullscreen}
        />

        <div ref={scrollRef} className="classic-scroll overflow-x-auto pb-2 pt-14">
          <div
            className="classic-scroll-safe mx-auto grid w-max [--classic-size:calc(92px*var(--classic-scale))] lg:[--classic-size:calc(var(--classic-size-desktop)*var(--classic-scale))]"
            style={
              {
                '--classic-scale': zoomScale.toString(),
                '--classic-floor-scale': Math.min(1, zoomScale).toString(),
                gridTemplateColumns: 'repeat(18, var(--classic-size))',
                gridTemplateRows: 'repeat(10, var(--classic-size))',
                gap: 'clamp(2px, calc(var(--classic-size) * 0.095), 10px)',
              } as CSSProperties
            }
          >
            {elements.map((element) => (
              <div
                key={element.symbol}
                style={{
                  gridColumn: element.xpos,
                  gridRow: element.ypos,
                }}
                className="tile-enter"
              >
                <ElementTile element={element} density="compact" mode="classic" onOpen={onElementOpen} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(ClassicPeriodicView);
