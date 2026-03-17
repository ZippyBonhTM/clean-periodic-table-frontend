'use client';

import { useMemo, useState } from 'react';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import AppShell from '@/components/templates/AppShell';
import ChemistryBalanceAnalysisPanel from '@/components/templates/ChemistryBalanceAnalysisPanel';
import ChemistryBalanceAnalysisComparisonPanel from '@/components/templates/ChemistryBalanceAnalysisComparisonPanel';
import ChemistryBalanceComparisonPanel from '@/components/templates/ChemistryBalanceComparisonPanel';
import ChemistryBalanceEnginePanel from '@/components/templates/ChemistryBalanceEnginePanel';
import ChemistryBalanceExamplesPanel from '@/components/templates/ChemistryBalanceExamplesPanel';
import ChemistryBalanceHistoryPanel from '@/components/templates/ChemistryBalanceHistoryPanel';
import ChemistryBalancePipelinePanel from '@/components/templates/ChemistryBalancePipelinePanel';
import ChemistryBalanceResultPanel from '@/components/templates/ChemistryBalanceResultPanel';
import { chemistryBalanceText } from '@/components/templates/chemistryBalanceText';
import useChemistryBalanceRemoteAnalysis from '@/components/templates/useChemistryBalanceRemoteAnalysis';
import useEquationBalanceHistory from '@/components/templates/useEquationBalanceHistory';
import useEquationBalanceRemotePreference from '@/components/templates/useEquationBalanceRemotePreference';
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
  const { isRemoteEngineEnabled, setIsRemoteEngineEnabled } =
    useEquationBalanceRemotePreference();

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

  const triggerRemoteAnalysis = () => {
    if (!isRemoteEngineEnabled) {
      return;
    }

    void runRemoteAnalysis(submittedEquation);
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
              {chemistryBalanceText.workspace.eyebrow}
            </p>
            <h1 className="text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
              {chemistryBalanceText.workspace.title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
              {chemistryBalanceText.workspace.description}
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="equation-input"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              {chemistryBalanceText.workspace.equationLabel}
            </label>
            <textarea
              id="equation-input"
              value={equationInput}
              onChange={(event) => setEquationInput(event.target.value)}
              placeholder={chemistryBalanceText.workspace.equationPlaceholder}
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
              {chemistryBalanceText.workspace.submit}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEquationInput('');
                setSubmittedEquation('');
                resetRemoteAnalysis();
              }}
            >
              {chemistryBalanceText.workspace.clear}
            </Button>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <ChemistryBalanceResultPanel result={result} />

          <div className="space-y-5">
            <ChemistryBalanceExamplesPanel onSelect={applyEquationInput} />
            <ChemistryBalanceComparisonPanel
              value={result.ok ? result.value : null}
            />
            <ChemistryBalanceAnalysisPanel analysis={analysis} metadataStatus={metadataStatus} />
            <ChemistryBalanceEnginePanel
              enabled={isRemoteEngineEnabled}
              canRetry={submissionVersion > 0 && submittedEquation.trim().length > 0}
              onRetry={triggerRemoteAnalysis}
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
            <ChemistryBalanceAnalysisComparisonPanel
              localAnalysis={analysis}
              remoteAnalysis={remoteAnalysis}
            />
            <ChemistryBalanceHistoryPanel
              entries={historyEntries}
              onSelect={applyEquationInput}
              onClear={clearHistory}
            />

            <ChemistryBalancePipelinePanel />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
