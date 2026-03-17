'use client';

import { useEffect, useState } from 'react';

const EQUATION_BALANCE_REMOTE_ENGINE_KEY = 'chemistry-equation-remote-engine-enabled-v1';

function readPersistedRemotePreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(EQUATION_BALANCE_REMOTE_ENGINE_KEY) === '1';
}

export default function useEquationBalanceRemotePreference() {
  const [isRemoteEngineEnabled, setIsRemoteEngineEnabled] = useState<boolean>(
    readPersistedRemotePreference,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isRemoteEngineEnabled) {
      window.localStorage.setItem(EQUATION_BALANCE_REMOTE_ENGINE_KEY, '1');
      return;
    }

    window.localStorage.removeItem(EQUATION_BALANCE_REMOTE_ENGINE_KEY);
  }, [isRemoteEngineEnabled]);

  return {
    isRemoteEngineEnabled,
    setIsRemoteEngineEnabled,
  };
}
