import { createStore } from '@/store/store';
import { fetchMe, login, logout } from '@/store/user-slice';
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
});
