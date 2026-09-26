import { apiFetch, errorMessage } from '@/common/utils/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type LoanStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'UNPAID' | 'PAID';

export type Loan = {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  status: LoanStatus;
  overdueDays: number;
  fine: number;
};

export type HistoryStats = {
  booksBorrowed: number;
  favouriteGenre: string | null;
  favouriteAuthor: string | null;
  totalOverdueFines: number;
};

export type History = {
  stats: HistoryStats;
  loans: Loan[];
};

export type HistoryState = {
  history: History | null;
  loading: boolean;
  error: string;
  payingId: number | null;
  payingAll: boolean;
};

const initialState: HistoryState = {
  history: null,
  loading: false,
  error: '',
  payingId: null,
  payingAll: false,
};

export const fetchHistory = createAsyncThunk<History, void, { rejectValue: string }>(
  'history/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<History>('/api/loans');
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const payLoan = createAsyncThunk<History, number, { rejectValue: string }>(
  'history/payLoan',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<History>(`/api/loans/${id}/pay`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const payAllFines = createAsyncThunk<History, void, { rejectValue: string }>(
  'history/payAllFines',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<History>('/api/loans/pay-all', { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.history = action.payload;
        state.loading = false;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.loading = false;
      })
      .addCase(payLoan.pending, (state, action) => {
        state.payingId = action.meta.arg;
        state.error = '';
      })
      .addCase(payLoan.fulfilled, (state, action) => {
        state.history = action.payload;
        state.payingId = null;
      })
      .addCase(payLoan.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.payingId = null;
      })
      .addCase(payAllFines.pending, (state) => {
        state.payingAll = true;
        state.error = '';
      })
      .addCase(payAllFines.fulfilled, (state, action) => {
        state.history = action.payload;
        state.payingAll = false;
      })
      .addCase(payAllFines.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.payingAll = false;
      });
  },
});

type State = { history: HistoryState };

export const selectHistory = (state: State) => state.history;

export const historyReducer = historySlice.reducer;
