const DEFAULT_API_BASE_URL = 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    options: { status: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;
type QueryParams = Record<string, QueryValue>;

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null;
  query?: QueryParams;
}

function buildUrl(path: string, query?: QueryParams) {
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseJsonSafely(response: Response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return {
      message: rawBody,
    };
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const headers = new Headers(options.headers);
  const hasJsonBody =
    options.body !== null &&
    options.body !== undefined &&
    !(options.body instanceof FormData);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    credentials: 'include',
    headers,
    body:
      hasJsonBody && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === 'object' &&
        typeof payload.message === 'string' &&
        payload.message) ||
      response.statusText ||
      'Request failed';

    throw new ApiError(message, {
      status: response.status,
      code:
        payload && typeof payload === 'object' && typeof payload.code === 'string'
          ? payload.code
          : undefined,
      details: payload,
    });
  }

  return payload as T;
}

export const api = {
  get<T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'GET' });
  },
  post<T>(
    path: string,
    body?: ApiRequestOptions['body'],
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ) {
    return apiRequest<T>(path, { ...options, method: 'POST', body });
  },
  put<T>(
    path: string,
    body?: ApiRequestOptions['body'],
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ) {
    return apiRequest<T>(path, { ...options, method: 'PUT', body });
  },
  patch<T>(
    path: string,
    body?: ApiRequestOptions['body'],
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ) {
    return apiRequest<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'DELETE' });
  },
};
