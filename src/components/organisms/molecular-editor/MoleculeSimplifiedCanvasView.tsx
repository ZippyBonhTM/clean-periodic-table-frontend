'use client';

import type { CSSProperties } from 'react';

import NoTranslateText from '@/components/atoms/NoTranslateText';
import {
  formatMolecularEditorSimplifiedDescription,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

type CompositionRow = {
  symbol: string;
  name: string;
  count: number;
};

type MoleculeSimplifiedCanvasViewProps = {
  compositionRows: CompositionRow[];
  focusedComponentIndex: number;
  formulaDisplayValue: string;
  moleculeComponentsCount: number;
  simplifiedViewStyle: CSSProperties;
};

export default function MoleculeSimplifiedCanvasView({
  compositionRows,
  focusedComponentIndex,
  formulaDisplayValue,
  moleculeComponentsCount,
  simplifiedViewStyle,
}: MoleculeSimplifiedCanvasViewProps) {
  const text = useMolecularEditorText();

  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain" style={simplifiedViewStyle}>
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-start gap-2.5 sm:gap-4 lg:justify-center">
        <div className="rounded-[24px] border border-(--border-subtle) bg-(--surface-overlay-soft) px-3.5 py-4 text-center shadow-sm backdrop-blur-sm sm:px-6 sm:py-7 lg:px-7 lg:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted) sm:text-[11px]">
            {text.simplifiedView.title}
          </p>
          <NoTranslateText
            as="p"
            className="mt-2.5 wrap-break-word text-[clamp(1.5rem,8vw,4.5rem)] font-black leading-[0.96] tracking-[0.03em] text-foreground"
          >
            {formulaDisplayValue}
          </NoTranslateText>
          <p className="mx-auto mt-2.5 max-w-2xl text-[11px] leading-relaxed text-(--text-muted) sm:mt-4 sm:text-sm">
            {formatMolecularEditorSimplifiedDescription(text, focusedComponentIndex, moleculeComponentsCount)}
          </p>
        </div>

        {compositionRows.length > 0 ? (
          <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {compositionRows.map((row) => (
              <div
                key={row.symbol}
                className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3.5 py-3 shadow-sm backdrop-blur-sm"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)">
                  {row.name}
                </dt>
                <dd className="mt-2 flex items-end justify-between gap-3">
                  <NoTranslateText as="span" className="text-xl font-black text-foreground sm:text-2xl">
                    {row.symbol}
                  </NoTranslateText>
                  <span className="text-base font-semibold text-foreground sm:text-lg">{row.count}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="rounded-2xl border border-dashed border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-5 text-center text-sm text-(--text-muted)">
            {text.simplifiedView.empty}
          </div>
        )}
      </div>
    </div>
  );
}
