'use client';

import type { ComponentProps, RefObject } from 'react';

import MoleculeComponentFocusRail from '@/components/molecules/chemistry/MoleculeComponentFocusRail';
import MoleculeEditorCanvasPanel from '@/components/organisms/molecular-editor/MoleculeEditorCanvasPanel';
import MoleculeEditorTopBar from '@/components/organisms/molecular-editor/MoleculeEditorTopBar';

type MoleculeEditorSectionProps = {
  topControlsBlockClassName: string;
  topControlsRef: RefObject<HTMLDivElement | null>;
  topBarProps: ComponentProps<typeof MoleculeEditorTopBar>;
  showComponentFocusRail: boolean;
  componentFocusRailProps: ComponentProps<typeof MoleculeComponentFocusRail>;
  canvasPanelProps: ComponentProps<typeof MoleculeEditorCanvasPanel>;
};

export default function MoleculeEditorSection({
  topControlsBlockClassName,
  topControlsRef,
  topBarProps,
  showComponentFocusRail,
  componentFocusRailProps,
  canvasPanelProps,
}: MoleculeEditorSectionProps) {
  return (
    <>
      <div ref={topControlsRef} className={topControlsBlockClassName}>
        <MoleculeEditorTopBar {...topBarProps} />

        {showComponentFocusRail ? <MoleculeComponentFocusRail {...componentFocusRailProps} /> : null}
      </div>

      <MoleculeEditorCanvasPanel {...canvasPanelProps} />
    </>
  );
}
