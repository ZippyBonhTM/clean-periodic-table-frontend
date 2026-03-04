import publicEnv from '@/shared/config/publicEnv';
import { requestJson } from './httpClient';
import type { ChemicalElement } from '@/shared/types/element';

async function listElements(token: string, signal?: AbortSignal): Promise<ChemicalElement[]> {
  return await requestJson<ChemicalElement[]>(publicEnv.backendApiUrl, '/elements', {
    method: 'GET',
    token,
    signal,
  });
}

export { listElements };
