import { apiFetch, errorMessage } from '@/common/utils/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  admin: boolean;
};

export type UserState = {
  user: User | null;
  loading: boolean;
};

type LoginParams = {
  email: string;
  password: string;
};

const initialState: UserState = { user: null, loading: true };

export const fetchMe = createAsyncThunk('user/fetchMe', () => apiFetch<User>('/api/auth/me'));

export const login = createAsyncThunk<User, LoginParams, { rejectValue: string }>(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const body = JSON.stringify(credentials);
      return await apiFetch<User>('/api/auth/login', { method: 'POST', body });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const logout = createAsyncThunk('user/logout', async () => {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

type State = { user: UserState };

export const selectUser = (state: State) => state.user.user;
export const selectUserLoading = (state: State) => state.user.loading;
export const selectIsAdmin = (state: State) => !!state.user.user?.admin;

export const userReducer = userSlice.reducer;
