import {
  deleteAllNotifications,
  deleteNotification,
  fetchMoreNotifications,
  fetchNotifications,
  fetchUnreadCount,
  markAllRead,
  markRead,
  Notification,
  received,
} from '@/store/notification-slice';
import { createStore } from '@/store/store';
import { deleteAccount, login, logout } from '@/store/user-slice';
import mockFetch from '../mock-fetch';
import { ada } from '../users';

const note = (id: number, read = false): Notification => ({
  id,
  type: 'AVAILABLE',
  isbn: `${id}${id}${id}`,
  title: `Book ${id}`,
  createdAt: '2026-09-27T00:00:00Z',
  read,
});

const loaded = async () => {
  mockFetch({
    'GET /api/notifications': { status: 200, body: { items: [note(3), note(2, true)], hasMore: true } },
    'GET /api/notifications/unread': { status: 200, body: { count: 1 } },
  });
  const store = createStore();
  await store.dispatch(fetchNotifications());
  await store.dispatch(fetchUnreadCount());
  return store;
};

describe('notification slice', () => {
  it('starts empty', () => {
    expect(createStore().getState().notifications).toEqual({
      items: [],
      hasMore: false,
      loading: false,
      error: '',
      unread: 0,
      lastReceivedId: null,
    });
  });

  it('fetchNotifications and fetchUnreadCount store the first page and the count', async () => {
    const store = await loaded();

    expect(store.getState().notifications).toMatchObject({
      items: [note(3), note(2, true)],
      hasMore: true,
      loading: false,
      unread: 1,
    });
  });

  it('fetchNotifications stores the error message on failure', async () => {
    mockFetch({ 'GET /api/notifications': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    await store.dispatch(fetchNotifications());

    expect(store.getState().notifications).toMatchObject({ error: 'Boom', loading: false });
  });

  it('fetchMoreNotifications asks for rows before the last id and skips duplicates', async () => {
    const store = await loaded();
    const fetchMock = mockFetch({
      'GET /api/notifications?before=2': {
        status: 200,
        body: { items: [note(2, true), note(1)], hasMore: false },
      },
    });

    const pending = store.dispatch(fetchMoreNotifications());
    expect(store.getState().notifications.loading).toBe(true);
    await pending;

    expect(fetchMock).toHaveBeenCalledWith('/api/notifications?before=2', expect.anything());
    expect(store.getState().notifications).toMatchObject({
      items: [note(3), note(2, true), note(1)],
      hasMore: false,
      loading: false,
    });
  });

  it('markRead marks one row and takes the count from the backend', async () => {
    const store = await loaded();
    const fetchMock = mockFetch({
      'POST /api/notifications/3/read': { status: 200, body: { count: 0 } },
    });

    await store.dispatch(markRead(3));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/3/read',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(store.getState().notifications.items[0].read).toBe(true);
    expect(store.getState().notifications.unread).toBe(0);
  });

  it('markAllRead marks every row', async () => {
    const store = await loaded();
    const fetchMock = mockFetch({
      'POST /api/notifications/read-all': { status: 200, body: { count: 0 } },
    });

    await store.dispatch(markAllRead());

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/read-all',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(store.getState().notifications.items.every(({ read }) => read)).toBe(true);
    expect(store.getState().notifications.unread).toBe(0);
  });

  it('deleteNotification removes one row', async () => {
    const store = await loaded();
    const fetchMock = mockFetch({
      'DELETE /api/notifications/3': { status: 200, body: { count: 0 } },
    });

    await store.dispatch(deleteNotification(3));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/3',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(store.getState().notifications.items).toEqual([note(2, true)]);
    expect(store.getState().notifications.unread).toBe(0);
  });

  it('deleteAllNotifications empties the list', async () => {
    const store = await loaded();
    const fetchMock = mockFetch({
      'DELETE /api/notifications': { status: 200, body: { count: 0 } },
    });

    await store.dispatch(deleteAllNotifications());

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(store.getState().notifications).toMatchObject({ items: [], hasMore: false, unread: 0 });
  });

  it('keeps the rows and stores the message when an action fails', async () => {
    const store = await loaded();
    mockFetch({
      'DELETE /api/notifications/3': { status: 404, body: { message: 'Notification not found' } },
    });

    const result = await store.dispatch(deleteNotification(3));

    expect(result.payload).toBe('Notification not found');
    expect(store.getState().notifications).toMatchObject({
      error: 'Notification not found',
      unread: 1,
    });
    expect(store.getState().notifications.items).toHaveLength(2);
  });

  it('received prepends a new row, counts it and records its id', async () => {
    const store = await loaded();

    store.dispatch(received(note(4)));

    expect(store.getState().notifications).toMatchObject({
      items: [note(4), note(3), note(2, true)],
      unread: 2,
      lastReceivedId: 4,
    });
  });

  it('received ignores a row it already has but still records the id', async () => {
    const store = await loaded();

    store.dispatch(received(note(3)));

    expect(store.getState().notifications.items).toHaveLength(2);
    expect(store.getState().notifications).toMatchObject({ unread: 1, lastReceivedId: 3 });
  });

  it('resets on login, logout and account deletion', async () => {
    const initial = createStore().getState().notifications;
    const actions = [
      login.fulfilled(ada, '', { email: ada.email, password: 'secret' }),
      logout.fulfilled(undefined, ''),
      deleteAccount.fulfilled(undefined, ''),
    ];

    for (const action of actions) {
      const store = await loaded();
      store.dispatch(received(note(4)));
      store.dispatch(action);
      expect(store.getState().notifications).toEqual(initial);
    }
  });
});
