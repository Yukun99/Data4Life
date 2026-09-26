import {
  BorrowFilter,
  BorrowSortKey,
  fetchBorrowBooks,
  goTo,
  selectBorrow,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
} from '@/store/borrow-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCallback, useEffect } from 'react';

const useBorrowBooks = () => {
  const dispatch = useAppDispatch();
  const borrow = useAppSelector(selectBorrow);
  const { page, size, sort, filter } = borrow;

  useEffect(() => {
    dispatch(fetchBorrowBooks());
  }, [dispatch, page, size, sort, filter]);

  const reload = useCallback(() => {
    dispatch(fetchBorrowBooks());
  }, [dispatch]);

  return {
    ...borrow,
    goTo: (target: number) => dispatch(goTo(target)),
    setSize: (value: number) => dispatch(setSize(value)),
    applyFilter: (value: BorrowFilter) => dispatch(setFilter(value)),
    toggleSort: (key: BorrowSortKey) => dispatch(toggleSort(key)),
    switchSort: (key: BorrowSortKey) => dispatch(switchSort(key)),
    reload,
  };
};

export default useBorrowBooks;
