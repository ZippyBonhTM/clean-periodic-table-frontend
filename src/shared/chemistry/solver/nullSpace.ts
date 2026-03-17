import type {
  Rational,
  SolveHomogeneousSystemResult,
  SolverMatrix,
  SolverVector,
} from '@/shared/chemistry/solver/solver.types';
import { buildReducedRowEchelonForm } from '@/shared/chemistry/solver/matrixRowReduction';
import { createRational, negateRational } from '@/shared/chemistry/solver/rational';

export function solveHomogeneousSystem(matrix: SolverMatrix): SolveHomogeneousSystemResult {
  const rref = buildReducedRowEchelonForm(matrix);

  if ('ok' in rref) {
    return rref;
  }

  const basis: SolverVector[] = rref.freeColumns.map((freeColumnIndex) => {
    const vector: Rational[] = Array.from({ length: rref.columnCount }, () => createRational(0));

    vector[freeColumnIndex] = createRational(1);

    rref.pivotColumns.forEach((pivotColumnIndex, pivotRowIndex) => {
      vector[pivotColumnIndex] = negateRational(rref.matrix[pivotRowIndex][freeColumnIndex]);
    });

    return vector;
  });

  return {
    ok: true,
    value: {
      rref,
      basis,
    },
  };
}
