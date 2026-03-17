'use client';

import { usePathname, useRouter } from 'next/navigation';

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
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';
import useChemistryBalanceWorkspaceState from '@/components/templates/useChemistryBalanceWorkspaceState';
import { buildBalanceEquationPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

export default function ChemistryBalanceWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, text } = useChemistryBalanceText();
  const {
    shell,
    equationInput,
    setEquationInput,
    result,
    analysis,
    metadataStatus,
    historyEntries,
    clearHistory,
    remoteAnalysis,
    isRemoteEngineEnabled,
    canRetryRemote,
    applyEquationInput,
    handleBalanceLocally,
    handleClear,
    handleToggleRemoteEngine,
    triggerRemoteAnalysis,
  } = useChemistryBalanceWorkspaceState();

  const handleLocaleChange = (nextLocale: AppLocale) => {
    setLocale(nextLocale);

    const nextPath = buildBalanceEquationPath(nextLocale);

    if (pathname !== nextPath) {
      router.replace(nextPath);
    }
  };

  return (
    <AppShell
      hasToken={shell.hasToken}
      authStatus={shell.authStatus}
      onLogout={shell.onLogout}
      showFooter={false}
    >
      <section className="space-y-5">
        <Panel className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {text.workspace.eyebrow}
                </p>
                <h1 className="text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
                  {text.workspace.title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
                  {text.workspace.description}
                </p>
              </div>

              <label className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <span>{text.locale.label}</span>
                <select
                  value={locale}
                  onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-[11px] font-semibold normal-case text-[var(--text-strong)] outline-none"
                >
                  <option value="en-US">{text.locale.options['en-US']}</option>
                  <option value="pt-BR">{text.locale.options['pt-BR']}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="equation-input"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              {text.workspace.equationLabel}
            </label>
            <textarea
              id="equation-input"
              value={equationInput}
              onChange={(event) => setEquationInput(event.target.value)}
              placeholder={text.workspace.equationPlaceholder}
              rows={4}
              className="min-h-28 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)] sm:text-base"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleBalanceLocally}>{text.workspace.submit}</Button>
            <Button variant="ghost" onClick={handleClear}>{text.workspace.clear}</Button>
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
              canRetry={canRetryRemote}
              onRetry={triggerRemoteAnalysis}
              onToggle={handleToggleRemoteEngine}
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
