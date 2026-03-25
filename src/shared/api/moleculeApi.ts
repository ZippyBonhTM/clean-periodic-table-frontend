import { requestJson } from '@/shared/api/httpClient';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

function resolveMoleculeRequestBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

async function listSavedMolecules(
  token?: string | null,
  signal?: AbortSignal,
): Promise<SavedMolecule[]> {
  return await requestJson<SavedMolecule[]>(resolveMoleculeRequestBaseUrl(), '/api/molecules', {
    method: 'GET',
    token,
    credentials: 'include',
    signal,
  });
}

async function createSavedMolecule(
  token: string | null | undefined,
  input: SaveMoleculeInput,
): Promise<SavedMolecule> {
  return await requestJson<SavedMolecule>(resolveMoleculeRequestBaseUrl(), '/api/molecules', {
    method: 'POST',
    token,
    body: input,
    credentials: 'include',
  });
}

async function updateSavedMolecule(
  token: string | null | undefined,
  moleculeId: string,
  input: SaveMoleculeInput,
): Promise<SavedMolecule> {
  return await requestJson<SavedMolecule>(
    resolveMoleculeRequestBaseUrl(),
    `/api/molecules/${moleculeId}`,
    {
    method: 'PUT',
    token,
    body: input,
      credentials: 'include',
    },
  );
}

async function deleteSavedMolecule(
  token: string | null | undefined,
  moleculeId: string,
): Promise<void> {
  await requestJson<null>(resolveMoleculeRequestBaseUrl(), `/api/molecules/${moleculeId}`, {
    method: 'DELETE',
    token,
    credentials: 'include',
  });
}

export { createSavedMolecule, deleteSavedMolecule, listSavedMolecules, updateSavedMolecule };
