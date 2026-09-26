import { createStore } from '@/store/store';
import { User } from '@/store/user-slice';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';

type WithStoreParams = {
  user?: User | null;
  loading?: boolean;
};

/** Wraps a UI in a fresh store preloaded with the given user; returns both. */
const withStore = (ui: ReactNode, { user = null, loading = false }: WithStoreParams = {}) => {
  const store = createStore({ user: { user, loading } });
  return { store, ui: <Provider store={store}>{ui}</Provider> };
};

export default withStore;
