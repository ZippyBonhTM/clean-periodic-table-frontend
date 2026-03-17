import type {
  Rational,
  ReducedRowEchelonForm,
  SolveHomogeneousSystemFailure,
  SolveHomogeneousSystemIssue,
  SolveHomogeneousSystemResult,
  SolverMatrix,
} from '@/shared/chemistry/solver/solver.types';
import {
  createRational,
  divideRationals,
  isFiniteRational,
  isZeroRational,
  multiplyRationals,
  normalizeRational,
  subtractRationals,
} from '@/shared/chemistry/solver/rational';

function buildIssue(
  code: SolveHomogeneousSystemIssue['code'],
  message: string,
): SolveHomogeneousSystemIssue {
  return { code, message };
}

function buildFailure(
  code: SolveHomogeneousSystemIssue['code'],
  message: string,
): SolveHomogeneousSystemFailure {
  return {
    ok: false,
    issues: [buildIssue(code, message)],
  };
}

function normalizeMatrix(matrix: SolverMatrix): SolveHomogeneousSystemResult | SolverMatrix {
  if (matrix.length === 0 || matrix[0]?.length === 0) {
    return buildFailure('empty-matrix', 'Solver matrix cannot be empty.');
  }

  const columnCount = matrix[0].length;

  if (matrix.some((row) => row.length !== columnCount)) {
    return buildFailure('ragged-matrix', 'Solver matrix rows must all have the same length.');
  }

  if (matrix.some((row) => row.some((entry) => entry.denominator === 0))) {
    return buildFailure('zero-denominator', 'Solver matrix contains zero denominators.');
  }

  if (matrix.some((row) => row.some((entry) => !isFiniteRational(entry)))) {
    return buildFailure('non-finite-entry', 'Solver matrix contains non-finite entries.');
  }

  return matrix.map((row) => row.map((entry) => normalizeRational(entry)));
}

function cloneMatrix(matrix: SolverMatrix): SolverMatrix {
  return matrix.map((row) => row.map((entry) => createRational(entry.numerator, entry.denominator)));
}

function scaleRow(row: Rational[], scalar: Rational): Rational[] {
  return row.map((value) => multiplyRationals(value, scalar));
}

function subtractScaledRow(
  targetRow: Rational[],
  sourceRow: Rational[],
  scalar: Rational,
): Rational[] {
  return targetRow.map((value, index) =>
    subtractRationals(value, multiplyRationals(sourceRow[index], scalar)),
  );
}

export function buildReducedRowEchelonForm(
  matrix: SolverMatrix,
): SolveHomogeneousSystemResult | ReducedRowEchelonForm {
  const normalizedMatrix = normalizeMatrix(matrix);

  if ('ok' in normalizedMatrix) {
    return normalizedMatrix;
  }

  const working = cloneMatrix(normalizedMatrix);
  const rowCount = working.length;
  const columnCount = working[0].length;
  const pivotColumns: number[] = [];

  let pivotRowIndex = 0;

  for (let columnIndex = 0; columnIndex < columnCount && pivotRowIndex < rowCount; columnIndex += 1) {
    const sourceRowIndex = working.findIndex(
      (row, index) => index >= pivotRowIndex && !isZeroRational(row[columnIndex]),
    );

    if (sourceRowIndex === -1) {
      continue;
    }

    if (sourceRowIndex !== pivotRowIndex) {
      const temporaryRow = working[pivotRowIndex];
      working[pivotRowIndex] = working[sourceRowIndex];
      working[sourceRowIndex] = temporaryRow;
    }

    const pivotValue = working[pivotRowIndex][columnIndex];
    working[pivotRowIndex] = scaleRow(
      working[pivotRowIndex],
      divideRationals(createRational(1), pivotValue),
    );

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      if (rowIndex === pivotRowIndex) {
        continue;
      }

      const factor = working[rowIndex][columnIndex];

      if (isZeroRational(factor)) {
        continue;
      }

      working[rowIndex] = subtractScaledRow(working[rowIndex], working[pivotRowIndex], factor);
    }

    pivotColumns.push(columnIndex);
    pivotRowIndex += 1;
  }

  const freeColumns = Array.from({ length: columnCount }, (_, index) => index).filter(
    (columnIndex) => !pivotColumns.includes(columnIndex),
  );

  return {
    matrix: working,
    pivotColumns,
    freeColumns,
    rowCount,
    columnCount,
    rank: pivotColumns.length,
  };
}
