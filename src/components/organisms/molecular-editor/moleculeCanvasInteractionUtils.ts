'use client';

export type EditorViewMode = 'editor' | 'structural' | 'simplified' | 'stick';

export type CanvasViewportLike = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type CanvasInteraction =
  | {
      type: 'idle';
    }
  | {
      type: 'canvas-press';
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startPoint: {
        x: number;
        y: number;
      };
      startOffsetX: number;
      startOffsetY: number;
      canPan: boolean;
      moved: boolean;
    }
  | {
      type: 'atom-press';
      pointerId: number;
      atomId: string;
      startClientX: number;
      startClientY: number;
      startOffsetX: number;
      startOffsetY: number;
      mode: 'select' | 'pan';
      moved: boolean;
    };

export const DRAG_THRESHOLD_PX = 6;

export function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  return {
    x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
  };
}

export function toSvgDelta(
  svg: SVGSVGElement,
  viewBox: { width: number; height: number },
  deltaClientX: number,
  deltaClientY: number,
) {
  const rect = svg.getBoundingClientRect();

  return {
    x: (deltaClientX / rect.width) * viewBox.width,
    y: (deltaClientY / rect.height) * viewBox.height,
  };
}
