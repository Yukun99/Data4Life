import { ApiError, apiFetch, errorMessage } from '@/common/utils/api';
import mockFetch from '../../mock-fetch';

describe('apiFetch', () => {
  it('returns the parsed JSON body and sends JSON with same-origin credentials', async () => {
    const fetchMock = mockFetch({ 'POST /api/things': { status: 200, body: { id: 1 } } });

    const result = await apiFetch<{ id: number }>('/api/things', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });

    expect(result).toEqual({ id: 1 });
    const init = fetchMock.mock.calls[0][1];
    expect(init?.credentials).toBe('same-origin');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('returns undefined for an empty body', async () => {
    mockFetch({ 'POST /api/empty': { status: 204 } });
    await expect(apiFetch('/api/empty', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('throws ApiError with the backend message', async () => {
    mockFetch({ 'GET /api/fail': { status: 409, body: { message: 'Taken' } } });

    const request = apiFetch('/api/fail');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 409, message: 'Taken' });
  });

  it('falls back to a generic message when the body has none', async () => {
    mockFetch({});
    await expect(apiFetch('/api/missing')).rejects.toThrow('Request failed (404)');
  });
});

describe('errorMessage', () => {
  it('uses the ApiError message and hides other errors', () => {
    expect(errorMessage(new ApiError(400, 'Bad'))).toBe('Bad');
    expect(errorMessage(new TypeError('network'))).toBe('Something went wrong, please try again');
  });
});
