import {
  DEFAULT_RETURN_COLUMN_WIDTHS,
  EMPTY_RETURN_FILTER,
  fetchReturnColumnWidths,
  fetchReturnLoans,
  goTo,
  payAllReturnFines,
  payReturnFine,
  returnLoan,
  ReturnLoan,
  saveReturnColumnWidths,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
  unreserveLoan,
} from '@/store/return-slice';
import { createStore } from '@/store/store';
import mockFetch from '../mock-fetch';

const loan: ReturnLoan = {
  id: 7,
  isbn: '111',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: { id: 2, name: 'Science Fiction' },
  language: { id: 1, name: 'English' },
  status: 'BORROWED',
  dueAt: '2026-10-10T00:00:00Z',
  returnedAt: null,
  reservedUntil: null,
  overdueDays: 0,
  fine: 0,
  queuePosition: null,
};

const filters = {
  isbn: ['111'],
  title: ['Dune'],
  author: ['Frank Herbert'],
  genre: [{ id: 2, name: 'Science Fiction' }],
  language: [{ id: 1, name: 'English' }],
};

const widths = { isbn: 10, titleAuthor: 40, genreLanguage: 20, status: 10, actions: 20 };

const loaded = async (totalPages: number) => {
  mockFetch({
    'GET /api/return?page=0&size=10': {
      status: 200,
      body: { loans: [loan], page: 0, totalPages, total: totalPages * 10, filters, totalUnpaid: 6 },
    },
  });
  const store = createStore();
  await store.dispatch(fetchReturnLoans());
  return store;
};

describe('return slice', () => {
  it('starts empty on page 0 with no sort', () => {
    expect(createStore().getState().returns).toEqual({
      loans: [],
      page: 0,
      size: 10,
      sort: null,
      filter: EMPTY_RETURN_FILTER,
      totalPages: 0,
      total: 0,
      filters: null,
      totalUnpaid: 0,
      loading: false,
      error: '',
      columnWidths: DEFAULT_RETURN_COLUMN_WIDTHS,
      actingId: null,
      payingAll: false,
    });
  });

  it('fetchReturnLoans stores the page, filter options and unpaid total', async () => {
    const store = await loaded(3);

    expect(store.getState().returns).toMatchObject({
      loans: [loan],
      page: 0,
      totalPages: 3,
      total: 30,
      filters,
      totalUnpaid: 6,
      loading: false,
    });
  });

  it('fetchReturnLoans keeps a queued row with its position', async () => {
    const queued: ReturnLoan = {
      ...loan,
      id: 8,
      status: 'QUEUED',
      dueAt: null,
      queuePosition: 2,
    };
    mockFetch({
      'GET /api/return?page=0&size=10': {
        status: 200,
        body: { loans: [queued], page: 0, totalPages: 1, total: 1, filters, totalUnpaid: 0 },
      },
    });
    const store = createStore();

    await store.dispatch(fetchReturnLoans());

    expect(store.getState().returns.loans).toEqual([queued]);
  });

  it('fetchReturnLoans sends the sort and filters in a fixed order', async () => {
    const fetchMock = mockFetch({});
    const store = createStore();

    store.dispatch(toggleSort('due'));
    store.dispatch(setFilter({ ...EMPTY_RETURN_FILTER, genreId: '2', languageId: '1' }));
    await store.dispatch(fetchReturnLoans());

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return?page=0&size=10&sort=due&dir=asc&genreId=2&languageId=1',
      expect.anything(),
    );
  });

  it('fetchReturnLoans stores the error message on failure', async () => {
    mockFetch({ 'GET /api/return?page=0&size=10': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    await store.dispatch(fetchReturnLoans());

    expect(store.getState().returns).toMatchObject({ error: 'Boom', loading: false });
  });

  it('goTo clamps, setSize and setFilter reset to the first page', async () => {
    const store = await loaded(3);

    store.dispatch(goTo(7));
    expect(store.getState().returns.page).toBe(2);
    store.dispatch(setSize(50));
    expect(store.getState().returns).toMatchObject({ size: 50, page: 0 });
    store.dispatch(goTo(1));
    store.dispatch(setFilter({ ...EMPTY_RETURN_FILTER, title: 'Dune' }));
    expect(store.getState().returns).toMatchObject({ page: 0, filter: { title: 'Dune' } });
  });

  it('toggleSort cycles and switchSort keeps the direction', () => {
    const store = createStore();

    store.dispatch(toggleSort('title'));
    store.dispatch(toggleSort('title'));
    expect(store.getState().returns.sort).toEqual({ key: 'title', dir: 'desc' });
    store.dispatch(switchSort('author'));
    expect(store.getState().returns.sort).toEqual({ key: 'author', dir: 'desc' });
    store.dispatch(toggleSort('author'));
    expect(store.getState().returns.sort).toBeNull();
  });

  it('returnLoan posts to the loan and tracks the acting id', async () => {
    const returned = { ...loan, returnedAt: '2026-09-26T00:00:00Z' };
    const fetchMock = mockFetch({ 'POST /api/return/7': { status: 200, body: returned } });
    const store = createStore();

    const pending = store.dispatch(returnLoan(7));
    expect(store.getState().returns.actingId).toBe(7);
    const result = await pending;

    expect(result.payload).toEqual(returned);
    expect(store.getState().returns.actingId).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return/7',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returnLoan rejects with the backend message', async () => {
    mockFetch({
      'POST /api/return/7': { status: 409, body: { message: 'This book was already returned' } },
    });
    const store = createStore();

    const result = await store.dispatch(returnLoan(7));

    expect(result.payload).toBe('This book was already returned');
    expect(store.getState().returns.actingId).toBeNull();
  });

  it('unreserveLoan posts to the unreserve path and tracks the acting id', async () => {
    const released = { ...loan, status: 'RESERVED' as const, dueAt: null };
    const fetchMock = mockFetch({ 'POST /api/return/7/unreserve': { status: 200, body: released } });
    const store = createStore();

    const pending = store.dispatch(unreserveLoan(7));
    expect(store.getState().returns.actingId).toBe(7);
    const result = await pending;

    expect(result.payload).toEqual(released);
    expect(store.getState().returns.actingId).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return/7/unreserve',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('payReturnFine posts to the loan pay path and tracks the acting id', async () => {
    const fetchMock = mockFetch({ 'POST /api/loans/7/pay': { status: 200, body: {} } });
    const store = createStore();

    const pending = store.dispatch(payReturnFine(7));
    expect(store.getState().returns.actingId).toBe(7);
    await pending;

    expect(store.getState().returns.actingId).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/7/pay',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('payAllReturnFines posts to pay-all and tracks payingAll', async () => {
    const fetchMock = mockFetch({ 'POST /api/loans/pay-all': { status: 200, body: {} } });
    const store = createStore();

    const pending = store.dispatch(payAllReturnFines());
    expect(store.getState().returns.payingAll).toBe(true);
    await pending;

    expect(store.getState().returns.payingAll).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/pay-all',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('payAllReturnFines clears payingAll on failure', async () => {
    mockFetch({ 'POST /api/loans/pay-all': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    const result = await store.dispatch(payAllReturnFines());

    expect(result.payload).toBe('Boom');
    expect(store.getState().returns.payingAll).toBe(false);
  });

  it('loads and saves the column widths', async () => {
    const fetchMock = mockFetch({
      'GET /api/return/columns': { status: 200, body: widths },
      'PUT /api/return/columns': { status: 200, body: widths },
    });
    const store = createStore();

    await store.dispatch(fetchReturnColumnWidths());
    expect(store.getState().returns.columnWidths).toEqual(widths);

    await store.dispatch(saveReturnColumnWidths(widths));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return/columns',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(widths) }),
    );
  });

  it('keeps the default widths when none are saved', async () => {
    mockFetch({ 'GET /api/return/columns': { status: 200 } });
    const store = createStore();

    await store.dispatch(fetchReturnColumnWidths());

    expect(store.getState().returns.columnWidths).toEqual(DEFAULT_RETURN_COLUMN_WIDTHS);
  });
});
