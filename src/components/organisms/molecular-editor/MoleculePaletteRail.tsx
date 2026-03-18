'use client';

import type { PointerEventHandler, Ref } from 'react';

import MoleculePaletteRailNavigation from '@/components/organisms/molecular-editor/MoleculePaletteRailNavigation';
import MoleculePaletteTile from '@/components/organisms/molecular-editor/MoleculePaletteTile';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type { ChemicalElement } from '@/shared/types/element';

type MoleculePaletteRailProps = {
  overlayRef: Ref<HTMLDivElement>;
  overlayClassName: string;
  viewportRef: Ref<HTMLDivElement>;
  elements: ChemicalElement[];
  paletteEdgePadding: number;
  isCompact: boolean;
  isPaletteMoving: boolean;
  isPalettePointerActive: boolean;
  resolvedExpandedPaletteIndex: number;
  resolvedCenterPaletteIndex: number;
  wrapperClassName: string;
  rowClassName: string;
  onPaletteScroll: () => void;
  onPalettePointerDown: PointerEventHandler<HTMLDivElement>;
  onPalettePointerMove: PointerEventHandler<HTMLDivElement>;
  onPalettePointerUp: PointerEventHandler<HTMLDivElement>;
  onPalettePointerCancel: PointerEventHandler<HTMLDivElement>;
  onPrevious: () => void;
  onNext: () => void;
  onItemRef: (index: number, node: HTMLButtonElement | null) => void;
};

export default function MoleculePaletteRail({
  overlayRef,
  overlayClassName,
  viewportRef,
  elements,
  paletteEdgePadding,
  isCompact,
  isPaletteMoving,
  isPalettePointerActive,
  resolvedExpandedPaletteIndex,
  resolvedCenterPaletteIndex,
  wrapperClassName,
  rowClassName,
  onPaletteScroll,
  onPalettePointerDown,
  onPalettePointerMove,
  onPalettePointerUp,
  onPalettePointerCancel,
  onPrevious,
  onNext,
  onItemRef,
}: MoleculePaletteRailProps) {
  const text = useMolecularEditorText();

  return (
    <div ref={overlayRef} className={overlayClassName}>
      <div className={wrapperClassName}>
        <div
          ref={viewportRef}
          className="flex min-w-0 cursor-grab snap-x snap-mandatory items-center overflow-x-auto overflow-y-visible active:cursor-grabbing"
          style={{
            touchAction: 'none',
            scrollbarWidth: 'none',
            overscrollBehaviorX: 'contain',
            scrollSnapType: isPaletteMoving ? 'none' : 'x proximity',
            WebkitOverflowScrolling: 'touch',
            scrollPaddingInline: `${paletteEdgePadding}px`,
          }}
          onScroll={onPaletteScroll}
          onPointerDown={onPalettePointerDown}
          onPointerMove={onPalettePointerMove}
          onPointerUp={onPalettePointerUp}
          onPointerCancel={onPalettePointerCancel}
        >
          <div className={rowClassName}>
            <div aria-hidden="true" className="shrink-0" style={{ width: `${paletteEdgePadding}px` }} />
            {elements.map((element, index) => (
              <div key={`${element.number}-${element.symbol}`} className="relative flex snap-center snap-always">
                <MoleculePaletteTile
                  buttonRef={(node) => {
                    onItemRef(index, node);
                  }}
                  element={element}
                  paletteIndex={index}
                  isCompact={isCompact}
                  isSelected={!isPaletteMoving && !isPalettePointerActive && index === resolvedExpandedPaletteIndex}
                  isCentered={index === resolvedCenterPaletteIndex}
                />
              </div>
            ))}
            <div aria-hidden="true" className="shrink-0" style={{ width: `${paletteEdgePadding}px` }} />
          </div>
        </div>

        <MoleculePaletteRailNavigation
          direction="left"
          disabled={elements.length === 0}
          isCompact={isCompact}
          label={text.palette.previousElement}
          onClick={onPrevious}
          side="left"
        />

        <MoleculePaletteRailNavigation
          direction="right"
          disabled={elements.length === 0}
          isCompact={isCompact}
          label={text.palette.nextElement}
          onClick={onNext}
          side="right"
        />
      </div>
    </div>
  );
}
