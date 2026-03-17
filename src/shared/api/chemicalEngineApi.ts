import publicEnv from '@/shared/config/publicEnv';
import type {
  CreateChemicalEngineReactionAnalyzer,
  ChemicalEngineAnalyzeReactionResponse,
  MapChemicalEngineApiError,
} from '@/shared/api/chemicalEngineApi.types';
import { ApiError, requestJson } from '@/shared/api/httpClient';

const DEFAULT_CHEMICAL_ENGINE_ANALYZE_PATH = '/chemical/reactions/analyze';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidNotice(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    (value.level === 'info' || value.level === 'warning') &&
    typeof value.code === 'string' &&
    value.code.trim().length > 0 &&
    typeof value.message === 'string' &&
    value.message.trim().length > 0
  );
}

function isValidMetadataValue(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function normalizeChemicalEngineResponse(
  value: unknown,
): ChemicalEngineAnalyzeReactionResponse | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (
    value.valid !== undefined &&
    value.valid !== null &&
    typeof value.valid !== 'boolean'
  ) {
    return null;
  }

  if (
    value.classification !== undefined &&
    value.classification !== null &&
    typeof value.classification !== 'string'
  ) {
    return null;
  }

  if (
    value.score !== undefined &&
    value.score !== null &&
    typeof value.score !== 'number'
  ) {
    return null;
  }

  if (value.notices !== undefined && !Array.isArray(value.notices)) {
    return null;
  }

  if (Array.isArray(value.notices) && !value.notices.every(isValidNotice)) {
    return null;
  }

  if (value.metadata !== undefined && value.metadata !== null) {
    if (!isPlainObject(value.metadata)) {
      return null;
    }

    if (!Object.values(value.metadata).every(isValidMetadataValue)) {
      return null;
    }
  }

  const metadata = isPlainObject(value.metadata)
    ? (Object.fromEntries(
        Object.entries(value.metadata).filter(([, metadataValue]) =>
          isValidMetadataValue(metadataValue),
        ),
      ) as Record<string, boolean | number | string | null>)
    : undefined;

  return {
    valid: typeof value.valid === 'boolean' ? value.valid : null,
    classification:
      typeof value.classification === 'string' ? value.classification : null,
    score: typeof value.score === 'number' ? value.score : null,
    notices: Array.isArray(value.notices)
      ? value.notices.map((notice) => ({
          level: notice.level,
          code: notice.code,
          message: notice.message,
        }))
      : [],
    metadata,
  };
}

const mapChemicalEngineApiError: MapChemicalEngineApiError = (error) => {
  if (error instanceof ApiError && error.statusCode === 0) {
    return {
      ok: false,
      code: 'network-error',
      message: error.message,
    };
  }

  if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
    return {
      ok: false,
      code: 'unauthorized',
      message: error.message,
    };
  }

  if (error instanceof ApiError && error.statusCode === 503) {
    return {
      ok: false,
      code: 'unavailable',
      message: error.message,
    };
  }

  if (error instanceof ApiError) {
    return {
      ok: false,
      code: 'unknown-error',
      message: error.message,
    };
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return {
      ok: false,
      code: 'unknown-error',
      message: error.message,
    };
  }

  return {
    ok: false,
    code: 'unknown-error',
    message: 'The optional chemical engine request failed.',
  };
};

export const createChemicalEngineReactionAnalyzer: CreateChemicalEngineReactionAnalyzer =
  (options = {}) =>
  async (input) => {
    try {
      const response = await requestJson<unknown>(
        publicEnv.backendApiUrl,
        options.path ?? DEFAULT_CHEMICAL_ENGINE_ANALYZE_PATH,
        {
          method: 'POST',
          body: input,
          token: options.token,
          signal: options.signal,
        },
      );

      const normalizedResponse = normalizeChemicalEngineResponse(response);

      if (normalizedResponse === null) {
        return {
          ok: false,
          code: 'invalid-response',
          message: 'Chemical engine returned an invalid analysis payload.',
        };
      }

      return {
        ok: true,
        value: normalizedResponse,
      };
    } catch (error: unknown) {
      return mapChemicalEngineApiError(error);
    }
  };

export { mapChemicalEngineApiError };
