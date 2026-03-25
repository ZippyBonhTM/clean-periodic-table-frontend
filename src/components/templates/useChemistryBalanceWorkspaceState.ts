'use client';

import { useCallback, useMemo, useState } from 'react';

import useChemistryBalanceRemoteAnalysis from '@/components/templates/useChemistryBalanceRemoteAnalysis';
import useEquationBalanceHistory from '@/components/templates/useEquationBalanceHistory';
import useEquationBalanceRemotePreference from '@/components/templates/useEquationBalanceRemotePreference';
import { logoutSession } from '@/shared/api/authApi';
import { balanceChemicalEquationText } from '@/shared/chemistry/analysis';
import { analyzeBalancedReaction } from '@/shared/chemistry/rules';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import useElements from '@/shared/hooks/useElements';

const DEFAULT_EQUATION_INPUT = 'H2 + O2 -> H2O';

const BALANCE_OPTIONS = {
  format: {
    includePhase: true,
    hideCoefficientOne: true,
  },
} as const;

export default function useChemistryBalanceWorkspaceState() {
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
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

  const [equationInput, setEquationInput] = useState(DEFAULT_EQUATION_INPUT);
  const [submittedEquation, setSubmittedEquation] = useState(DEFAULT_EQUATION_INPUT);
  const [submissionVersion, setSubmissionVersion] = useState(0);
  const { isRemoteEngineEnabled, setIsRemoteEngineEnabled } =
    useEquationBalanceRemotePreference();

  const result = useMemo(
    () => balanceChemicalEquationText(submittedEquation, BALANCE_OPTIONS),
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

  const submitEquation = useCallback(
    (nextEquation: string) => {
      setSubmittedEquation(nextEquation);
      setSubmissionVersion((currentVersion) => currentVersion + 1);

      if (isRemoteEngineEnabled) {
        void runRemoteAnalysis(nextEquation);
        return;
      }

      resetRemoteAnalysis();
    },
    [isRemoteEngineEnabled, resetRemoteAnalysis, runRemoteAnalysis],
  );

  const applyEquationInput = useCallback(
    (nextEquation: string) => {
      setEquationInput(nextEquation);
      submitEquation(nextEquation);
    },
    [submitEquation],
  );

  const handleBalanceLocally = useCallback(() => {
    submitEquation(equationInput);
  }, [equationInput, submitEquation]);

  const handleClear = useCallback(() => {
    setEquationInput('');
    setSubmittedEquation('');
    resetRemoteAnalysis();
  }, [resetRemoteAnalysis]);

  const handleToggleRemoteEngine = useCallback(
    (enabled: boolean) => {
      setIsRemoteEngineEnabled(enabled);

      if (!enabled) {
        resetRemoteAnalysis();
        return;
      }

      if (submissionVersion > 0) {
        void runRemoteAnalysis(submittedEquation);
      }
    },
    [
      resetRemoteAnalysis,
      runRemoteAnalysis,
      setIsRemoteEngineEnabled,
      submissionVersion,
      submittedEquation,
    ],
  );

  const triggerRemoteAnalysis = useCallback(() => {
    if (!isRemoteEngineEnabled) {
      return;
    }

    void runRemoteAnalysis(submittedEquation);
  }, [isRemoteEngineEnabled, runRemoteAnalysis, submittedEquation]);

  const handleLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  return {
    shell: {
      hasToken: hasValidSession,
      authStatus: isHydrated ? authSession.status : ('checking' as const),
      onLogout: handleLogout,
    },
    equationInput,
    setEquationInput,
    result,
    analysis,
    metadataStatus,
    historyEntries,
    clearHistory,
    remoteAnalysis,
    isRemoteEngineEnabled,
    canRetryRemote: submissionVersion > 0 && submittedEquation.trim().length > 0,
    applyEquationInput,
    handleBalanceLocally,
    handleClear,
    handleToggleRemoteEngine,
    triggerRemoteAnalysis,
  };
}
