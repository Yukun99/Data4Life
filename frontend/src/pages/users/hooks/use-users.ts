import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchUserColumnWidths,
  fetchUsers,
  goTo,
  saveUserColumnWidths,
  selectUsers,
  setColumnWidths,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
  UserColumnWidths,
  UserFilter,
  UserSortKey,
} from '@/store/users-slice';
import { useCallback, useEffect } from 'react';

const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const { page, size, sort, filter } = users;

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch, page, size, sort, filter]);

  useEffect(() => {
    dispatch(fetchUserColumnWidths());
  }, [dispatch]);

  const reload = useCallback(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  return {
    ...users,
    goTo: (target: number) => dispatch(goTo(target)),
    setSize: (value: number) => dispatch(setSize(value)),
    applyFilter: (value: UserFilter) => dispatch(setFilter(value)),
    toggleSort: (key: UserSortKey) => dispatch(toggleSort(key)),
    switchSort: (key: UserSortKey) => dispatch(switchSort(key)),
    setWidths: (next: UserColumnWidths) => dispatch(setColumnWidths(next)),
    saveWidths: (next: UserColumnWidths) => dispatch(saveUserColumnWidths(next)),
    reload,
  };
};

export default useUsers;
