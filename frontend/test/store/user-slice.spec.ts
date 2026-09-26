import { createStore } from '@/store/store';
import { deleteAccount, fetchMe, login, logout, updateProfile } from '@/store/user-slice';
import mockFetch from '../mock-fetch';
import { ada } from '../users';

describe('user slice', () => {
  it('starts loading with no user', () => {
    expect(createStore().getState().user).toEqual({ user: null, loading: true });
  });

  it('fetchMe stores the current user', async () => {
    mockFetch({ 'GET /api/auth/me': { status: 200, body: ada } });
    const store = createStore();

    await store.dispatch(fetchMe());

    expect(store.getState().user).toEqual({ user: ada, loading: false });
  });

  it('fetchMe clears the user on 401', async () => {
    mockFetch({ 'GET /api/auth/me': { status: 401 } });
    const store = createStore();

    await store.dispatch(fetchMe());

    expect(store.getState().user).toEqual({ user: null, loading: false });
  });

  it('login stores the user', async () => {
    mockFetch({ 'POST /api/auth/login': { status: 200, body: ada } });
    const store = createStore();

    await store.dispatch(login({ email: 'ada@example.com', password: 'secret123' })).unwrap();

    expect(store.getState().user.user).toEqual(ada);
  });

  it('login rejects with the backend message', async () => {
    mockFetch({
      'POST /api/auth/login': { status: 401, body: { message: 'Incorrect email or password' } },
    });
    const store = createStore();

    const result = await store.dispatch(login({ email: 'ada@example.com', password: 'nope' }));

    expect(result.payload).toBe('Incorrect email or password');
    expect(store.getState().user.user).toBeNull();
  });

  it('logout clears the user even when the request fails', async () => {
    mockFetch({ 'POST /api/auth/logout': { status: 500 } });
    const store = createStore({ user: { user: ada, loading: false } });

    await store.dispatch(logout());

    expect(store.getState().user.user).toBeNull();
  });

  it('deleteAccount clears the user on success and keeps it on failure', async () => {
    mockFetch({ 'DELETE /api/auth/me': { status: 403, body: { message: 'The root admin cannot be deleted' } } });
    const store = createStore({ user: { user: ada, loading: false } });
    const refused = await store.dispatch(deleteAccount());

    expect(refused.payload).toBe('The root admin cannot be deleted');
    expect(store.getState().user.user).toEqual(ada);

    mockFetch({ 'DELETE /api/auth/me': { status: 204 } });
    await store.dispatch(deleteAccount());

    expect(store.getState().user.user).toBeNull();
  });

  it('updateProfile replaces the user', async () => {
    const updated = { ...ada, name: 'Ada L', avatar: 'ROCKET' as const };
    mockFetch({ 'PUT /api/users/me': { status: 200, body: updated } });
    const store = createStore({ user: { user: ada, loading: false } });

    await store.dispatch(updateProfile({ name: 'Ada L', avatar: 'ROCKET' })).unwrap();

    expect(store.getState().user.user).toEqual(updated);
  });

  it('updateProfile rejects with the backend message and keeps the user', async () => {
    mockFetch({ 'PUT /api/users/me': { status: 400, body: { message: 'Invalid request' } } });
    const store = createStore({ user: { user: ada, loading: false } });

    const result = await store.dispatch(updateProfile({ name: 'Ada', avatar: 'STAR' }));

    expect(result.payload).toBe('Invalid request');
    expect(store.getState().user.user).toEqual(ada);
  });
});
