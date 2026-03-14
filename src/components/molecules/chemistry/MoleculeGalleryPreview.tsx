'use client';

import { memo, useMemo, useRef } from 'react';

import EditorCanvas from '@/components/organisms/molecular-editor/MoleculeEditorCanvas';
import { resolveViewBox } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

type MoleculeGalleryPreviewProps = {
  model: MoleculeModel;
  label: string;
};

const MoleculeGalleryPreview = memo(function MoleculeGalleryPreview({
  model,
  label,
}: MoleculeGalleryPreviewProps) {
  const previewSvgRef = useRef<SVGSVGElement | null>(null);
  const previewViewBox = useMemo(() => {
    const base = resolveViewBox(model);

    return {
      x: base.x - 20,
      y: base.y - 20,
      width: base.width + 40,
      height: base.height + 40,
    };
  }, [model]);

  return (
    <div className="relative h-32 overflow-hidden rounded-[1.35rem] border border-(--border-subtle) bg-(--surface-overlay-soft)">
      <EditorCanvas
        model={model}
        mode="stick"
        viewBox={previewViewBox}
        selectedAtomId={null}
        svgRef={previewSvgRef}
        interactive={false}
        showGrid={false}
        ariaLabel={label}
      />
    </div>
  );
});

export default MoleculeGalleryPreview;
