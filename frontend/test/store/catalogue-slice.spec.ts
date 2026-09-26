import {
  buildQuery,
  DEFAULT_COLUMN_WIDTHS,
  EMPTY_FILTER,
  fetchBooks,
  fetchColumnWidths,
  goTo,
  MIN_COLUMN_PERCENT,
  resizeColumns,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
  updateBook,
} from '@/store/catalogue-slice';
import { createStore } from '@/store/store';
import mockFetch from '../mock-fetch';

const book = {
  isbn: '111',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: { id: 2, name: 'Science Fiction' },
  language: { id: 1, name: 'English' },
  amount: 3,
  stock: 2,
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

const loaded = async (totalPages: number) => {
  mockFetch({
    'GET /api/books?page=0&size=10': {
      status: 200,
      body: { books: [book], page: 0, totalPages, total: totalPages * 10, filters },
    },
  });
  const store = createStore();
  await store.dispatch(fetchBooks());
  return store;
};

describe('catalogue slice', () => {
  it('starts empty on page 0 with no sort', () => {
    expect(createStore().getState().catalogue).toEqual({
      books: [],
      page: 0,
      size: 10,
      sort: null,
      filter: EMPTY_FILTER,
      totalPages: 0,
      total: 0,
      filters: null,
      loading: false,
      error: '',
      columnWidths: DEFAULT_COLUMN_WIDTHS,
    });
  });

  it('buildQuery keeps a fixed order and skips empty filters', () => {
    const base = { page: 2, size: 20, sort: null, filter: EMPTY_FILTER };
    expect(buildQuery(base)).toBe('page=2&size=20');
    expect(
      buildQuery({
        ...base,
        sort: { key: 'genre', dir: 'desc' },
        filter: { ...EMPTY_FILTER, stock: '1', title: 'Dune', genreId: '4' },
      }),
    ).toBe('page=2&size=20&sort=genre&dir=desc&title=Dune&genreId=4&stock=1');
  });

  it('fetchBooks stores the page and filter options', async () => {
    const store = await loaded(3);

    expect(store.getState().catalogue).toMatchObject({
      books: [book],
      page: 0,
      totalPages: 3,
      total: 30,
      filters,
      loading: false,
    });
  });

  it('fetchBooks keeps the page the backend clamped to', async () => {
    const store = await loaded(3);
    mockFetch({
      'GET /api/books?page=2&size=10': {
        status: 200,
        body: { books: [book], page: 1, totalPages: 2, total: 11, filters },
      },
    });

    store.dispatch(goTo(2));
    await store.dispatch(fetchBooks());

    expect(store.getState().catalogue).toMatchObject({ page: 1, totalPages: 2 });
  });

  it('fetchBooks stores the error message on failure', async () => {
    mockFetch({ 'GET /api/books?page=0&size=10': { status: 500, body: { message: 'Boom' } } });
    const store = createStore();

    await store.dispatch(fetchBooks());

    expect(store.getState().catalogue).toMatchObject({ error: 'Boom', loading: false });
  });

  it('goTo clamps to the known pages', async () => {
    const store = await loaded(3);

    store.dispatch(goTo(7));
    expect(store.getState().catalogue.page).toBe(2);
    store.dispatch(goTo(-1));
    expect(store.getState().catalogue.page).toBe(0);
  });

  it('setSize and setFilter reset to the first page', async () => {
    const store = await loaded(3);

    store.dispatch(goTo(2));
    store.dispatch(setSize(50));
    expect(store.getState().catalogue).toMatchObject({ size: 50, page: 0 });

    store.dispatch(goTo(1));
    store.dispatch(setFilter({ ...EMPTY_FILTER, title: 'Dune' }));
    expect(store.getState().catalogue).toMatchObject({ page: 0, filter: { title: 'Dune' } });
  });

  it('toggleSort cycles asc, desc, off', () => {
    const store = createStore();

    store.dispatch(toggleSort('title'));
    expect(store.getState().catalogue.sort).toEqual({ key: 'title', dir: 'asc' });
    store.dispatch(toggleSort('title'));
    expect(store.getState().catalogue.sort).toEqual({ key: 'title', dir: 'desc' });
    store.dispatch(toggleSort('title'));
    expect(store.getState().catalogue.sort).toBeNull();
    store.dispatch(toggleSort('title'));
    store.dispatch(toggleSort('isbn'));
    expect(store.getState().catalogue.sort).toEqual({ key: 'isbn', dir: 'asc' });
  });

  it('switchSort keeps the direction and changes the key', () => {
    const store = createStore();

    store.dispatch(switchSort('author'));
    expect(store.getState().catalogue.sort).toEqual({ key: 'author', dir: 'asc' });
    store.dispatch(toggleSort('author'));
    store.dispatch(switchSort('title'));
    expect(store.getState().catalogue.sort).toEqual({ key: 'title', dir: 'desc' });
  });

  it('resizeColumns keeps the total and the minimum', () => {
    const widths = DEFAULT_COLUMN_WIDTHS;

    const grown = resizeColumns({ widths, key: 'isbn', delta: 3.26 });
    expect(grown.isbn).toBe(widths.isbn + 3.3);
    expect(grown.titleAuthor).toBe(widths.titleAuthor - 3.3);

    const clamped = resizeColumns({ widths, key: 'amount', delta: 50 });
    expect(clamped.stock).toBe(MIN_COLUMN_PERCENT);
    expect(clamped.amount).toBe(widths.amount + widths.stock - MIN_COLUMN_PERCENT);

    expect(resizeColumns({ widths, key: 'actions', delta: 5 })).toEqual(widths);
  });

  it('fetchColumnWidths applies saved widths and ignores an empty answer', async () => {
    const widths = { isbn: 10, titleAuthor: 40, genreLanguage: 20, amount: 10, stock: 10, actions: 10 };
    mockFetch({ 'GET /api/catalogue/columns': { status: 200, body: widths } });
    const store = createStore();

    await store.dispatch(fetchColumnWidths());
    expect(store.getState().catalogue.columnWidths).toEqual(widths);

    mockFetch({ 'GET /api/catalogue/columns': { status: 200 } });
    await store.dispatch(fetchColumnWidths());
    expect(store.getState().catalogue.columnWidths).toEqual(widths);
  });

  it('updateBook rejects with the status and message', async () => {
    mockFetch({
      'PUT /api/books/111': { status: 409, body: { message: 'ISBN already exists' } },
    });
    const store = createStore();
    const request = { ...book, isbn: '222', genreId: 2, languageId: 1 };

    const result = await store.dispatch(updateBook({ isbn: '111', request }));

    expect(result.payload).toEqual({ status: 409, message: 'ISBN already exists' });
  });
});
