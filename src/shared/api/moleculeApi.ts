import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from '@/shared/api/httpClient';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

async function listSavedMolecules(token: string, signal?: AbortSignal): Promise<SavedMolecule[]> {
  return await requestJson<SavedMolecule[]>(publicEnv.backendApiUrl, '/molecules', {
    method: 'GET',
    token,
    signal,
  });
}

async function createSavedMolecule(token: string, input: SaveMoleculeInput): Promise<SavedMolecule> {
  return await requestJson<SavedMolecule>(publicEnv.backendApiUrl, '/molecules', {
    method: 'POST',
    token,
    body: input,
  });
}

async function updateSavedMolecule(token: string, moleculeId: string, input: SaveMoleculeInput): Promise<SavedMolecule> {
  return await requestJson<SavedMolecule>(publicEnv.backendApiUrl, `/molecules/${moleculeId}`, {
    method: 'PUT',
    token,
    body: input,
  });
}

async function deleteSavedMolecule(token: string, moleculeId: string): Promise<void> {
  await requestJson<null>(publicEnv.backendApiUrl, `/molecules/${moleculeId}`, {
    method: 'DELETE',
    token,
  });
}

export { createSavedMolecule, deleteSavedMolecule, listSavedMolecules, updateSavedMolecule };
