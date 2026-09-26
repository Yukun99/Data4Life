import { buildQuery } from '@/common/components/data-table/build-query';
import { cycleSort, keepDirSort } from '@/common/components/data-table/sort';
import { SortState } from '@/common/components/data-table/types';
import { Loan } from '@/common/types';
import { apiFetch, errorMessage } from '@/common/utils/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  admin: boolean;
  totalBorrows: number;
  currentBorrows: number;
  totalFines: number;
  currentFines: number;
  demotable: boolean;
  deletable: boolean;
};

export type UserFilterOptions = {
  name: string[];
  email: string[];
  admin: boolean[];
  totalBorrows: number[];
  currentBorrows: number[];
  totalFines: number[];
  currentFines: number[];
};

export type UsersResponse = {
  users: AdminUser[];
  page: number;
  totalPages: number;
  total: number;
  filters: UserFilterOptions;
};

export type UserFilter = {
  name: string;
  email: string;
  admin: string;
  totalBorrows: string;
  currentBorrows: string;
  totalFines: string;
  currentFines: string;
};

export type UserSortKey =
  | 'name'
  | 'email'
  | 'admin'
  | 'joined'
  | 'totalBorrows'
  | 'currentBorrows'
  | 'totalFines'
  | 'currentFines';

export type UserSort = SortState<UserSortKey>;

export type UserColumnKey = 'nameEmail' | 'admin' | 'joined' | 'borrows' | 'fines' | 'actions';

export type UserColumnWidths = Record<UserColumnKey, number>;

export const USER_COLUMN_ORDER: UserColumnKey[] = [
  'nameEmail',
  'admin',
  'joined',
  'borrows',
  'fines',
  'actions',
];

export const DEFAULT_USER_COLUMN_WIDTHS: UserColumnWidths = {
  nameEmail: 30,
  admin: 10,
  joined: 14,
  borrows: 16,
  fines: 16,
  actions: 14,
};

export const USER_FILTER_KEYS: (keyof UserFilter)[] = [
  'name',
  'email',
  'admin',
  'totalBorrows',
  'currentBorrows',
  'totalFines',
  'currentFines',
];

export const EMPTY_USER_FILTER: UserFilter = {
  name: '',
  email: '',
  admin: '',
  totalBorrows: '',
  currentBorrows: '',
  totalFines: '',
  currentFines: '',
};

export type UsersState = {
  users: AdminUser[];
  page: number;
  size: number;
  sort: UserSort;
  filter: UserFilter;
  totalPages: number;
  total: number;
  filters: UserFilterOptions | null;
  loading: boolean;
  error: string;
  columnWidths: UserColumnWidths;
  fines: Loan[];
  finesLoading: boolean;
  finesError: string;
  forgivingId: number | null;
  changingId: number | null;
};

const initialState: UsersState = {
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
};

type State = { users: UsersState };

const BASE = '/api/admin/users';

export const fetchUsers = createAsyncThunk<
  UsersResponse,
  void,
  { state: State; rejectValue: string }
>('users/fetchUsers', async (_, { getState, rejectWithValue }) => {
  try {
    const query = buildQuery({ ...getState().users, filterKeys: USER_FILTER_KEYS });
    return await apiFetch<UsersResponse>(`${BASE}?${query}`);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const promoteUser = createAsyncThunk<AdminUser, number, { rejectValue: string }>(
  'users/promoteUser',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<AdminUser>(`${BASE}/${id}/promote`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const demoteUser = createAsyncThunk<AdminUser, number, { rejectValue: string }>(
  'users/demoteUser',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<AdminUser>(`${BASE}/${id}/demote`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteUser = createAsyncThunk<void, number, { rejectValue: string }>(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const fetchFines = createAsyncThunk<Loan[], number, { rejectValue: string }>(
  'users/fetchFines',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<Loan[]>(`${BASE}/${id}/fines`);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

type ForgiveFineParams = { userId: number; loanId: number };

export const forgiveFine = createAsyncThunk<Loan[], ForgiveFineParams, { rejectValue: string }>(
  'users/forgiveFine',
  async ({ userId, loanId }, { rejectWithValue }) => {
    try {
      return await apiFetch<Loan[]>(`${BASE}/${userId}/loans/${loanId}/forgive`, {
        method: 'POST',
      });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const fetchUserColumnWidths = createAsyncThunk<
  UserColumnWidths | undefined,
  void,
  { rejectValue: string }
>('users/fetchUserColumnWidths', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<UserColumnWidths | undefined>(`${BASE}/columns`);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const saveUserColumnWidths = createAsyncThunk<
  UserColumnWidths,
  UserColumnWidths,
  { rejectValue: string }
>('users/saveUserColumnWidths', async (widths, { rejectWithValue }) => {
  try {
    const body = JSON.stringify(widths);
    return await apiFetch<UserColumnWidths>(`${BASE}/columns`, { method: 'PUT', body });
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    goTo: (state, action: PayloadAction<number>) => {
      state.page = Math.max(0, Math.min(action.payload, state.totalPages - 1));
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload;
      state.page = 0;
    },
    setFilter: (state, action: PayloadAction<UserFilter>) => {
      state.filter = action.payload;
      state.page = 0;
    },
    toggleSort: (state, action: PayloadAction<UserSortKey>) => {
      state.sort = cycleSort(state.sort, action.payload);
      state.page = 0;
    },
    switchSort: (state, action: PayloadAction<UserSortKey>) => {
      state.sort = keepDirSort(state.sort, action.payload);
      state.page = 0;
    },
    setColumnWidths: (state, action: PayloadAction<UserColumnWidths>) => {
      state.columnWidths = action.payload;
    },
    clearFines: (state) => {
      state.fines = [];
      state.finesLoading = false;
      state.finesError = '';
      state.forgivingId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        const { users, page, totalPages, total, filters } = action.payload;
        state.users = users;
        state.page = page;
        state.totalPages = totalPages;
        state.total = total;
        state.filters = filters;
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.loading = false;
      })
      .addCase(promoteUser.pending, (state, action) => {
        state.changingId = action.meta.arg;
      })
      .addCase(promoteUser.fulfilled, (state) => {
        state.changingId = null;
      })
      .addCase(promoteUser.rejected, (state) => {
        state.changingId = null;
      })
      .addCase(demoteUser.pending, (state, action) => {
        state.changingId = action.meta.arg;
      })
      .addCase(demoteUser.fulfilled, (state) => {
        state.changingId = null;
      })
      .addCase(demoteUser.rejected, (state) => {
        state.changingId = null;
      })
      .addCase(deleteUser.pending, (state, action) => {
        state.changingId = action.meta.arg;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.changingId = null;
      })
      .addCase(deleteUser.rejected, (state) => {
        state.changingId = null;
      })
      .addCase(fetchFines.pending, (state) => {
        state.fines = [];
        state.finesLoading = true;
        state.finesError = '';
      })
      .addCase(fetchFines.fulfilled, (state, action) => {
        state.fines = action.payload;
        state.finesLoading = false;
      })
      .addCase(fetchFines.rejected, (state, action) => {
        state.finesError = action.payload ?? errorMessage(action.error);
        state.finesLoading = false;
      })
      .addCase(forgiveFine.pending, (state, action) => {
        state.forgivingId = action.meta.arg.loanId;
        state.finesError = '';
      })
      .addCase(forgiveFine.fulfilled, (state, action) => {
        state.fines = action.payload;
        state.forgivingId = null;
      })
      .addCase(forgiveFine.rejected, (state, action) => {
        state.finesError = action.payload ?? errorMessage(action.error);
        state.forgivingId = null;
      })
      .addCase(fetchUserColumnWidths.fulfilled, (state, action) => {
        if (action.payload) {
          state.columnWidths = action.payload;
        }
      });
  },
});

export const { goTo, setSize, setFilter, toggleSort, switchSort, setColumnWidths, clearFines } =
  usersSlice.actions;

export const selectUsers = (state: State) => state.users;

export const usersReducer = usersSlice.reducer;
