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

import { clearElementsCache, listElements } from '@/shared/api/backendApi';
import { requestJson } from '@/shared/api/httpClient';

const mockedRequestJson = vi.mocked(requestJson);

describe('backendApi', () => {
  afterEach(() => {
    clearElementsCache();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads protected elements through the local BFF route', async () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
      },
    });

    mockedRequestJson.mockResolvedValueOnce([
      {
        number: 1,
        symbol: 'H',
        name: 'Hydrogen',
      },
    ] as never);

    const response = await listElements('token-1');

    expect(response).toEqual([
      {
        number: 1,
        symbol: 'H',
        name: 'Hydrogen',
      },
    ]);
    expect(mockedRequestJson).toHaveBeenCalledWith(
      'http://localhost:3000',
      '/api/elements',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
    const requestOptions = mockedRequestJson.mock.calls[0]?.[2];
    expect(requestOptions?.token).toBeUndefined();
  });
});
