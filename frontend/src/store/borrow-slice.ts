import { buildQuery } from '@/common/components/data-table/build-query';
import { cycleSort, keepDirSort } from '@/common/components/data-table/sort';
import { SortState } from '@/common/components/data-table/types';
import { NamedItem } from '@/common/types';
import { apiFetch, errorMessage } from '@/common/utils/api';
import { FilterOptions } from '@/store/catalogue-slice';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Holding = 'BORROWED' | 'RESERVED';

export type BorrowBook = {
  isbn: string;
  title: string;
  author: string;
  genre: NamedItem;
  language: NamedItem;
  stock: number;
  holding: Holding | null;
};

export type BorrowBooksResponse = {
  books: BorrowBook[];
  page: number;
  totalPages: number;
  total: number;
  filters: FilterOptions;
  block: string | null;
  convertBlock: string | null;
};

export type BorrowFilter = {
  isbn: string;
  title: string;
  author: string;
  genreId: string;
  languageId: string;
  stock: string;
};

export type BorrowSortKey = 'isbn' | 'title' | 'author' | 'genre' | 'language' | 'stock';

export type BorrowSort = SortState<BorrowSortKey>;

export type BorrowColumnKey = 'isbn' | 'titleAuthor' | 'genreLanguage' | 'stock' | 'actions';

export type BorrowColumnWidths = Record<BorrowColumnKey, number>;

export const DEFAULT_BORROW_COLUMN_WIDTHS: BorrowColumnWidths = {
  isbn: 16,
  titleAuthor: 36,
  genreLanguage: 20,
  stock: 10,
  actions: 18,
};

export const BORROW_FILTER_KEYS: (keyof BorrowFilter)[] = [
  'isbn',
  'title',
  'author',
  'genreId',
  'languageId',
  'stock',
];

export const EMPTY_BORROW_FILTER: BorrowFilter = {
  isbn: '',
  title: '',
  author: '',
  genreId: '',
  languageId: '',
  stock: '',
};

export type BorrowState = {
  books: BorrowBook[];
  page: number;
  size: number;
  sort: BorrowSort;
  filter: BorrowFilter;
  totalPages: number;
  total: number;
  filters: FilterOptions | null;
  block: string | null;
  convertBlock: string | null;
  loading: boolean;
  error: string;
  columnWidths: BorrowColumnWidths;
  actingIsbn: string | null;
};

const initialState: BorrowState = {
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
};

type State = { borrow: BorrowState };

const bookPath = (isbn: string) => `/api/borrow/${encodeURIComponent(isbn)}`;

export const fetchBorrowBooks = createAsyncThunk<
  BorrowBooksResponse,
  void,
  { state: State; rejectValue: string }
>('borrow/fetchBooks', async (_, { getState, rejectWithValue }) => {
  try {
    const query = buildQuery({ ...getState().borrow, filterKeys: BORROW_FILTER_KEYS });
    return await apiFetch<BorrowBooksResponse>(`/api/borrow?${query}`);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const borrowBook = createAsyncThunk<BorrowBook, string, { rejectValue: string }>(
  'borrow/borrowBook',
  async (isbn, { rejectWithValue }) => {
    try {
      return await apiFetch<BorrowBook>(bookPath(isbn), { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const reserveBook = createAsyncThunk<BorrowBook, string, { rejectValue: string }>(
  'borrow/reserveBook',
  async (isbn, { rejectWithValue }) => {
    try {
      return await apiFetch<BorrowBook>(`${bookPath(isbn)}/reserve`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const fetchBorrowColumnWidths = createAsyncThunk<
  BorrowColumnWidths | undefined,
  void,
  { rejectValue: string }
>('borrow/fetchColumnWidths', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<BorrowColumnWidths | undefined>('/api/borrow/columns');
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const saveBorrowColumnWidths = createAsyncThunk<
  BorrowColumnWidths,
  BorrowColumnWidths,
  { rejectValue: string }
>('borrow/saveColumnWidths', async (widths, { rejectWithValue }) => {
  try {
    const body = JSON.stringify(widths);
    return await apiFetch<BorrowColumnWidths>('/api/borrow/columns', { method: 'PUT', body });
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

const borrowSlice = createSlice({
  name: 'borrow',
  initialState,
  reducers: {
    goTo: (state, action: PayloadAction<number>) => {
      state.page = Math.max(0, Math.min(action.payload, state.totalPages - 1));
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload;
      state.page = 0;
    },
    setFilter: (state, action: PayloadAction<BorrowFilter>) => {
      state.filter = action.payload;
      state.page = 0;
    },
    toggleSort: (state, action: PayloadAction<BorrowSortKey>) => {
      state.sort = cycleSort(state.sort, action.payload);
      state.page = 0;
    },
    switchSort: (state, action: PayloadAction<BorrowSortKey>) => {
      state.sort = keepDirSort(state.sort, action.payload);
      state.page = 0;
    },
    setColumnWidths: (state, action: PayloadAction<BorrowColumnWidths>) => {
      state.columnWidths = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBorrowBooks.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchBorrowBooks.fulfilled, (state, action) => {
        const { books, page, totalPages, total, filters, block, convertBlock } = action.payload;
        state.books = books;
        state.page = page;
        state.totalPages = totalPages;
        state.total = total;
        state.filters = filters;
        state.block = block;
        state.convertBlock = convertBlock;
        state.loading = false;
      })
      .addCase(fetchBorrowBooks.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.loading = false;
      })
      .addCase(fetchBorrowColumnWidths.fulfilled, (state, action) => {
        if (action.payload) {
          state.columnWidths = action.payload;
        }
      });
    for (const thunk of [borrowBook, reserveBook]) {
      builder
        .addCase(thunk.pending, (state, action) => {
          state.actingIsbn = action.meta.arg;
        })
        .addCase(thunk.fulfilled, (state) => {
          state.actingIsbn = null;
        })
        .addCase(thunk.rejected, (state) => {
          state.actingIsbn = null;
        });
    }
  },
});

export const { goTo, setSize, setFilter, toggleSort, switchSort, setColumnWidths } =
  borrowSlice.actions;

export const selectBorrow = (state: State) => state.borrow;

export const borrowReducer = borrowSlice.reducer;
