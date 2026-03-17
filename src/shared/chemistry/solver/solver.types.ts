export type Rational = {
  numerator: number;
  denominator: number;
};

export type SolverVector = Rational[];

export type SolverMatrix = SolverVector[];

export type StoichiometricCoefficientVector = number[];

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
