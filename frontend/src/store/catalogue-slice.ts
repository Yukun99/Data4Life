import { NamedItem } from '@/common/types';
import { ApiError, apiFetch, errorMessage } from '@/common/utils/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Book = {
  isbn: string;
  title: string;
  author: string;
  genre: NamedItem;
  language: NamedItem;
  amount: number;
  stock: number;
};

export type FilterOptions = {
  isbn: string[];
  title: string[];
  author: string[];
  genre: NamedItem[];
  language: NamedItem[];
  amount: number[];
  stock: number[];
};

export type BooksResponse = {
  books: Book[];
  page: number;
  totalPages: number;
  total: number;
  filters: FilterOptions;
};

export type BookFilter = {
  isbn: string;
  title: string;
  author: string;
  genreId: string;
  languageId: string;
  amount: string;
  stock: string;
};

export type BookRequest = {
  isbn: string;
  title: string;
  author: string;
  genreId: number;
  languageId: number;
  amount: number;
};

export type SortKey = 'isbn' | 'title' | 'author' | 'genre' | 'language' | 'amount' | 'stock';

export type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

export type RequestFailure = { status: number; message: string };

export type ColumnKey = 'isbn' | 'titleAuthor' | 'genreLanguage' | 'amount' | 'stock' | 'actions';

export type ColumnWidths = Record<ColumnKey, number>;

export const COLUMN_ORDER: ColumnKey[] = [
  'isbn',
  'titleAuthor',
  'genreLanguage',
  'amount',
  'stock',
  'actions',
];

export const MIN_COLUMN_PERCENT = 5;

export const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  isbn: 14,
  titleAuthor: 34,
  genreLanguage: 20,
  amount: 10,
  stock: 10,
  actions: 12,
};

type ResizeColumnsParams = { widths: ColumnWidths; key: ColumnKey; delta: number };

/** Moves `delta` percent from the column after `key` into `key`, keeping both above the minimum. */
export const resizeColumns = ({ widths, key, delta }: ResizeColumnsParams): ColumnWidths => {
  const next = COLUMN_ORDER[COLUMN_ORDER.indexOf(key) + 1];
  if (!next) {
    return widths;
  }
  const left = widths[key];
  const right = widths[next];
  const applied = Math.max(MIN_COLUMN_PERCENT - left, Math.min(delta, right - MIN_COLUMN_PERCENT));
  const tenth = (value: number) => Math.round(value * 10) / 10;
  return { ...widths, [key]: tenth(left + applied), [next]: tenth(right - applied) };
};

export const PAGE_SIZES = [10, 20, 50];

export const FILTER_KEYS: (keyof BookFilter)[] = [
  'isbn',
  'title',
  'author',
  'genreId',
  'languageId',
  'amount',
  'stock',
];

export const EMPTY_FILTER: BookFilter = {
  isbn: '',
  title: '',
  author: '',
  genreId: '',
  languageId: '',
  amount: '',
  stock: '',
};

export type CatalogueState = {
  books: Book[];
  page: number;
  size: number;
  sort: Sort;
  filter: BookFilter;
  totalPages: number;
  total: number;
  filters: FilterOptions | null;
  loading: boolean;
  error: string;
  columnWidths: ColumnWidths;
};

const initialState: CatalogueState = {
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
};

type BuildQueryParams = Pick<CatalogueState, 'page' | 'size' | 'sort' | 'filter'>;

/** Builds the list query string in a fixed order: page, size, sort, dir, then set filters. */
export const buildQuery = ({ page, size, sort, filter }: BuildQueryParams) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (sort) {
    params.append('sort', sort.key);
    params.append('dir', sort.dir);
  }
  FILTER_KEYS.filter((key) => filter[key] !== '').forEach((key) => params.append(key, filter[key]));
  return params.toString();
};

type State = { catalogue: CatalogueState };

const bookPath = (isbn: string) => `/api/books/${encodeURIComponent(isbn)}`;

const write = (path: string, method: string, body?: BookRequest) =>
  apiFetch<Book>(path, { method, body: body && JSON.stringify(body) });

export const fetchBooks = createAsyncThunk<
  BooksResponse,
  void,
  { state: State; rejectValue: string }
>('catalogue/fetchBooks', async (_, { getState, rejectWithValue }) => {
  try {
    return await apiFetch<BooksResponse>(`/api/books?${buildQuery(getState().catalogue)}`);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const fetchBook = createAsyncThunk<Book, string, { rejectValue: string }>(
  'catalogue/fetchBook',
  async (isbn, { rejectWithValue }) => {
    try {
      return await apiFetch<Book>(bookPath(isbn));
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const createBook = createAsyncThunk<Book, BookRequest, { rejectValue: string }>(
  'catalogue/createBook',
  async (request, { rejectWithValue }) => {
    try {
      return await write('/api/books', 'POST', request);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

type UpdateBookParams = { isbn: string; request: BookRequest };

export const updateBook = createAsyncThunk<
  Book,
  UpdateBookParams,
  { rejectValue: RequestFailure }
>('catalogue/updateBook', async ({ isbn, request }, { rejectWithValue }) => {
  try {
    return await write(bookPath(isbn), 'PUT', request);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    return rejectWithValue({ status, message: errorMessage(err) });
  }
});

type MergeBooksParams = { sourceIsbn: string; request: BookRequest };

export const mergeBooks = createAsyncThunk<Book, MergeBooksParams, { rejectValue: string }>(
  'catalogue/mergeBooks',
  async ({ sourceIsbn, request }, { rejectWithValue }) => {
    try {
      return await write(`${bookPath(sourceIsbn)}/merge`, 'POST', request);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const fetchColumnWidths = createAsyncThunk<
  ColumnWidths | undefined,
  void,
  { rejectValue: string }
>('catalogue/fetchColumnWidths', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<ColumnWidths | undefined>('/api/catalogue/columns');
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const saveColumnWidths = createAsyncThunk<
  ColumnWidths,
  ColumnWidths,
  { rejectValue: string }
>('catalogue/saveColumnWidths', async (widths, { rejectWithValue }) => {
  try {
    const body = JSON.stringify(widths);
    return await apiFetch<ColumnWidths>('/api/catalogue/columns', { method: 'PUT', body });
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const deleteBook = createAsyncThunk<void, string, { rejectValue: string }>(
  'catalogue/deleteBook',
  async (isbn, { rejectWithValue }) => {
    try {
      return await apiFetch<void>(bookPath(isbn), { method: 'DELETE' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

const catalogueSlice = createSlice({
  name: 'catalogue',
  initialState,
  reducers: {
    goTo: (state, action: PayloadAction<number>) => {
      state.page = Math.max(0, Math.min(action.payload, state.totalPages - 1));
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload;
      state.page = 0;
    },
    setFilter: (state, action: PayloadAction<BookFilter>) => {
      state.filter = action.payload;
      state.page = 0;
    },
    toggleSort: (state, action: PayloadAction<SortKey>) => {
      const key = action.payload;
      if (state.sort?.key !== key) {
        state.sort = { key, dir: 'asc' };
      } else {
        state.sort = state.sort.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      state.page = 0;
    },
    switchSort: (state, action: PayloadAction<SortKey>) => {
      state.sort = { key: action.payload, dir: state.sort?.dir ?? 'asc' };
      state.page = 0;
    },
    setColumnWidths: (state, action: PayloadAction<ColumnWidths>) => {
      state.columnWidths = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        const { books, page, totalPages, total, filters } = action.payload;
        state.books = books;
        state.page = page;
        state.totalPages = totalPages;
        state.total = total;
        state.filters = filters;
        state.loading = false;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.loading = false;
      })
      .addCase(fetchColumnWidths.fulfilled, (state, action) => {
        if (action.payload) {
          state.columnWidths = action.payload;
        }
      });
  },
});

export const { goTo, setSize, setFilter, toggleSort, switchSort, setColumnWidths } =
  catalogueSlice.actions;

export const selectCatalogue = (state: State) => state.catalogue;
export const selectBooks = (state: State) => state.catalogue.books;
export const selectFilterOptions = (state: State) => state.catalogue.filters;

export const catalogueReducer = catalogueSlice.reducer;
