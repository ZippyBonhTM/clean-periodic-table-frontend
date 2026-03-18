'use client';

import { memo, useEffect, useRef } from 'react';

import useAppLocale from '@/shared/i18n/useAppLocale';

type FloatingModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
  headerActions?: React.ReactNode;
  closeLabel?: string;
};

function FloatingModal({
  isOpen,
  title,
  onClose,
  children,
  panelClassName = '',
  bodyClassName = '',
  headerActions,
  closeLabel,
}: FloatingModalProps) {
  const { locale } = useAppLocale();
  const didPointerStartOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);
  const modalHistoryKeyRef = useRef<string | null>(null);
  const isClosingThroughHistoryRef = useRef(false);
  const wasOpenRef = useRef(false);
  const resolvedPanelClassName =
    panelClassName.trim().length > 0 ? panelClassName : 'max-w-xl';
  const resolvedCloseLabel = closeLabel ?? (locale === 'pt-BR' ? 'Fechar' : 'Close');

  const requestClose = () => {
    const modalHistoryKey = modalHistoryKeyRef.current;

    if (modalHistoryKey === null) {
      onCloseRef.current();
      return;
    }

    const currentHistoryState = window.history.state;
    const historyModalKey =
      currentHistoryState !== null && typeof currentHistoryState === 'object'
        ? (currentHistoryState as Record<string, unknown>).__modalKey
        : undefined;

    if (typeof historyModalKey === 'string' && historyModalKey === modalHistoryKey) {
      isClosingThroughHistoryRef.current = true;
      window.history.back();
      return;
    }

    modalHistoryKeyRef.current = null;
    onCloseRef.current();
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (modalHistoryKeyRef.current === null) {
      const modalHistoryKey = `clean-periodic-table-modal-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      const currentHistoryState = window.history.state;
      const nextHistoryState =
        currentHistoryState !== null && typeof currentHistoryState === 'object'
          ? { ...(currentHistoryState as Record<string, unknown>), __modalKey: modalHistoryKey }
          : { __modalKey: modalHistoryKey };

      modalHistoryKeyRef.current = modalHistoryKey;
      window.history.pushState(nextHistoryState, '', window.location.href);
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${String(scrollbarWidth)}px`;
    }

    const onEscapeKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };

    const onPopState = () => {
      if (modalHistoryKeyRef.current === null) {
        return;
      }

      isClosingThroughHistoryRef.current = true;
      modalHistoryKeyRef.current = null;
      onCloseRef.current();
    };

    window.addEventListener('keydown', onEscapeKeyDown);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('keydown', onEscapeKeyDown);
      window.removeEventListener('popstate', onPopState);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!wasOpenRef.current && isOpen) {
      wasOpenRef.current = true;
      return;
    }

    if (wasOpenRef.current && !isOpen) {
      wasOpenRef.current = false;

      if (modalHistoryKeyRef.current !== null) {
        const currentHistoryState = window.history.state;
        const historyModalKey =
          currentHistoryState !== null && typeof currentHistoryState === 'object'
            ? (currentHistoryState as Record<string, unknown>).__modalKey
            : undefined;

        const shouldPopHistory =
          !isClosingThroughHistoryRef.current &&
          typeof historyModalKey === 'string' &&
          historyModalKey === modalHistoryKeyRef.current;

        modalHistoryKeyRef.current = null;

        if (shouldPopHistory) {
          window.history.back();
          return;
        }
      }

      if (isClosingThroughHistoryRef.current) {
        isClosingThroughHistoryRef.current = false;
      }
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="floating-modal-overlay fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/72 overscroll-contain sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onPointerDown={(event) => {
        didPointerStartOnBackdrop.current = event.target === event.currentTarget;
      }}
      onPointerUp={(event) => {
        const endedOnBackdrop = event.target === event.currentTarget;

        if (didPointerStartOnBackdrop.current && endedOnBackdrop) {
          requestClose();
        }

        didPointerStartOnBackdrop.current = false;
      }}
      onPointerCancel={() => {
        didPointerStartOnBackdrop.current = false;
      }}
    >
      <div
        className={`floating-modal__panel surface-panel w-full rounded-3xl border border-[var(--border-subtle)] p-4 shadow-xl sm:p-5 md:p-6 ${resolvedPanelClassName}`.trim()}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3 sm:mb-4">
          <h2 className="pr-2 text-lg font-semibold leading-tight text-[var(--text-strong)] sm:text-xl">{title}</h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {headerActions}
            <button
            type="button"
            onClick={requestClose}
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
          >
            {resolvedCloseLabel}
          </button>
        </div>
        </div>

        <div className={`floating-modal__body ${bodyClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}

export default memo(FloatingModal);
