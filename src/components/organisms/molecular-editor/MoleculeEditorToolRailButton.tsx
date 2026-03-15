'use client';

import type { ReactNode } from 'react';

type MoleculeEditorToolRailButtonProps = {
  icon: ReactNode;
  label: string;
  title?: string;
  collapsed: boolean;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function MoleculeEditorToolRailButton({
  icon,
  label,
  title,
  collapsed,
  active = false,
  danger = false,
  disabled = false,
  onClick,
}: MoleculeEditorToolRailButtonProps) {
  const stateClassName = danger
    ? 'border-rose-500/55 bg-rose-500/10 text-rose-200 hover:bg-rose-500/18'
    : active
      ? 'border-(--accent) bg-(--accent)/24 text-foreground'
      : 'border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) hover:border-(--accent) hover:text-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`inline-flex items-center border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${stateClassName} ${
        collapsed
          ? 'mx-auto h-9 w-9 justify-center rounded-xl px-0'
          : 'h-9 w-full justify-start gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {collapsed ? null : <span>{label}</span>}
    </button>
  );
}
