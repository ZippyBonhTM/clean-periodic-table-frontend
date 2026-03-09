'use client';

import { memo, useEffect, useRef, useState } from 'react';

import AppFooter from '@/components/shared/footer/AppFooter';
import AppHeader from '@/components/shared/header/AppHeader';
import type { AuthEntryMode } from '@/components/shared/header/AppHeader';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import useTheme from '@/shared/hooks/useTheme';

type AppShellProps = {
  children: React.ReactNode;
  hasToken: boolean;
  authStatus: TokenStatusType;
  onLogout?: () => void;
  authEntryMode?: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
  showFooter?: boolean;
  viewportMain?: boolean;
};

function AppShell({
  children,
  hasToken,
  authStatus,
  onLogout,
  authEntryMode = 'route',
  onRequestLogin,
  onRequestRegister,
  showFooter = true,
  viewportMain = false,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [viewportMainHeight, setViewportMainHeight] = useState<number | null>(null);
  const [viewportMainGutter, setViewportMainGutter] = useState<number | null>(null);
  const shellClassName = showFooter
    ? 'mx-auto flex min-h-screen w-full max-w-[var(--app-max-width)] flex-col gap-4 px-[var(--app-inline-padding)] py-5 md:py-8'
    : viewportMain
      ? 'app-shell-viewport mx-auto flex w-full max-w-[var(--app-max-width)] flex-col px-[var(--app-inline-padding)]'
      : 'mx-auto flex min-h-screen w-full max-w-[var(--app-max-width)] flex-col gap-4 px-[var(--app-inline-padding)] py-5 md:py-8';
  const mainClassName = !showFooter && !viewportMain ? 'flex-1' : 'flex-1 min-h-0';

  useEffect(() => {
    if (!viewportMain) {
      return;
    }

    let frameId = 0;

    const syncViewportMainHeight = () => {
      frameId = 0;
      const viewportHeight = window.innerHeight;
      const shellStyle = shellRef.current === null ? null : window.getComputedStyle(shellRef.current);
      const shellPaddingBottom = shellStyle === null ? 0 : Number.parseFloat(shellStyle.paddingBottom) || 0;
      const nextHeight = Math.max(320, Math.round(viewportHeight - shellPaddingBottom));
      const activeElement = document.activeElement;
      const isEditableFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable);

      setViewportMainGutter((currentGutter) =>
        currentGutter === shellPaddingBottom ? currentGutter : shellPaddingBottom,
      );

      setViewportMainHeight((currentHeight) => {
        // Ignore keyboard-driven visualViewport shrink while an editable field is focused.
        if (isEditableFocused && currentHeight !== null && nextHeight < currentHeight) {
          return currentHeight;
        }

        return currentHeight === nextHeight ? currentHeight : nextHeight;
      });
    };

    const scheduleViewportMainSync = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(syncViewportMainHeight);
    };

    scheduleViewportMainSync();
    window.addEventListener('resize', scheduleViewportMainSync);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', scheduleViewportMainSync);
    };
  }, [viewportMain]);

  const mainStyle =
    viewportMain && viewportMainHeight !== null
      ? {
          ['--app-viewport-main-height' as string]: `${viewportMainHeight}px`,
          ['--app-viewport-main-gutter' as string]: `${viewportMainGutter ?? 0}px`,
          minHeight: `${viewportMainHeight}px`,
          height: `${viewportMainHeight}px`,
        }
      : undefined;

  return (
    <div ref={shellRef} className={shellClassName}>
      <div className={viewportMain ? 'mb-3 md:mb-4' : undefined}>
        <AppHeader
          hasToken={hasToken}
          authStatus={authStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={onLogout}
          authEntryMode={authEntryMode}
          onRequestLogin={onRequestLogin}
          onRequestRegister={onRequestRegister}
        />
      </div>
      <main className={mainClassName} style={mainStyle}>
        {children}
      </main>
      {showFooter ? <AppFooter /> : null}
    </div>
  );
}

export default memo(AppShell);
