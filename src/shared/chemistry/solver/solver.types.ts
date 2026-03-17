export type Rational = {
  numerator: number;
  denominator: number;
};

export type SolverVector = Rational[];

export type SolverMatrix = SolverVector[];

export type StoichiometricCoefficientVector = number[];

export type ReducedRowEchelonForm = {
  matrix: SolverMatrix;
  pivotColumns: number[];
  freeColumns: number[];
  rowCount: number;
  columnCount: number;
  rank: number;
};

export type NormalizeCoefficientsIssueCode =
  | 'empty-vector'
  | 'zero-vector'
  | 'non-finite-coefficient'
  | 'zero-denominator';

export type NormalizeCoefficientsIssue = {
  code: NormalizeCoefficientsIssueCode;
  message: string;
};

export type NormalizeCoefficientsSuccess = {
  ok: true;
  value: StoichiometricCoefficientVector;
  scaleFactor: number;
};

export type NormalizeCoefficientsFailure = {
  ok: false;
  issues: NormalizeCoefficientsIssue[];
};

export type NormalizeCoefficientsResult =
  | NormalizeCoefficientsSuccess
  | NormalizeCoefficientsFailure;

export type SolveHomogeneousSystemIssueCode =
  | 'empty-matrix'
  | 'ragged-matrix'
  | 'non-finite-entry'
  | 'zero-denominator';

export type SolveHomogeneousSystemIssue = {
  code: SolveHomogeneousSystemIssueCode;
  message: string;
};

export type SolveHomogeneousSystemValue = {
  rref: ReducedRowEchelonForm;
  basis: SolverVector[];
};

export type SolveHomogeneousSystemSuccess = {
  ok: true;
  value: SolveHomogeneousSystemValue;
};

export type SolveHomogeneousSystemFailure = {
  ok: false;
  issues: SolveHomogeneousSystemIssue[];
};

export type SolveHomogeneousSystemResult =
  | SolveHomogeneousSystemSuccess
  | SolveHomogeneousSystemFailure;
