'use client';

export const SEARCH_DEBOUNCE_MS = 420;

export function mapImportErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
    return caughtError.message;
  }

  return 'Could not load this molecule from PubChem.';
}
