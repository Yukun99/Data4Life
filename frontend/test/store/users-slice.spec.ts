import { Loan } from '@/common/types';
import { createStore } from '@/store/store';
import {
  clearFines,
  DEFAULT_USER_COLUMN_WIDTHS,
  deleteUser,
  demoteUser,
  EMPTY_USER_FILTER,
  fetchFines,
  fetchUserColumnWidths,
  fetchUsers,
  forgiveFine,
  promoteUser,
  saveUserColumnWidths,
  setFilter,
  toggleSort,
} from '@/store/users-slice';
import mockFetch from '../mock-fetch';

const ada = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  createdAt: '2026-01-15T00:00:00Z',
  admin: false,
  totalBorrows: 3,
  currentBorrows: 1,
  totalFines: 8,
  currentFines: 6,
  demotable: false,
  deletable: true,
};

const filters = {
  name: ['Ada'],
  email: ['ada@example.com'],
  admin: [false],
  totalBorrows: [3],
  currentBorrows: [1],
  totalFines: [8],
  currentFines: [6],
};

const loan: Loan = {
  id: 4,
  isbn: '9780000000004',
  title: 'Book 4',
  author: 'Author',
  genre: 'Fantasy',
  borrowedAt: '2026-01-01T00:00:00Z',
  dueAt: '2026-01-15T00:00:00Z',
  reservedAt: null,
  reservedUntil: null,
  returnedAt: '2026-01-21T00:00:00Z',
  status: 'UNPAID',
  overdueDays: 6,
  fine: 6,
  fee: 0,
};

const widths = { nameEmail: 40, admin: 10, joined: 10, borrows: 15, fines: 15, actions: 10 };

describe('users slice', () => {
  it('starts empty on page 0 with the default widths', () => {
    expect(createStore().getState().users).toEqual({
      users: [],
      page: 0,
      size: 10,
      sort: null,
      filter: EMPTY_USER_FILTER,
      totalPages: 0,
      total: 0,
      filters: null,
      loading: false,
      error: '',
      columnWidths: DEFAULT_USER_COLUMN_WIDTHS,
      fines: [],
      finesLoading: false,
      finesError: '',
      forgivingId: null,
      changingId: null,
    });
  });

  it('fetchUsers sends sort and filters in a fixed order and stores the page', async () => {
    const fetchMock = mockFetch({
      'GET /api/admin/users?page=0&size=10&sort=currentFines&dir=asc&admin=false&totalFines=8': {
        status: 200,
        body: { users: [ada], page: 0, totalPages: 1, total: 1, filters },
      },
    });
    const store = createStore();

    store.dispatch(toggleSort('currentFines'));
    store.dispatch(setFilter({ ...EMPTY_USER_FILTER, totalFines: '8', admin: 'false' }));
    await store.dispatch(fetchUsers());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getState().users).toMatchObject({
      users: [ada],
      totalPages: 1,
      total: 1,
      filters,
      loading: false,
    });
  });

  it('fetchUsers stores the error message on failure', async () => {
    mockFetch({ 'GET /api/admin/users?page=0&size=10': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    await store.dispatch(fetchUsers());

    expect(store.getState().users).toMatchObject({ error: 'Boom', loading: false });
  });

  it('promoteUser tracks the changing id and posts to the promote route', async () => {
    const fetchMock = mockFetch({
      'POST /api/admin/users/1/promote': { status: 200, body: { ...ada, admin: true } },
    });
    const store = createStore();

    const pending = store.dispatch(promoteUser(1));
    expect(store.getState().users.changingId).toBe(1);
    const result = await pending;

    expect(result.payload).toMatchObject({ admin: true });
    expect(store.getState().users.changingId).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/users/1/promote',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('promoteUser rejects with the message', async () => {
    mockFetch({
      'POST /api/admin/users/1/promote': {
        status: 409,
        body: { message: 'User is already an admin' },
      },
    });
    const store = createStore();

    const result = await store.dispatch(promoteUser(1));

    expect(result.payload).toBe('User is already an admin');
    expect(store.getState().users.changingId).toBeNull();
  });

  it('demoteUser posts to the demote route and rejects with the message', async () => {
    mockFetch({ 'POST /api/admin/users/2/demote': { status: 200, body: ada } });
    const store = createStore();
    expect((await store.dispatch(demoteUser(2))).payload).toEqual(ada);

    mockFetch({
      'POST /api/admin/users/2/demote': {
        status: 403,
        body: { message: 'Only the admin who promoted this user can demote them' },
      },
    });
    const result = await store.dispatch(demoteUser(2));

    expect(result.payload).toBe('Only the admin who promoted this user can demote them');
    expect(store.getState().users.changingId).toBeNull();
  });

  it('deleteUser sends a DELETE and rejects with the message', async () => {
    const fetchMock = mockFetch({ 'DELETE /api/admin/users/1': { status: 204 } });
    const store = createStore();
    const pending = store.dispatch(deleteUser(1));
    expect(store.getState().users.changingId).toBe(1);
    await pending;
    expect(store.getState().users.changingId).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/users/1',
      expect.objectContaining({ method: 'DELETE' }),
    );

    mockFetch({
      'DELETE /api/admin/users/1': { status: 409, body: { message: 'User still has unpaid fines' } },
    });
    const result = await store.dispatch(deleteUser(1));

    expect(result.payload).toBe('User still has unpaid fines');
    expect(store.getState().users.changingId).toBeNull();
  });

  it('fetchFines loads the fined loans and clearFines empties them', async () => {
    mockFetch({ 'GET /api/admin/users/1/fines': { status: 200, body: [loan] } });
    const store = createStore();

    const pending = store.dispatch(fetchFines(1));
    expect(store.getState().users.finesLoading).toBe(true);
    await pending;
    expect(store.getState().users).toMatchObject({ fines: [loan], finesLoading: false });

    store.dispatch(clearFines());
    expect(store.getState().users).toMatchObject({ fines: [], finesError: '' });
  });

  it('fetchFines stores the error', async () => {
    mockFetch({ 'GET /api/admin/users/1/fines': { status: 404, body: { message: 'User not found' } } });
    const store = createStore();

    await store.dispatch(fetchFines(1));

    expect(store.getState().users).toMatchObject({ finesError: 'User not found', finesLoading: false });
  });

  it('forgiveFine tracks the forgiving id and replaces the fines', async () => {
    const forgiven = { ...loan, status: 'FORGIVEN' as const };
    const fetchMock = mockFetch({
      'GET /api/admin/users/1/fines': { status: 200, body: [loan] },
      'POST /api/admin/users/1/loans/4/forgive': { status: 200, body: [forgiven] },
    });
    const store = createStore();
    await store.dispatch(fetchFines(1));

    const pending = store.dispatch(forgiveFine({ userId: 1, loanId: 4 }));
    expect(store.getState().users.forgivingId).toBe(4);
    await pending;

    expect(store.getState().users).toMatchObject({ fines: [forgiven], forgivingId: null });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/users/1/loans/4/forgive',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('forgiveFine keeps the fines and stores the error on failure', async () => {
    mockFetch({
      'GET /api/admin/users/1/fines': { status: 200, body: [loan] },
      'POST /api/admin/users/1/loans/4/forgive': {
        status: 409,
        body: { message: 'This loan has no unpaid fine' },
      },
    });
    const store = createStore();
    await store.dispatch(fetchFines(1));

    await store.dispatch(forgiveFine({ userId: 1, loanId: 4 }));

    expect(store.getState().users).toMatchObject({
      fines: [loan],
      forgivingId: null,
      finesError: 'This loan has no unpaid fine',
    });
  });

  it('loads and saves column widths, ignoring an empty or failed load', async () => {
    const fetchMock = mockFetch({
      'GET /api/admin/users/columns': { status: 200, body: widths },
      'PUT /api/admin/users/columns': { status: 200, body: widths },
    });
    const store = createStore();

    await store.dispatch(fetchUserColumnWidths());
    expect(store.getState().users.columnWidths).toEqual(widths);

    mockFetch({ 'GET /api/admin/users/columns': { status: 200 } });
    await store.dispatch(fetchUserColumnWidths());
    expect(store.getState().users.columnWidths).toEqual(widths);

    mockFetch({});
    await store.dispatch(fetchUserColumnWidths());
    expect(store.getState().users.columnWidths).toEqual(widths);

    const saved = mockFetch({ 'PUT /api/admin/users/columns': { status: 200, body: widths } });
    await store.dispatch(saveUserColumnWidths(widths));
    expect(JSON.parse(String(saved.mock.calls[0][1]?.body))).toEqual(widths);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
