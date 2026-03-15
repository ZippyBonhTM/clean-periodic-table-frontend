'use client';

import type { RefObject } from 'react';

type MoleculeEditorBottomNoticeProps = {
  bottomNoticeRef: RefObject<HTMLDivElement | null>;
  compactBottomNoticeClassName: string;
  compactBottomOverlayClassName: string;
  compactDisplayedEditorNotice: string | null;
  isSimplifiedView: boolean;
  resolvedEditorNotice: string | null;
};

export default function MoleculeEditorBottomNotice({
  bottomNoticeRef,
  compactBottomNoticeClassName,
  compactBottomOverlayClassName,
  compactDisplayedEditorNotice,
  isSimplifiedView,
  resolvedEditorNotice,
}: MoleculeEditorBottomNoticeProps) {
  if (isSimplifiedView || resolvedEditorNotice === null) {
    return null;
  }

  return (
    <div className={compactBottomOverlayClassName}>
      <div ref={bottomNoticeRef} className={compactBottomNoticeClassName} title={resolvedEditorNotice}>
        {compactDisplayedEditorNotice}
      </div>
    </div>
  );
}
