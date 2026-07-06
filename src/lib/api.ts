import axios, { AxiosError, AxiosRequestConfig } from 'axios';

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

export interface ApiRequestOptions extends Omit<AxiosRequestConfig, 'method' | 'url' | 'data' | 'params'> {
  body?: unknown;
  query?: QueryParams;
}

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, ''),
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((error: Error | null) => void)[] = [];

function onRefreshed(error: Error | null) {
  refreshSubscribers.forEach(callback => callback(error));
  refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Ignore refresh failures or requests to auth endpoints to avoid infinite loops
    if (error.response?.status === 401 && originalRequest && !originalRequest.url?.startsWith('/auth/')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await axios.post(
            `${axiosInstance.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          isRefreshing = false;
          onRefreshed(null);
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshed(refreshError instanceof Error ? refreshError : new Error('Refresh failed'));
          return Promise.reject(error); // Reject with original 401
        }
      }

      return new Promise((resolve, reject) => {
        refreshSubscribers.push((err: Error | null) => {
          if (err) {
            reject(error); // Reject with original 401 if refresh fails
          } else {
            resolve(axiosInstance(originalRequest));
          }
        });
      });
    }

    return Promise.reject(error);
  }
);

export async function apiRequest<T>(
  method: string,
  path: string,
  options: ApiRequestOptions = {},
) {
  try {
    // Clean query params (remove undefined, null, empty string)
    let cleanedQuery: Record<string, Primitive> | undefined;
    if (options.query) {
      cleanedQuery = Object.fromEntries(
        Object.entries(options.query).filter(
          ([_, v]) => v !== undefined && v !== null && v !== ''
        )
      ) as Record<string, Primitive>;
    }

    const requestConfig: AxiosRequestConfig = {
      url: path,
      method,
      data: options.body,
      params: cleanedQuery,
      ...options,
    };

    // Explicitly set Content-Type for JSON objects, but leave it unset for FormData
    if (
      options.body &&
      typeof options.body === 'object' &&
      !(options.body instanceof FormData) &&
      !requestConfig.headers?.['Content-Type']
    ) {
      requestConfig.headers = {
        ...requestConfig.headers,
        'Content-Type': 'application/json',
      };
    }

    const response = await axiosInstance.request<T>(requestConfig);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const payload = error.response.data as Record<string, any>;
      const message =
        (payload && typeof payload === 'object' && typeof payload.message === 'string' && payload.message) ||
        error.response.statusText ||
        'Request failed';

      throw new ApiError(message, {
        status: error.response.status,
        code: payload && typeof payload === 'object' && typeof payload.code === 'string' ? payload.code : undefined,
        details: payload,
      });
    }
    
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', {
      status: 500,
    });
  }
}

export const api = {
  get<T>(path: string, options?: Omit<ApiRequestOptions, 'body'>) {
    return apiRequest<T>('GET', path, options);
  },
  post<T>(
    path: string,
    body?: ApiRequestOptions['body'],
    options?: Omit<ApiRequestOptions, 'body'>,
  ) {
    return apiRequest<T>('POST', path, { ...options, body });
  },
  put<T>(
    path: string,
    body?: ApiRequestOptions['body'],
    options?: Omit<ApiRequestOptions, 'body'>,
  ) {
    return apiRequest<T>('PUT', path, { ...options, body });
  },
  patch<T>(
    path: string,
    body?: ApiRequestOptions['body'],
    options?: Omit<ApiRequestOptions, 'body'>,
  ) {
    return apiRequest<T>('PATCH', path, { ...options, body });
  },
  delete<T>(path: string, options?: Omit<ApiRequestOptions, 'body'>) {
    return apiRequest<T>('DELETE', path, options);
  },
};
