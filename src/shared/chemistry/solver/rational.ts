import type { Rational } from '@/shared/chemistry/solver/solver.types';

export function greatestCommonDivisor(a: number, b: number): number {
  let left = Math.abs(a);
  let right = Math.abs(b);

  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }

  return left === 0 ? 1 : left;
}

export function leastCommonMultiple(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }

  return Math.abs((a * b) / greatestCommonDivisor(a, b));
}

export function normalizeRational(rational: Rational): Rational {
  if (rational.denominator === 0) {
    return rational;
  }

  const sign = rational.denominator < 0 ? -1 : 1;
  const numerator = rational.numerator * sign;
  const denominator = rational.denominator * sign;
  const divisor = greatestCommonDivisor(numerator, denominator);

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

export function createRational(numerator: number, denominator = 1): Rational {
  return normalizeRational({ numerator, denominator });
}

export function isZeroRational(rational: Rational): boolean {
  return rational.numerator === 0;
}

export function isFiniteRational(rational: Rational): boolean {
  return Number.isFinite(rational.numerator) && Number.isFinite(rational.denominator);
}
