import { buildQuery } from '@/common/components/data-table/build-query';
import { cycleSort, keepDirSort } from '@/common/components/data-table/sort';
import { SortState } from '@/common/components/data-table/types';
import { NamedItem } from '@/common/types';
import { apiFetch, errorMessage } from '@/common/utils/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ReturnLoan = {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: NamedItem;
  language: NamedItem;
  status: 'BORROWED' | 'OVERDUE' | 'UNPAID' | 'RESERVED';
  dueAt: string | null;
  returnedAt: string | null;
  reservedUntil: string | null;
  overdueDays: number;
  fine: number;
};

export type ReturnFilterOptions = {
  isbn: string[];
  title: string[];
  author: string[];
  genre: NamedItem[];
  language: NamedItem[];
};

export type ReturnLoansResponse = {
  loans: ReturnLoan[];
  page: number;
  totalPages: number;
  total: number;
  filters: ReturnFilterOptions;
  totalUnpaid: number;
};

export type ReturnFilter = {
  isbn: string;
  title: string;
  author: string;
  genreId: string;
  languageId: string;
};

export type ReturnSortKey = 'isbn' | 'title' | 'author' | 'genre' | 'language' | 'due';

export type ReturnSort = SortState<ReturnSortKey>;

export type ReturnColumnKey = 'isbn' | 'titleAuthor' | 'genreLanguage' | 'status' | 'actions';

export type ReturnColumnWidths = Record<ReturnColumnKey, number>;

export const DEFAULT_RETURN_COLUMN_WIDTHS: ReturnColumnWidths = {
  isbn: 14,
  titleAuthor: 30,
  genreLanguage: 18,
  status: 20,
  actions: 18,
};

export const RETURN_FILTER_KEYS: (keyof ReturnFilter)[] = [
  'isbn',
  'title',
  'author',
  'genreId',
  'languageId',
];

export const EMPTY_RETURN_FILTER: ReturnFilter = {
  isbn: '',
  title: '',
  author: '',
  genreId: '',
  languageId: '',
};

export type ReturnState = {
  loans: ReturnLoan[];
  page: number;
  size: number;
  sort: ReturnSort;
  filter: ReturnFilter;
  totalPages: number;
  total: number;
  filters: ReturnFilterOptions | null;
  totalUnpaid: number;
  loading: boolean;
  error: string;
  columnWidths: ReturnColumnWidths;
  actingId: number | null;
  payingAll: boolean;
};

const initialState: ReturnState = {
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
};

type State = { returns: ReturnState };

export const fetchReturnLoans = createAsyncThunk<
  ReturnLoansResponse,
  void,
  { state: State; rejectValue: string }
>('returns/fetchLoans', async (_, { getState, rejectWithValue }) => {
  try {
    const query = buildQuery({ ...getState().returns, filterKeys: RETURN_FILTER_KEYS });
    return await apiFetch<ReturnLoansResponse>(`/api/return?${query}`);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const returnLoan = createAsyncThunk<ReturnLoan, number, { rejectValue: string }>(
  'returns/returnLoan',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<ReturnLoan>(`/api/return/${id}`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const unreserveLoan = createAsyncThunk<ReturnLoan, number, { rejectValue: string }>(
  'returns/unreserveLoan',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<ReturnLoan>(`/api/return/${id}/unreserve`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const payReturnFine = createAsyncThunk<void, number, { rejectValue: string }>(
  'returns/payFine',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<void>(`/api/loans/${id}/pay`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const payAllReturnFines = createAsyncThunk<void, void, { rejectValue: string }>(
  'returns/payAll',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<void>('/api/loans/pay-all', { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const fetchReturnColumnWidths = createAsyncThunk<
  ReturnColumnWidths | undefined,
  void,
  { rejectValue: string }
>('returns/fetchColumnWidths', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<ReturnColumnWidths | undefined>('/api/return/columns');
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const saveReturnColumnWidths = createAsyncThunk<
  ReturnColumnWidths,
  ReturnColumnWidths,
  { rejectValue: string }
>('returns/saveColumnWidths', async (widths, { rejectWithValue }) => {
  try {
    const body = JSON.stringify(widths);
    return await apiFetch<ReturnColumnWidths>('/api/return/columns', { method: 'PUT', body });
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

const returnSlice = createSlice({
  name: 'returns',
  initialState,
  reducers: {
    goTo: (state, action: PayloadAction<number>) => {
      state.page = Math.max(0, Math.min(action.payload, state.totalPages - 1));
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload;
      state.page = 0;
    },
    setFilter: (state, action: PayloadAction<ReturnFilter>) => {
      state.filter = action.payload;
      state.page = 0;
    },
    toggleSort: (state, action: PayloadAction<ReturnSortKey>) => {
      state.sort = cycleSort(state.sort, action.payload);
      state.page = 0;
    },
    switchSort: (state, action: PayloadAction<ReturnSortKey>) => {
      state.sort = keepDirSort(state.sort, action.payload);
      state.page = 0;
    },
    setColumnWidths: (state, action: PayloadAction<ReturnColumnWidths>) => {
      state.columnWidths = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnLoans.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchReturnLoans.fulfilled, (state, action) => {
        const { loans, page, totalPages, total, filters, totalUnpaid } = action.payload;
        state.loans = loans;
        state.page = page;
        state.totalPages = totalPages;
        state.total = total;
        state.filters = filters;
        state.totalUnpaid = totalUnpaid;
        state.loading = false;
      })
      .addCase(fetchReturnLoans.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.loading = false;
      })
      .addCase(fetchReturnColumnWidths.fulfilled, (state, action) => {
        if (action.payload) {
          state.columnWidths = action.payload;
        }
      })
      .addCase(payAllReturnFines.pending, (state) => {
        state.payingAll = true;
      })
      .addCase(payAllReturnFines.fulfilled, (state) => {
        state.payingAll = false;
      })
      .addCase(payAllReturnFines.rejected, (state) => {
        state.payingAll = false;
      });
    for (const thunk of [returnLoan, unreserveLoan, payReturnFine]) {
      builder
        .addCase(thunk.pending, (state, action) => {
          state.actingId = action.meta.arg;
        })
        .addCase(thunk.fulfilled, (state) => {
          state.actingId = null;
        })
        .addCase(thunk.rejected, (state) => {
          state.actingId = null;
        });
    }
  },
});

export const { goTo, setSize, setFilter, toggleSort, switchSort, setColumnWidths } =
  returnSlice.actions;

export const selectReturns = (state: State) => state.returns;

export const returnReducer = returnSlice.reducer;
