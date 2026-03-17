import { parseChemicalEquation } from '@/shared/chemistry/equation';
import { parseChemicalFormula } from '@/shared/chemistry/formula';
import {
  balanceChemicalReaction,
  createChemicalReactionFromEquation,
  formatBalancedReaction,
} from '@/shared/chemistry/reaction';
import type {
  BalanceChemicalEquationFlowOptions,
  BalanceChemicalEquationFlowResult,
  BalanceChemicalEquationIssue,
  BalanceChemicalEquationStage,
} from '@/shared/chemistry/analysis/balanceChemicalEquation.types';

function buildIssue(
  stage: BalanceChemicalEquationStage,
  code: string,
  message: string,
  extras: Omit<BalanceChemicalEquationIssue, 'stage' | 'code' | 'message'> = {},
): BalanceChemicalEquationIssue {
  return {
    stage,
    code,
    message,
    ...extras,
  };
}

export function balanceChemicalEquationText(
  input: string,
  options: BalanceChemicalEquationFlowOptions = {},
): BalanceChemicalEquationFlowResult {
  const equationResult = parseChemicalEquation(input, options.equation);

  if (!equationResult.ok) {
    return {
      ok: false,
      stage: 'equation-parse',
      issues: equationResult.issues.map((issue) =>
        buildIssue('equation-parse', issue.code, issue.message, {
          start: issue.start,
          end: issue.end,
        }),
      ),
    };
  }

  const reactionResult = createChemicalReactionFromEquation(
    equationResult.value,
    (formulaInput, formulaOptions) =>
      parseChemicalFormula(formulaInput, {
        ...options.formula,
        ...formulaOptions,
      }),
  );

  if (!reactionResult.ok) {
    return {
      ok: false,
      stage: 'reaction-create',
      issues: reactionResult.issues.map((issue) =>
        buildIssue('reaction-create', issue.code, issue.message, {
          side: issue.side,
          termIndex: issue.termIndex,
        }),
      ),
    };
  }

  const balanceResult = balanceChemicalReaction(reactionResult.value);

  if (!balanceResult.ok) {
    return {
      ok: false,
      stage: 'reaction-balance',
      issues: balanceResult.issues.map((issue) =>
        buildIssue('reaction-balance', issue.code, issue.message),
      ),
    };
  }

  return {
    ok: true,
    value: {
      input,
      equation: equationResult.value,
      reaction: reactionResult.value,
      balancedReaction: balanceResult.value,
      formatted: formatBalancedReaction(balanceResult.value, options.format),
    },
    warnings: [
      ...equationResult.warnings.map((issue) =>
        buildIssue('equation-parse', issue.code, issue.message, {
          start: issue.start,
          end: issue.end,
        }),
      ),
      ...reactionResult.warnings.map((issue) =>
        buildIssue('reaction-create', issue.code, issue.message, {
          side: issue.side,
          termIndex: issue.termIndex,
        }),
      ),
      ...balanceResult.warnings.map((issue) =>
        buildIssue('reaction-balance', issue.code, issue.message),
      ),
    ],
  };
}
