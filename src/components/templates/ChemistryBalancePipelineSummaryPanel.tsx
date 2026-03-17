'use client';

import Panel from '@/components/atoms/Panel';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import type { BalanceChemicalEquationFlowResult } from '@/shared/chemistry/analysis';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';

type ChemistryBalancePipelineSummaryPanelProps = {
  input: string;
  result: BalanceChemicalEquationFlowResult;
  analysis: BalancedReactionAnalysis | null;
  metadataStatus: 'inactive' | 'loading' | 'ready' | 'unavailable';
  remoteEnabled: boolean;
  remoteAnalysis: ChemistryBalanceRemoteAnalysisState;
};

type StageTone = 'success' | 'warning' | 'info' | 'muted';

type StageSummary = {
  label: string;
  value: string;
  detail: string;
  tone: StageTone;
};

type AlignmentStatus = 'aligned' | 'partial' | 'different';

function resolveToneClasses(tone: StageTone): string {
  switch (tone) {
    case 'success':
      return 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)]';
    case 'warning':
      return 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)]';
    case 'info':
      return 'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.12)]';
    case 'muted':
    default:
      return 'border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)]';
  }
}

function formatTypeLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRemoteTypeLabel(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return 'Unknown';
  }

  return formatTypeLabel(value);
}

function normalizeComparisonLabel(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return value.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function resolveClassificationAlignment(
  localType: BalancedReactionAnalysis['reactionType'],
  remoteClassification: string | null,
): AlignmentStatus {
  const normalizedLocal = normalizeComparisonLabel(localType);
  const normalizedRemote = normalizeComparisonLabel(remoteClassification);

  if (normalizedRemote === null || normalizedLocal === null || normalizedLocal === 'unknown') {
    return 'partial';
  }

  if (
    normalizedLocal === normalizedRemote ||
    normalizedLocal.includes(normalizedRemote) ||
    normalizedRemote.includes(normalizedLocal)
  ) {
    return 'aligned';
  }

  return 'different';
}

function resolveConfidenceAlignment(
  localPlausible: boolean,
  remoteValid: boolean | null,
): AlignmentStatus {
  if (remoteValid === null) {
    return 'partial';
  }

  return localPlausible === remoteValid ? 'aligned' : 'different';
}

function formatAlignmentLabel(status: AlignmentStatus): string {
  switch (status) {
    case 'aligned':
      return 'Aligned';
    case 'partial':
      return 'Partial';
    case 'different':
    default:
      return 'Different';
  }
}

function formatScoreDelta(localScore: number, remoteScore: number | null): string {
  if (remoteScore === null) {
    return 'N/A';
  }

  return `${Math.abs(localScore - remoteScore)} pts`;
}

function formatValidity(value: boolean | null): string {
  if (value === null) {
    return 'Unknown';
  }

  return value ? 'Yes' : 'No';
}

function resolveParseStage(result: BalanceChemicalEquationFlowResult, hasInput: boolean): StageSummary {
  if (!hasInput) {
    return {
      label: 'Equation Parse',
      value: 'Idle',
      detail: 'Enter an equation to start the local pipeline.',
      tone: 'muted',
    };
  }

  if (result.ok || result.stage !== 'equation-parse') {
    return {
      label: 'Equation Parse',
      value: 'Passed',
      detail: 'Arrow, terms, coefficients, and phases were parsed successfully.',
      tone: 'success',
    };
  }

  return {
    label: 'Equation Parse',
    value: 'Failed',
    detail: result.issues[0]?.message ?? 'The equation text could not be parsed.',
    tone: 'warning',
  };
}

function resolveReactionStage(result: BalanceChemicalEquationFlowResult, hasInput: boolean): StageSummary {
  if (!hasInput) {
    return {
      label: 'Reaction Create',
      value: 'Idle',
      detail: 'Parsed terms become structured reaction participants here.',
      tone: 'muted',
    };
  }

  if (result.ok || result.stage === 'reaction-balance') {
    return {
      label: 'Reaction Create',
      value: 'Ready',
      detail: 'Formula terms were converted into structured participants.',
      tone: 'success',
    };
  }

  if (result.stage === 'reaction-create') {
    return {
      label: 'Reaction Create',
      value: 'Failed',
      detail: result.issues[0]?.message ?? 'The structured reaction could not be created.',
      tone: 'warning',
    };
  }

  return {
    label: 'Reaction Create',
    value: 'Blocked',
    detail: 'This stage waits for the equation parser to succeed first.',
    tone: 'info',
  };
}

function resolveBalanceStage(result: BalanceChemicalEquationFlowResult, hasInput: boolean): StageSummary {
  if (!hasInput) {
    return {
      label: 'Matrix Balance',
      value: 'Idle',
      detail: 'The stoichiometric solver runs after the reaction is built.',
      tone: 'muted',
    };
  }

  if (result.ok) {
    return {
      label: 'Matrix Balance',
      value: 'Balanced',
      detail: `Coefficient vector: [${result.value.balancedReaction.coefficientVector.join(', ')}].`,
      tone: 'success',
    };
  }

  if (result.stage === 'reaction-balance') {
    return {
      label: 'Matrix Balance',
      value: 'Failed',
      detail: result.issues[0]?.message ?? 'The null-space solver could not normalize a valid solution.',
      tone: 'warning',
    };
  }

  return {
    label: 'Matrix Balance',
    value: 'Blocked',
    detail: 'This stage depends on successful parsing and reaction creation.',
    tone: 'info',
  };
}

function resolveHeuristicsStage(
  result: BalanceChemicalEquationFlowResult,
  analysis: BalancedReactionAnalysis | null,
  metadataStatus: ChemistryBalancePipelineSummaryPanelProps['metadataStatus'],
  hasInput: boolean,
): StageSummary {
  if (!hasInput) {
    return {
      label: 'Local Heuristics',
      value: 'Idle',
      detail: 'Local rule analysis runs after a balanced reaction is available.',
      tone: 'muted',
    };
  }

  if (!result.ok) {
    return {
      label: 'Local Heuristics',
      value: 'Blocked',
      detail: 'Heuristic analysis waits for a successful balanced reaction.',
      tone: 'info',
    };
  }

  if (analysis === null) {
    return {
      label: 'Local Heuristics',
      value: 'Pending',
      detail: 'The local heuristic engine has not produced a result yet.',
      tone: 'info',
    };
  }

  if (metadataStatus === 'ready') {
    return {
      label: 'Local Heuristics',
      value: 'Enriched',
      detail: `${formatTypeLabel(analysis.reactionType)} with Element DB metadata support.`,
      tone: 'success',
    };
  }

  if (metadataStatus === 'loading') {
    return {
      label: 'Local Heuristics',
      value: 'Local + Loading',
      detail: `${formatTypeLabel(analysis.reactionType)} while Element DB metadata is still loading.`,
      tone: 'info',
    };
  }

  return {
    label: 'Local Heuristics',
    value: 'Local Only',
    detail: `${formatTypeLabel(analysis.reactionType)} without Element DB enrichment.`,
    tone: 'success',
  };
}

function resolveRemoteStage(
  remoteEnabled: boolean,
  remoteAnalysis: ChemistryBalanceRemoteAnalysisState,
  hasInput: boolean,
): StageSummary {
  if (!remoteEnabled) {
    return {
      label: 'Remote Engine',
      value: 'Off',
      detail: 'Client-only chemistry is active; no backend enrichment is requested.',
      tone: 'muted',
    };
  }

  if (!hasInput || remoteAnalysis.status === 'idle') {
    return {
      label: 'Remote Engine',
      value: 'Ready',
      detail: 'Remote enrichment will run the next time a balanced equation is submitted.',
      tone: 'info',
    };
  }

  if (remoteAnalysis.status === 'loading') {
    return {
      label: 'Remote Engine',
      value: 'Loading',
      detail: `Requesting optional enrichment for ${remoteAnalysis.input}.`,
      tone: 'info',
    };
  }

  if (remoteAnalysis.status === 'failed') {
    return {
      label: 'Remote Engine',
      value: 'Failed',
      detail: remoteAnalysis.error.message,
      tone: 'warning',
    };
  }

  return {
    label: 'Remote Engine',
    value: 'Available',
    detail: `${formatRemoteTypeLabel(remoteAnalysis.value.classification)} from the optional Chemical Engine.`,
    tone: 'success',
  };
}

function ChemistryBalancePipelineSummaryPanel({
  input,
  result,
  analysis,
  metadataStatus,
  remoteEnabled,
  remoteAnalysis,
}: ChemistryBalancePipelineSummaryPanelProps) {
  const hasInput = input.trim().length > 0;
  const stages = [
    resolveParseStage(result, hasInput),
    resolveReactionStage(result, hasInput),
    resolveBalanceStage(result, hasInput),
    resolveHeuristicsStage(result, analysis, metadataStatus, hasInput),
    resolveRemoteStage(remoteEnabled, remoteAnalysis, hasInput),
  ];

  const comparison =
    analysis !== null && remoteAnalysis.status === 'available'
      ? {
          localType: analysis.reactionType,
          localScore: analysis.score,
          classificationAlignment: resolveClassificationAlignment(
            analysis.reactionType,
            remoteAnalysis.value.classification,
          ),
          confidenceAlignment: resolveConfidenceAlignment(
            analysis.likelyPlausible,
            remoteAnalysis.value.valid,
          ),
          scoreDelta: formatScoreDelta(analysis.score, remoteAnalysis.value.score),
          remoteValidity: formatValidity(remoteAnalysis.value.valid),
        }
      : null;

  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Pipeline
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          Pipeline Overview
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          This summary keeps the whole chemistry flow in one place: parse, reaction creation,
          matrix balance, local heuristics, and optional remote enrichment.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className={`rounded-2xl border px-4 py-4 ${resolveToneClasses(stage.tone)}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {stage.label}
            </p>
            <p className="mt-1 text-base font-black text-[var(--text-strong)]">{stage.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{stage.detail}</p>
          </div>
        ))}
      </div>

      {comparison !== null ? (
        <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Local vs Remote Snapshot
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              The local client-first analysis and optional Chemical Engine response can now be read
              together here.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-2xl border px-4 py-3 ${resolveToneClasses(comparison.classificationAlignment === 'aligned' ? 'success' : comparison.classificationAlignment === 'partial' ? 'info' : 'warning')}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Classification
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {formatAlignmentLabel(comparison.classificationAlignment)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Delta: {comparison.scoreDelta}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${resolveToneClasses(comparison.confidenceAlignment === 'aligned' ? 'success' : comparison.confidenceAlignment === 'partial' ? 'info' : 'warning')}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Confidence
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {formatAlignmentLabel(comparison.confidenceAlignment)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Remote valid: {comparison.remoteValidity}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-soft)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Local Heuristic
              </p>
              <p className="mt-1 text-base font-black text-[var(--text-strong)]">
                {formatTypeLabel(comparison.localType)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Score {comparison.localScore}/100
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export default ChemistryBalancePipelineSummaryPanel;
