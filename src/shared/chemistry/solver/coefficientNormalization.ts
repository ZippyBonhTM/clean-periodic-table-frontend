import type {
  NormalizeCoefficientsIssue,
  NormalizeCoefficientsResult,
  Rational,
} from '@/shared/chemistry/solver/solver.types';
import {
  createRational,
  greatestCommonDivisor,
  isFiniteRational,
  isZeroRational,
  leastCommonMultiple,
} from '@/shared/chemistry/solver/rational';

function buildIssue(
  code: NormalizeCoefficientsIssue['code'],
  message: string,
): NormalizeCoefficientsIssue {
  return { code, message };
}

export function normalizeStoichiometricCoefficients(
  coefficients: Rational[],
): NormalizeCoefficientsResult {
  if (coefficients.length === 0) {
    return {
      ok: false,
      issues: [buildIssue('empty-vector', 'Coefficient vector is empty.')],
    };
  }

  if (
    coefficients.some(
      (coefficient) =>
        !isFiniteRational(coefficient) || !Number.isInteger(coefficient.numerator),
    )
  ) {
    return {
      ok: false,
      issues: [
        buildIssue(
          'non-finite-coefficient',
          'Coefficient vector contains non-finite values.',
        ),
      ],
    };
  }

  if (coefficients.some((coefficient) => coefficient.denominator === 0)) {
    return {
      ok: false,
      issues: [buildIssue('zero-denominator', 'Coefficient vector contains zero denominators.')],
    };
  }

  if (coefficients.every((coefficient) => isZeroRational(coefficient))) {
    return {
      ok: false,
      issues: [buildIssue('zero-vector', 'Coefficient vector cannot be all zeros.')],
    };
  }

  const normalized = coefficients.map((coefficient) =>
    createRational(coefficient.numerator, coefficient.denominator),
  );

  const scaleFactor = normalized.reduce(
    (currentScale, coefficient) =>
      leastCommonMultiple(currentScale, Math.abs(coefficient.denominator)),
    1,
  );

  const scaled = normalized.map(
    (coefficient) => (coefficient.numerator * scaleFactor) / coefficient.denominator,
  );

  const firstNonZero = scaled.find((value) => value !== 0) ?? 0;
  const sign = firstNonZero < 0 ? -1 : 1;
  const signAdjusted = scaled.map((value) => value * sign);
  const nonZeroTerms = signAdjusted.filter((value) => value !== 0).map((value) => Math.abs(value));
  const divisor = nonZeroTerms.reduce(
    (currentDivisor, value) => greatestCommonDivisor(currentDivisor, value),
    nonZeroTerms[0] ?? 1,
  );

  const reduced =
    divisor > 1 ? signAdjusted.map((value) => value / divisor) : signAdjusted.slice();

  return {
    ok: true,
    value: reduced,
    scaleFactor,
  };
}
