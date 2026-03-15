import type { BondOrder } from '@/shared/utils/moleculeEditor';

const CANONICAL_ANGLE_STEP = 30;
const SINGLE_BOND_LENGTH = 92;
const DOUBLE_BOND_LENGTH = 88;
const TRIPLE_BOND_LENGTH = 84;

function distanceBetween(first: { x: number; y: number }, second: { x: number; y: number }): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function normalizeAngle(angle: number): number {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function circularAngleDistance(firstAngle: number, secondAngle: number): number {
  const distance = Math.abs(normalizeAngle(firstAngle) - normalizeAngle(secondAngle));
  return Math.min(distance, 360 - distance);
}

function resolveAngleBetween(first: { x: number; y: number }, second: { x: number; y: number }): number {
  return normalizeAngle((Math.atan2(second.y - first.y, second.x - first.x) * 180) / Math.PI);
}

function resolveIdealAngles(connectionCount: number): number[] {
  if (connectionCount <= 0) {
    return [];
  }

  if (connectionCount === 1) {
    return [0];
  }

  if (connectionCount === 2) {
    return [0, 180];
  }

  if (connectionCount === 3) {
    return [0, 120, 240];
  }

  if (connectionCount === 4) {
    return [30, 150, 210, 330];
  }

  const step = 360 / connectionCount;
  return Array.from({ length: connectionCount }, (_, index) => index * step);
}

function rotateAngles(angles: number[], rotation: number): number[] {
  return angles.map((angle) => normalizeAngle(angle + rotation));
}

function snapAngleToCanonicalGrid(angle: number): number {
  return normalizeAngle(Math.round(angle / CANONICAL_ANGLE_STEP) * CANONICAL_ANGLE_STEP);
}

function resolveIdealBondLength(order: BondOrder): number {
  if (order === 3) {
    return TRIPLE_BOND_LENGTH;
  }

  if (order === 2) {
    return DOUBLE_BOND_LENGTH;
  }

  return SINGLE_BOND_LENGTH;
}

export {
  circularAngleDistance,
  distanceBetween,
  normalizeAngle,
  resolveAngleBetween,
  resolveIdealAngles,
  resolveIdealBondLength,
  rotateAngles,
  snapAngleToCanonicalGrid,
};
