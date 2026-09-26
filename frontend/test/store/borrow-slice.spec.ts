import {
  borrowBook,
  DEFAULT_BORROW_COLUMN_WIDTHS,
  EMPTY_BORROW_FILTER,
  fetchBorrowBooks,
  fetchBorrowColumnWidths,
  goTo,
  reserveBook,
  saveBorrowColumnWidths,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
} from '@/store/borrow-slice';
import { createStore } from '@/store/store';
import mockFetch from '../mock-fetch';

const book = {
  isbn: '111',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: { id: 2, name: 'Science Fiction' },
  language: { id: 1, name: 'English' },
  stock: 2,
  holding: null,
};

const filters = {
  isbn: ['111'],
  title: ['Dune'],
  author: ['Frank Herbert'],
  genre: [{ id: 2, name: 'Science Fiction' }],
  language: [{ id: 1, name: 'English' }],
  amount: [3],
  stock: [2],
};

const widths = { isbn: 10, titleAuthor: 40, genreLanguage: 20, stock: 10, actions: 20 };

const loaded = async (totalPages: number, block: string | null = null) => {
  mockFetch({
    'GET /api/borrow?page=0&size=10': {
      status: 200,
      body: { books: [book], page: 0, totalPages, total: totalPages * 10, filters, block, convertBlock: block },
    },
  });
  const store = createStore();
  await store.dispatch(fetchBorrowBooks());
  return store;
};

describe('borrow slice', () => {
  it('starts empty on page 0 with no sort', () => {
    expect(createStore().getState().borrow).toEqual({
      books: [],
      page: 0,
      size: 10,
      sort: null,
      filter: EMPTY_BORROW_FILTER,
      totalPages: 0,
      total: 0,
      filters: null,
      block: null,
      convertBlock: null,
      loading: false,
      error: '',
      columnWidths: DEFAULT_BORROW_COLUMN_WIDTHS,
      actingIsbn: null,
    });
  });

  it('fetchBorrowBooks stores the page, filter options and block reason', async () => {
    const store = await loaded(3, 'You have unpaid fines');

    expect(store.getState().borrow).toMatchObject({
      books: [book],
      page: 0,
      totalPages: 3,
      total: 30,
      filters,
      block: 'You have unpaid fines',
      convertBlock: 'You have unpaid fines',
      loading: false,
    });
  });

  it('fetchBorrowBooks sends the sort and filters in a fixed order', async () => {
    const fetchMock = mockFetch({});
    const store = createStore();

    store.dispatch(toggleSort('title'));
    store.dispatch(setFilter({ ...EMPTY_BORROW_FILTER, genreId: '2', stock: '0' }));
    await store.dispatch(fetchBorrowBooks());

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/borrow?page=0&size=10&sort=title&dir=asc&genreId=2&stock=0',
      expect.anything(),
    );
  });

  it('fetchBorrowBooks stores the error message on failure', async () => {
    mockFetch({ 'GET /api/borrow?page=0&size=10': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    await store.dispatch(fetchBorrowBooks());

    expect(store.getState().borrow).toMatchObject({ error: 'Boom', loading: false });
  });

  it('goTo clamps, setSize and setFilter reset to the first page', async () => {
    const store = await loaded(3);

    store.dispatch(goTo(7));
    expect(store.getState().borrow.page).toBe(2);
    store.dispatch(setSize(50));
    expect(store.getState().borrow).toMatchObject({ size: 50, page: 0 });
    store.dispatch(goTo(1));
    store.dispatch(setFilter({ ...EMPTY_BORROW_FILTER, title: 'Dune' }));
    expect(store.getState().borrow).toMatchObject({ page: 0, filter: { title: 'Dune' } });
  });

  it('toggleSort cycles and switchSort keeps the direction', () => {
    const store = createStore();

    store.dispatch(toggleSort('title'));
    store.dispatch(toggleSort('title'));
    expect(store.getState().borrow.sort).toEqual({ key: 'title', dir: 'desc' });
    store.dispatch(switchSort('author'));
    expect(store.getState().borrow.sort).toEqual({ key: 'author', dir: 'desc' });
    store.dispatch(toggleSort('author'));
    expect(store.getState().borrow.sort).toBeNull();
  });

  it('borrowBook posts to the book and tracks the acting ISBN', async () => {
    const fetchMock = mockFetch({
      'POST /api/borrow/111': { status: 200, body: { ...book, holding: 'BORROWED' } },
    });
    const store = createStore();

    const pending = store.dispatch(borrowBook('111'));
    expect(store.getState().borrow.actingIsbn).toBe('111');
    const result = await pending;

    expect(result.payload).toEqual({ ...book, holding: 'BORROWED' });
    expect(store.getState().borrow.actingIsbn).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/borrow/111',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reserveBook posts to the reserve path and rejects with the message', async () => {
    const fetchMock = mockFetch({
      'POST /api/borrow/111/reserve': { status: 409, body: { message: 'Out of stock' } },
    });
    const store = createStore();

    const result = await store.dispatch(reserveBook('111'));

    expect(result.payload).toBe('Out of stock');
    expect(store.getState().borrow.actingIsbn).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/borrow/111/reserve',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loads and saves the column widths', async () => {
    const fetchMock = mockFetch({
      'GET /api/borrow/columns': { status: 200, body: widths },
      'PUT /api/borrow/columns': { status: 200, body: widths },
    });
    const store = createStore();

    await store.dispatch(fetchBorrowColumnWidths());
    expect(store.getState().borrow.columnWidths).toEqual(widths);

    await store.dispatch(saveBorrowColumnWidths(widths));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/borrow/columns',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(widths) }),
    );
  });

  it('keeps the default widths when none are saved', async () => {
    mockFetch({ 'GET /api/borrow/columns': { status: 200 } });
    const store = createStore();

    await store.dispatch(fetchBorrowColumnWidths());

    expect(store.getState().borrow.columnWidths).toEqual(DEFAULT_BORROW_COLUMN_WIDTHS);
  });
});
