import { apiFetch, errorMessage } from '@/common/utils/api';
import { deleteAccount, login, logout } from '@/store/user-slice';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'AVAILABLE' | 'REMOVED_UNPAID' | 'REMOVED_OVERDUE';

export type Notification = {
  id: number;
  type: NotificationType;
  isbn: string;
  title: string;
  createdAt: string;
  read: boolean;
};

export type NotificationsResponse = {
  items: Notification[];
  hasMore: boolean;
};

export type UnreadResponse = {
  count: number;
};

export type NotificationState = {
  items: Notification[];
  hasMore: boolean;
  loading: boolean;
  error: string;
  unread: number;
  lastReceivedId: number | null;
};

const initialState: NotificationState = {
  items: [],
  hasMore: false,
  loading: false,
  error: '',
  unread: 0,
  lastReceivedId: null,
};

type State = { notifications: NotificationState };

const BASE = '/api/notifications';

export const fetchNotifications = createAsyncThunk<
  NotificationsResponse,
  void,
  { rejectValue: string }
>('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<NotificationsResponse>(BASE);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const fetchMoreNotifications = createAsyncThunk<
  NotificationsResponse,
  void,
  { state: State; rejectValue: string }
>('notifications/fetchMore', async (_, { getState, rejectWithValue }) => {
  try {
    const { items } = getState().notifications;
    const last = items[items.length - 1];
    return await apiFetch<NotificationsResponse>(last ? `${BASE}?before=${last.id}` : BASE);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const fetchUnreadCount = createAsyncThunk<UnreadResponse, void, { rejectValue: string }>(
  'notifications/fetchUnread',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<UnreadResponse>(`${BASE}/unread`);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const markRead = createAsyncThunk<UnreadResponse, number, { rejectValue: string }>(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<UnreadResponse>(`${BASE}/${id}/read`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const markAllRead = createAsyncThunk<UnreadResponse, void, { rejectValue: string }>(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<UnreadResponse>(`${BASE}/read-all`, { method: 'POST' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteNotification = createAsyncThunk<UnreadResponse, number, { rejectValue: string }>(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<UnreadResponse>(`${BASE}/${id}`, { method: 'DELETE' });
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteAllNotifications = createAsyncThunk<
  UnreadResponse,
  void,
  { rejectValue: string }
>('notifications/deleteAll', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<UnreadResponse>(BASE, { method: 'DELETE' });
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    received: (state, action: PayloadAction<Notification>) => {
      const item = action.payload;
      state.lastReceivedId = item.id;
      if (state.items.some(({ id }) => id === item.id)) {
        return;
      }
      state.items.unshift(item);
      if (!item.read) {
        state.unread += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.hasMore = action.payload.hasMore;
        state.loading = false;
      })
      .addCase(fetchMoreNotifications.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchMoreNotifications.fulfilled, (state, action) => {
        const known = new Set(state.items.map(({ id }) => id));
        state.items.push(...action.payload.items.filter(({ id }) => !known.has(id)));
        state.hasMore = action.payload.hasMore;
        state.loading = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unread = action.payload.count;
      })
      .addCase(markRead.fulfilled, (state, action) => {
        const item = state.items.find(({ id }) => id === action.meta.arg);
        if (item) {
          item.read = true;
        }
        state.unread = action.payload.count;
      })
      .addCase(markAllRead.fulfilled, (state, action) => {
        state.items.forEach((item) => {
          item.read = true;
        });
        state.unread = action.payload.count;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter(({ id }) => id !== action.meta.arg);
        state.unread = action.payload.count;
      })
      .addCase(deleteAllNotifications.fulfilled, (state, action) => {
        state.items = [];
        state.hasMore = false;
        state.unread = action.payload.count;
      })
      .addCase(login.fulfilled, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(deleteAccount.fulfilled, () => initialState);
    for (const thunk of [fetchNotifications, fetchMoreNotifications]) {
      builder.addCase(thunk.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
        state.loading = false;
      });
    }
    for (const thunk of [markRead, markAllRead, deleteNotification, deleteAllNotifications]) {
      builder.addCase(thunk.rejected, (state, action) => {
        state.error = action.payload ?? errorMessage(action.error);
      });
    }
  },
});

export const { received } = notificationSlice.actions;

export const selectNotifications = (state: State) => state.notifications;

export const notificationReducer = notificationSlice.reducer;
