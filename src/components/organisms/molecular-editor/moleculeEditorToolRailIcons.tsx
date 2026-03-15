'use client';

export function RailToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3.5h10" />
      <path d="M3 8h10" />
      <path d="M3 12.5h10" />
      {collapsed ? <path d="m7 5 3 3-3 3" /> : <path d="m9 5-3 3 3 3" />}
    </svg>
  );
}

export function AddAtomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" />
      <path d="M8 3v10" />
      <path d="M3 8h10" />
    </svg>
  );
}

export function RemoveAtomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.5 4.5h9" />
      <path d="M6 4.5V3.2h4V4.5" />
      <path d="M5.1 6.2 5.6 12h4.8l.5-5.8" />
      <path d="M7 7.2v3.4" />
      <path d="M9 7.2v3.4" />
    </svg>
  );
}

export function ClearSelectionIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="4.5" />
      <path d="m5.2 5.2 5.6 5.6" />
    </svg>
  );
}

export function ResetEditorIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.5 8a4.5 4.5 0 1 0 1.1-3" />
      <path d="M3.5 3.7v2.5H6" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M6.4 4.2 3.8 6.8l2.6 2.6" />
      <path d="M4.1 6.8h4.4a3.4 3.4 0 1 1 0 6.8H6.8" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m9.6 4.2 2.6 2.6-2.6 2.6" />
      <path d="M11.9 6.8H7.5a3.4 3.4 0 1 0 0 6.8h1.7" />
    </svg>
  );
}

export function BondOrderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="4" cy="8" r="1.2" />
      <circle cx="12" cy="8" r="1.2" />
      <path d="M5.5 6.5h5" />
      <path d="M5.5 8h5" />
      <path d="M5.5 9.5h5" />
    </svg>
  );
}

export function SaveGalleryIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3.2 2.8h7.1l2.5 2.4v8H3.2z" />
      <path d="M5.2 2.8v3.3h4.6V2.8" />
      <path d="M5.3 10.3h5.4" />
      <path d="M5.3 12.2h4" />
    </svg>
  );
}
