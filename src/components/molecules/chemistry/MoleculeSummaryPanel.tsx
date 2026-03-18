'use client';

import { memo } from 'react';
import type { CSSProperties } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

type MoleculeSummaryRow = {
  label: string;
  compactLabel: string;
  value: string;
  compactValue?: string;
  title?: string;
};

type MoleculeSummaryPanelProps = {
  isCompact: boolean;
  isOpen: boolean;
  rows: MoleculeSummaryRow[];
  style: CSSProperties;
  onToggle: () => void;
};

const MoleculeSummaryPanel = memo(function MoleculeSummaryPanel({
  isCompact,
  isOpen,
  rows,
  style,
  onToggle,
}: MoleculeSummaryPanelProps) {
  const text = useMolecularEditorText();
  const heightClassName =
    rows.length > 5 ? (isCompact ? 'h-[84px]' : 'h-[108px] sm:h-[124px]') : isCompact ? 'h-[72px]' : 'h-[92px] sm:h-[108px]';
  const collapsedWidthClassName = isCompact ? 'w-7' : 'w-8 sm:w-9';
  const expandedWidthClassName = isCompact ? 'w-[min(60vw,10.5rem)]' : 'w-[min(72vw,12rem)] sm:w-48 lg:w-56';
  const widthClassName = isOpen ? expandedWidthClassName : collapsedWidthClassName;
  const buttonClassName = isCompact ? 'w-7 text-[6px]' : 'w-8 text-[7px] sm:w-9 sm:text-[8px]';

  return (
    <div className="absolute right-3 z-20" style={style}>
      <div
        className={`relative overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) shadow-lg backdrop-blur-xl transition-[width,opacity] duration-300 ${heightClassName} ${widthClassName} ${
          isOpen ? 'opacity-100' : 'opacity-95'
        }`}
      >
        <div className={`absolute inset-y-0 right-0 flex items-stretch ${expandedWidthClassName}`}>
          <div
            className={`min-w-0 flex-1 overflow-hidden transition-opacity duration-200 ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!isOpen}
          >
            <table className={`h-full w-full table-fixed border-collapse text-left text-(--text-muted) ${isCompact ? 'text-[7px]' : 'text-[8px] sm:text-[9px]'}`}>
              <tbody className="h-full">
                {rows.map((row, index) => {
                  const resolvedLabel = isCompact ? row.compactLabel : row.label;
                  const resolvedValue = isCompact && row.compactValue !== undefined ? row.compactValue : row.value;

                  return (
                    <tr key={row.title ?? row.label} className={index % 2 === 0 ? 'bg-(--surface-zebra-odd)' : 'bg-(--surface-zebra-even)'}>
                      <th
                        className={`border-r border-(--border-subtle)/35 font-semibold uppercase tracking-[0.08em] text-(--text-muted) ${isCompact ? 'w-[34%] px-1 py-[2px]' : 'w-[36%] px-1.5 py-[3px]'}`}
                        title={row.title ?? row.label}
                      >
                        {resolvedLabel}
                      </th>
                      <td
                        className={`min-w-0 overflow-hidden text-right font-semibold text-foreground tabular-nums ${isCompact ? 'px-1 py-[2px]' : 'px-1.5 py-[3px]'}`}
                        title={row.value}
                      >
                        <span className="block truncate leading-tight">{resolvedValue}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex h-full shrink-0 items-center justify-center border-l border-(--border-subtle)/70 font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition-colors hover:text-foreground ${buttonClassName}`}
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            aria-label={isOpen ? text.summary.hide : text.summary.show}
            title={isOpen ? text.summary.hide : text.summary.show}
          >
            {text.summary.title}
          </button>
        </div>
      </div>
    </div>
  );
});

export default MoleculeSummaryPanel;
