'use client';

import { memo, useEffect, useRef } from 'react';

type FloatingModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
  headerActions?: React.ReactNode;
};

function FloatingModal({
  isOpen,
  title,
  onClose,
  children,
  panelClassName = '',
  bodyClassName = '',
  headerActions,
}: FloatingModalProps) {
  const didPointerStartOnBackdrop = useRef(false);
  const resolvedPanelClassName =
    panelClassName.trim().length > 0 ? panelClassName : 'max-w-xl';

  useEffect(() => {
    if (!isOpen) {
      return;
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
        onClose();
      }
    };

    window.addEventListener('keydown', onEscapeKeyDown);

    return () => {
      window.removeEventListener('keydown', onEscapeKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen, onClose]);

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
          onClose();
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
              onClick={onClose}
              className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
            >
              Close
            </button>
          </div>
        </div>

        <div className={`floating-modal__body ${bodyClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}

export default memo(FloatingModal);
