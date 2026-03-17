'use client';

import { useMemo, useState } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import AppShell from '@/components/templates/AppShell';
import ChemistryBalanceAnalysisPanel from '@/components/templates/ChemistryBalanceAnalysisPanel';
import ChemistryBalanceComparisonPanel from '@/components/templates/ChemistryBalanceComparisonPanel';
import ChemistryBalanceEnginePanel from '@/components/templates/ChemistryBalanceEnginePanel';
import ChemistryBalanceExamplesPanel from '@/components/templates/ChemistryBalanceExamplesPanel';
import ChemistryBalanceHistoryPanel from '@/components/templates/ChemistryBalanceHistoryPanel';
import useChemistryBalanceRemoteAnalysis from '@/components/templates/useChemistryBalanceRemoteAnalysis';
import useEquationBalanceHistory from '@/components/templates/useEquationBalanceHistory';
import { logoutSession } from '@/shared/api/authApi';
import { balanceChemicalEquationText } from '@/shared/chemistry/analysis';
import { analyzeBalancedReaction } from '@/shared/chemistry/rules';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import useElements from '@/shared/hooks/useElements';

export default function ChemistryBalanceWorkspace() {
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
    skipTokenValidation: true,
  });
  const hasValidSession = authSession.status === 'authenticated';
  const {
    data: elements,
    isLoading: isElementsLoading,
    error: elementsError,
  } = useElements({
    token: hasValidSession ? token : null,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
  });
  const [equationInput, setEquationInput] = useState('H2 + O2 -> H2O');
  const [submittedEquation, setSubmittedEquation] = useState('H2 + O2 -> H2O');
  const [submissionVersion, setSubmissionVersion] = useState(0);
  const [isRemoteEngineEnabled, setIsRemoteEngineEnabled] = useState(false);

  const result = useMemo(
    () =>
      balanceChemicalEquationText(submittedEquation, {
        format: {
          includePhase: true,
          hideCoefficientOne: true,
        },
      }),
    [submittedEquation],
  );

  const elementMetadataBySymbol = useMemo(() => {
    if (elements.length === 0) {
      return undefined;
    }

    return new Map(
      elements.map((element) => [
        element.symbol,
        {
          symbol: element.symbol,
          group: element.group,
          category: element.category,
          electronegativity_pauling: element.electronegativity_pauling,
        },
      ]),
    );
  }, [elements]);

  const analysis = useMemo(() => {
    if (!result.ok) {
      return null;
    }

    return analyzeBalancedReaction(result.value.balancedReaction, {
      elementMetadataBySymbol,
    });
  }, [elementMetadataBySymbol, result]);

  const metadataStatus = useMemo(() => {
    if (!hasValidSession) {
      return 'inactive' as const;
    }

    if (isElementsLoading) {
      return 'loading' as const;
    }

    if (elementsError !== null) {
      return 'unavailable' as const;
    }

    if (elements.length > 0) {
      return 'ready' as const;
    }

    return 'inactive' as const;
  }, [elements.length, elementsError, hasValidSession, isElementsLoading]);

  const { entries: historyEntries, clearHistory } = useEquationBalanceHistory(
    submittedEquation,
    result,
    submissionVersion,
  );
  const { remoteAnalysis, resetRemoteAnalysis, runRemoteAnalysis } =
    useChemistryBalanceRemoteAnalysis({
      token: hasValidSession ? token : null,
      rules: {
        elementMetadataBySymbol,
      },
    });

  const applyEquationInput = (nextEquation: string) => {
    setEquationInput(nextEquation);
    setSubmittedEquation(nextEquation);
    setSubmissionVersion((currentVersion) => currentVersion + 1);

    if (isRemoteEngineEnabled) {
      void runRemoteAnalysis(nextEquation);
      return;
    }

    resetRemoteAnalysis();
  };

  return (
    <AppShell
      hasToken={hasValidSession}
      authStatus={isHydrated ? authSession.status : 'checking'}
      onLogout={() => {
        void logoutSession().catch(() => undefined);
        removeToken({ blockSilentRefresh: true });
      }}
      showFooter={false}
    >
      <section className="space-y-5">
        <Panel className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Client-First Chemistry
            </p>
            <h1 className="text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
              Balance Equation
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
              This page uses the local chemistry pipeline only: equation parsing, reaction creation,
              matrix balancing, and deterministic formatting.
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="equation-input"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              Equation
            </label>
            <textarea
              id="equation-input"
              value={equationInput}
              onChange={(event) => setEquationInput(event.target.value)}
              placeholder="H2 + O2 -> H2O"
              rows={4}
              className="min-h-28 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)] sm:text-base"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setSubmittedEquation(equationInput);
                setSubmissionVersion((currentVersion) => currentVersion + 1);

                if (isRemoteEngineEnabled) {
                  void runRemoteAnalysis(equationInput);
                  return;
                }

                resetRemoteAnalysis();
              }}
            >
              Balance locally
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEquationInput('');
                setSubmittedEquation('');
                resetRemoteAnalysis();
              }}
            >
              Clear
            </Button>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Panel className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Result
                </p>
                <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
                  Balanced Output
                </h2>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  result.ok
                    ? 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)] text-[var(--text-strong)]'
                    : 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)] text-[var(--text-strong)]'
                }`}
              >
                {result.ok ? 'Balanced' : result.stage}
              </span>
            </div>

            {result.ok ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-soft)] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Formatted
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-[var(--text-strong)] sm:text-xl">
                    {result.value.formatted}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Terms
                    </p>
                    <p className="mt-1 text-lg font-black text-[var(--text-strong)]">
                      {result.value.equation.termCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Elements
                    </p>
                    <p className="mt-1 text-lg font-black text-[var(--text-strong)]">
                      {result.value.reaction.elementSymbols.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Vector
                    </p>
                    <p className="mt-1 text-lg font-black text-[var(--text-strong)]">
                      [{result.value.balancedReaction.coefficientVector.join(', ')}]
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  The equation could not be balanced at the local <code>{result.stage}</code> stage.
                </p>
                <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
                  {result.issues.map((issue, index) => (
                    <li key={`${issue.stage}-${issue.code}-${index}`} className="rounded-xl bg-black/5 px-3 py-2">
                      <span className="font-semibold text-[var(--text-strong)]">{issue.code}</span>
                      : {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <div className="space-y-5">
            <ChemistryBalanceExamplesPanel onSelect={applyEquationInput} />
            <ChemistryBalanceComparisonPanel
              value={result.ok ? result.value : null}
            />
            <ChemistryBalanceAnalysisPanel analysis={analysis} metadataStatus={metadataStatus} />
            <ChemistryBalanceEnginePanel
              enabled={isRemoteEngineEnabled}
              onToggle={(enabled) => {
                setIsRemoteEngineEnabled(enabled);

                if (!enabled) {
                  resetRemoteAnalysis();
                  return;
                }

                if (submissionVersion > 0) {
                  void runRemoteAnalysis(submittedEquation);
                }
              }}
              remoteAnalysis={remoteAnalysis}
            />
            <ChemistryBalanceHistoryPanel
              entries={historyEntries}
              onSelect={applyEquationInput}
              onClear={clearHistory}
            />

            <Panel className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Pipeline
                </p>
                <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
                  Local Stages
                </h2>
              </div>
              <ol className="space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                <li className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                  <span className="font-semibold text-[var(--text-strong)]">1. Equation parse</span>
                  : separates arrow, terms, coefficients, phases, and structural notation.
                </li>
                <li className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                  <span className="font-semibold text-[var(--text-strong)]">2. Reaction creation</span>
                  : converts terms into structured participants with parsed formulas.
                </li>
                <li className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                  <span className="font-semibold text-[var(--text-strong)]">3. Matrix balancing</span>
                  : builds the stoichiometric matrix, solves the null-space, and normalizes coefficients.
                </li>
                <li className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                  <span className="font-semibold text-[var(--text-strong)]">4. Heuristic analysis</span>
                  : applies lightweight local rules and optionally enriches them with Element DB metadata.
                </li>
                <li className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
                  <span className="font-semibold text-[var(--text-strong)]">5. Deterministic formatting</span>
                  : returns a stable text result for display.
                </li>
              </ol>
            </Panel>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
