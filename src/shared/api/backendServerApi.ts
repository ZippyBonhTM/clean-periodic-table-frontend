import publicEnv from '@/shared/config/publicEnv';
import type { ChemicalElement } from '@/shared/types/element';

type ListPublicElementsResult = {
  elements: ChemicalElement[] | null;
  isPubliclyAvailable: boolean;
};

const ELEMENTS_SERVER_REVALIDATE_SECONDS = 60 * 60 * 6;

export async function listPublicElementsServer(): Promise<ListPublicElementsResult> {
  try {
    const url = new URL('/elements', publicEnv.backendApiUrl);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: ELEMENTS_SERVER_REVALIDATE_SECONDS,
      },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        elements: null,
        isPubliclyAvailable: false,
      };
    }

    if (!response.ok) {
      return {
        elements: null,
        isPubliclyAvailable: false,
      };
    }

    const elements = (await response.json()) as ChemicalElement[];

    return {
      elements,
      isPubliclyAvailable: true,
    };
  } catch {
    return {
      elements: null,
      isPubliclyAvailable: false,
    };
  }
}
