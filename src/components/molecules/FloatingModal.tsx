'use client';

import { memo, useEffect } from 'react';

type FloatingModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
};

function FloatingModal({
  isOpen,
  title,
  onClose,
  children,
  panelClassName = '',
  bodyClassName = '',
}: FloatingModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscapeKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onEscapeKeyDown);

    return () => {
      window.removeEventListener('keydown', onEscapeKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`surface-panel w-full max-w-xl rounded-3xl border border-[var(--border-subtle)] p-5 shadow-2xl md:p-6 ${panelClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
          >
            Close
          </button>
        </div>

        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}

export default memo(FloatingModal);
