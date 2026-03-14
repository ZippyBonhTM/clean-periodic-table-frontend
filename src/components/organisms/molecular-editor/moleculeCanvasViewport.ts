import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type ViewportState = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

const DEFAULT_VIEWBOX = {
  x: -240,
  y: -180,
  width: 480,
  height: 360,
};

function resolveBounds(model: MoleculeModel): Bounds | null {
  if (model.atoms.length === 0) {
    return null;
  }

  return model.atoms.reduce<Bounds>(
    (current, atom) => ({
      minX: Math.min(current.minX, atom.x),
      maxX: Math.max(current.maxX, atom.x),
      minY: Math.min(current.minY, atom.y),
      maxY: Math.max(current.maxY, atom.y),
    }),
    {
      minX: model.atoms[0].x,
      maxX: model.atoms[0].x,
      minY: model.atoms[0].y,
      maxY: model.atoms[0].y,
    },
  );
}

function resolveViewBox(model: MoleculeModel) {
  const bounds = resolveBounds(model);

  if (bounds === null) {
    return DEFAULT_VIEWBOX;
  }

  const margin = 120;
  const width = Math.max(bounds.maxX - bounds.minX + margin * 2, 420);
  const height = Math.max(bounds.maxY - bounds.minY + margin * 2, 320);

  return {
    x: bounds.minX - margin,
    y: bounds.minY - margin,
    width,
    height,
  };
}

function resolveModelVisualCenter(model: MoleculeModel): { x: number; y: number } | null {
  const bounds = resolveBounds(model);

  if (bounds === null) {
    return null;
  }

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function resolveInteractiveViewBox(
  model: MoleculeModel,
  viewport: ViewportState,
  frameAspectRatio?: number,
) {
  const baseViewBox = resolveViewBox(model);
  let width = baseViewBox.width / viewport.scale;
  let height = baseViewBox.height / viewport.scale;

  if (frameAspectRatio !== undefined && Number.isFinite(frameAspectRatio) && frameAspectRatio > 0) {
    const currentAspectRatio = width / height;

    if (currentAspectRatio < frameAspectRatio) {
      width = height * frameAspectRatio;
    } else if (currentAspectRatio > frameAspectRatio) {
      height = width / frameAspectRatio;
    }
  }

  const centerX = baseViewBox.x + baseViewBox.width / 2 + viewport.offsetX;
  const centerY = baseViewBox.y + baseViewBox.height / 2 + viewport.offsetY;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

function resolveScaledViewBoxMetrics(
  model: MoleculeModel,
  scale: number,
  frameAspectRatio?: number,
) {
  const baseViewBox = resolveViewBox(model);
  let width = baseViewBox.width / scale;
  let height = baseViewBox.height / scale;

  if (frameAspectRatio !== undefined && Number.isFinite(frameAspectRatio) && frameAspectRatio > 0) {
    const currentAspectRatio = width / height;

    if (currentAspectRatio < frameAspectRatio) {
      width = height * frameAspectRatio;
    } else if (currentAspectRatio > frameAspectRatio) {
      height = width / frameAspectRatio;
    }
  }

  return {
    baseViewBox,
    width,
    height,
    centerX: baseViewBox.x + baseViewBox.width / 2,
    centerY: baseViewBox.y + baseViewBox.height / 2,
  };
}

function preserveViewportAcrossModelChange(
  previousModel: MoleculeModel,
  nextModel: MoleculeModel,
  viewport: ViewportState,
  frameAspectRatio?: number,
  anchorPoint?: { x: number; y: number },
): ViewportState {
  const previousViewBox = resolveInteractiveViewBox(previousModel, viewport, frameAspectRatio);
  const previousVisualCenter = resolveModelVisualCenter(previousModel);
  const nextVisualCenter = resolveModelVisualCenter(nextModel);
  const previousAnchor = anchorPoint ?? previousVisualCenter ?? {
    x: previousViewBox.x + previousViewBox.width / 2,
    y: previousViewBox.y + previousViewBox.height / 2,
  };
  const nextAnchor = anchorPoint ?? nextVisualCenter ?? previousAnchor;
  const ratioX =
    previousViewBox.width === 0 ? 0.5 : (previousAnchor.x - previousViewBox.x) / previousViewBox.width;
  const ratioY =
    previousViewBox.height === 0 ? 0.5 : (previousAnchor.y - previousViewBox.y) / previousViewBox.height;
  const nextMetrics = resolveScaledViewBoxMetrics(nextModel, viewport.scale, frameAspectRatio);
  const nextX = nextAnchor.x - ratioX * nextMetrics.width;
  const nextY = nextAnchor.y - ratioY * nextMetrics.height;

  return {
    ...viewport,
    offsetX: nextX + nextMetrics.width / 2 - nextMetrics.centerX,
    offsetY: nextY + nextMetrics.height / 2 - nextMetrics.centerY,
  };
}

function resolveNextStandalonePoint(model: MoleculeModel): { x: number; y: number } {
  const bounds = resolveBounds(model);

  if (bounds === null) {
    return { x: 0, y: 0 };
  }

  const atomCount = model.atoms.length;
  const rowOffset = atomCount % 3;

  return {
    x: bounds.maxX + 92,
    y: bounds.minY + rowOffset * 56,
  };
}

export {
  DEFAULT_VIEWBOX,
  preserveViewportAcrossModelChange,
  resolveInteractiveViewBox,
  resolveNextStandalonePoint,
  resolveScaledViewBoxMetrics,
  resolveViewBox,
};
