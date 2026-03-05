type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type HttpRequestInput = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  keepalive?: boolean;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  error?: {
    message?: string;
    code?: string;
  };
};

class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string | null;

  constructor(message: string, statusCode: number, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function resolveErrorPayload(payload: unknown): { message: string; code: string | null } {
  if (payload !== null && typeof payload === 'object') {
    const typedPayload = payload as ApiErrorPayload;

    const nestedMessage = typedPayload.error?.message;
    const nestedCode = typedPayload.error?.code;

    if (nestedMessage !== undefined) {
      return {
        message: nestedMessage,
        code: nestedCode ?? null,
      };
    }

    if (typedPayload.message !== undefined) {
      return {
        message: typedPayload.message,
        code: typedPayload.code ?? null,
      };
    }
  }

  return {
    message: 'Request failed.',
    code: null,
  };
}

async function requestJson<ResponseType>(
  baseUrl: string,
  path: string,
  input: HttpRequestInput = {},
): Promise<ResponseType> {
  const url = new URL(path, baseUrl);
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (input.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (input.token !== undefined && input.token !== null) {
    headers.set('Authorization', `Bearer ${input.token}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: input.method ?? 'GET',
      headers,
      body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
      signal: input.signal,
      credentials: input.credentials,
      keepalive: input.keepalive,
    });
  } catch (caughtError: unknown) {
    const fallbackMessage = `Network error while calling ${url.origin}. Check if service is up, URL is correct, and CORS allows your frontend origin.`;

    if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
      throw new ApiError(`${fallbackMessage} (${caughtError.message})`, 0, 'NETWORK_ERROR');
    }

    throw new ApiError(fallbackMessage, 0, 'NETWORK_ERROR');
  }

  const payload = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const { message, code } = resolveErrorPayload(payload);
    throw new ApiError(message, response.status, code);
  }

  return payload as ResponseType;
}

export { ApiError, requestJson };
export type { HttpRequestInput };
