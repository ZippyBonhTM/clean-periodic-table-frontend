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

export function negateRational(rational: Rational): Rational {
  return createRational(-rational.numerator, rational.denominator);
}

export function addRationals(left: Rational, right: Rational): Rational {
  return createRational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function subtractRationals(left: Rational, right: Rational): Rational {
  return addRationals(left, negateRational(right));
}

export function multiplyRationals(left: Rational, right: Rational): Rational {
  return createRational(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
}

export function divideRationals(left: Rational, right: Rational): Rational {
  return createRational(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
}

export function isZeroRational(rational: Rational): boolean {
  return rational.numerator === 0;
}

export function isFiniteRational(rational: Rational): boolean {
  return Number.isFinite(rational.numerator) && Number.isFinite(rational.denominator);
}
