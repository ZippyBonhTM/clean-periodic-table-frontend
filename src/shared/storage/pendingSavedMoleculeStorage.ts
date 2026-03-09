const PENDING_SAVED_MOLECULE_KEY = 'clean-periodic-table:pending-saved-molecule-id';

function writePendingSavedMoleculeId(moleculeId: string): void {
  window.sessionStorage.setItem(PENDING_SAVED_MOLECULE_KEY, moleculeId);
}

function readPendingSavedMoleculeId(): string | null {
  return window.sessionStorage.getItem(PENDING_SAVED_MOLECULE_KEY);
}

function clearPendingSavedMoleculeId(): void {
  window.sessionStorage.removeItem(PENDING_SAVED_MOLECULE_KEY);
}

export { clearPendingSavedMoleculeId, readPendingSavedMoleculeId, writePendingSavedMoleculeId };
