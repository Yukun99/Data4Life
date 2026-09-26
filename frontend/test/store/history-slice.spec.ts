import { fetchHistory, History, payAllFines, payLoan } from '@/store/history-slice';
import { createStore } from '@/store/store';
import mockFetch from '../mock-fetch';

const loan = {
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
  status: 'UNPAID' as const,
  overdueDays: 6,
  fine: 6,
  fee: 0,
};

const history: History = {
  stats: { booksBorrowed: 1, favouriteGenre: 'Fantasy', favouriteAuthor: 'Author', totalOverdueFines: 6 },
  loans: [loan],
};

const paid: History = {
  stats: { ...history.stats, totalOverdueFines: 0 },
  loans: [{ ...loan, status: 'PAID' }],
};

const loaded = async () => {
  mockFetch({ 'GET /api/loans': { status: 200, body: history } });
  const store = createStore();
  await store.dispatch(fetchHistory());
  return store;
};

describe('history slice', () => {
  it('starts empty and not loading', () => {
    expect(createStore().getState().history).toEqual({
      history: null,
      loading: false,
      error: '',
      payingId: null,
      payingAll: false,
    });
  });

  it('fetchHistory sets loading while pending and stores the result', async () => {
    mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    const store = createStore();

    const pending = store.dispatch(fetchHistory());
    expect(store.getState().history.loading).toBe(true);
    await pending;

    expect(store.getState().history).toMatchObject({ history, loading: false, error: '' });
  });

  it('fetchHistory stores the error message on failure', async () => {
    mockFetch({ 'GET /api/loans': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    await store.dispatch(fetchHistory());

    expect(store.getState().history).toMatchObject({ history: null, error: 'Boom', loading: false });
  });

  it('payLoan tracks the paying id and replaces the history', async () => {
    const store = await loaded();
    const fetchMock = mockFetch({ 'POST /api/loans/4/pay': { status: 200, body: paid } });

    const pending = store.dispatch(payLoan(4));
    expect(store.getState().history.payingId).toBe(4);
    await pending;

    expect(store.getState().history).toMatchObject({ history: paid, payingId: null, error: '' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/4/pay',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('payLoan keeps the old history and stores the error on failure', async () => {
    const store = await loaded();
    mockFetch({ 'POST /api/loans/4/pay': { status: 400, body: { message: 'Nothing to pay' } } });

    await store.dispatch(payLoan(4));

    expect(store.getState().history).toMatchObject({
      history,
      payingId: null,
      error: 'Nothing to pay',
    });
  });

  it('payAllFines tracks payingAll and replaces the history', async () => {
    const store = await loaded();
    mockFetch({ 'POST /api/loans/pay-all': { status: 200, body: paid } });

    const pending = store.dispatch(payAllFines());
    expect(store.getState().history.payingAll).toBe(true);
    await pending;

    expect(store.getState().history).toMatchObject({ history: paid, payingAll: false, error: '' });
  });

  it('payAllFines stores the error on failure', async () => {
    const store = await loaded();
    mockFetch({ 'POST /api/loans/pay-all': { status: 500, body: { message: 'Boom' } } });

    await store.dispatch(payAllFines());

    expect(store.getState().history).toMatchObject({ history, payingAll: false, error: 'Boom' });
  });
});
