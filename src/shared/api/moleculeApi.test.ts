import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/httpClient', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api/httpClient')>(
    '@/shared/api/httpClient',
  );

  return {
    ...actual,
    requestJson: vi.fn(),
  };
});

import {
  createSavedMolecule,
  deleteSavedMolecule,
  listSavedMolecules,
  updateSavedMolecule,
} from '@/shared/api/moleculeApi';
import { requestJson } from '@/shared/api/httpClient';

const mockedRequestJson = vi.mocked(requestJson);

describe('moleculeApi', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls the local BFF molecule routes from the browser origin', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedRequestJson.mockResolvedValueOnce([]);
    mockedRequestJson.mockResolvedValueOnce({
      id: 'mol-1',
    } as never);
    mockedRequestJson.mockResolvedValueOnce({
      id: 'mol-1',
    } as never);
    mockedRequestJson.mockResolvedValueOnce(null as never);

    await listSavedMolecules('token-1');
    await createSavedMolecule('token-1', {
      name: 'Water',
      educationalDescription: null,
      molecule: {
        atoms: [],
        bonds: [],
      },
      editorState: {
        selectedAtomId: null,
        activeView: 'editor',
        bondOrder: 'single',
        canvasViewport: {
          offsetX: 0,
          offsetY: 0,
          scale: 1,
        },
      },
    });
    await updateSavedMolecule('token-1', 'mol-1', {
      name: 'Water',
      educationalDescription: null,
      molecule: {
        atoms: [],
        bonds: [],
      },
      editorState: {
        selectedAtomId: null,
        activeView: 'editor',
        bondOrder: 'single',
        canvasViewport: {
          offsetX: 0,
          offsetY: 0,
          scale: 1,
        },
      },
    });
    await deleteSavedMolecule('token-1', 'mol-1');

    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000',
      '/api/molecules',
      expect.objectContaining({
        method: 'GET',
        token: 'token-1',
        credentials: 'include',
      }),
    );
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000',
      '/api/molecules',
      expect.objectContaining({
        method: 'POST',
        token: 'token-1',
        credentials: 'include',
      }),
    );
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000',
      '/api/molecules/mol-1',
      expect.objectContaining({
        method: 'PUT',
        token: 'token-1',
        credentials: 'include',
      }),
    );
    expect(mockedRequestJson).toHaveBeenNthCalledWith(
      4,
      'http://localhost:3000',
      '/api/molecules/mol-1',
      expect.objectContaining({
        method: 'DELETE',
        token: 'token-1',
        credentials: 'include',
      }),
    );
  });
});
