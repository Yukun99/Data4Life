export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Calls the backend with JSON in and out; throws ApiError with the backend's message on failure. */
export const apiFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? `Request failed (${response.status})`);
  }
  return data as T;
};

/** Turns any thrown value into a message fit to show the user. */
export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong, please try again';
