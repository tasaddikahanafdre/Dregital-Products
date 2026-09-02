const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/+$/, '') ?? 'https://dregital-products.onrender.com/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  /** Skip the default JSON content-type (used for FormData uploads). */
  formData?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { formData, ...rest } = options;

  const headers: HeadersInit =
    formData || !rest.body ? (rest.headers ?? {}) : { 'Content-Type': 'application/json', ...(rest.headers ?? {}) };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
      credentials: 'include', // send/accept the admin session cookie
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection.');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    const details = (body as { details?: unknown } | null)?.details;
    throw new ApiError(res.status, message, details);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData, formData: true }),
};

export default API_URL;
