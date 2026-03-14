'use client';

import { createPortal } from 'react-dom';

import Button from '@/components/atoms/Button';

import type { FloatingMenuPosition, PeriodicMenuOption } from './periodicTable.types';

type PeriodicTableOptionMenuProps = {
  isOpen: boolean;
  position: FloatingMenuPosition | null;
  ariaLabel: string;
  options: PeriodicMenuOption[];
  selectedMode: string;
  onClose: () => void;
  onSelect: (mode: string) => void;
  zIndexClassName?: string;
};

export default function PeriodicTableOptionMenu({
  isOpen,
  position,
  ariaLabel,
  options,
  selectedMode,
  onClose,
  onSelect,
  zIndexClassName = 'z-[70]',
}: PeriodicTableOptionMenuProps) {
  if (!isOpen || position === null || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName}`} onClick={onClose} aria-hidden="true">
      <div className="absolute inset-0 bg-transparent" />
      <div
        className="absolute origin-top-left rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 shadow-lg animate-[rise-fade_180ms_ease-out]"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
        }}
        onClick={(event) => event.stopPropagation()}
        role="menu"
        aria-label={ariaLabel}
      >
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <Button
              key={option.mode}
              type="button"
              variant={option.mode === selectedMode ? 'secondary' : 'ghost'}
              size="sm"
              align="left"
              onClick={() => onSelect(option.mode)}
              className="w-full"
              role="menuitem"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
