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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 overscroll-contain"
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
        className={`surface-panel w-full max-w-xl rounded-3xl border border-[var(--border-subtle)] p-5 shadow-xl md:p-6 ${panelClassName}`.trim()}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">{title}</h2>
          <div className="flex items-center gap-2">
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

        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}

export default memo(FloatingModal);
