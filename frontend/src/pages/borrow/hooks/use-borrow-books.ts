import {
  BorrowFilter,
  BorrowSortKey,
  clearFlash,
  fetchBorrowBooks,
  goTo,
  selectBorrow,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
} from '@/store/borrow-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotifications } from '@/store/notification-slice';
import { useCallback, useEffect, useRef } from 'react';

const useBorrowBooks = () => {
  const dispatch = useAppDispatch();
  const borrow = useAppSelector(selectBorrow);
  const { lastReceivedId } = useAppSelector(selectNotifications);
  const seenId = useRef(lastReceivedId);
  const { page, size, sort, filter } = borrow;

  useEffect(() => {
    dispatch(fetchBorrowBooks());
  }, [dispatch, page, size, sort, filter]);

  const reload = useCallback(() => {
    dispatch(fetchBorrowBooks());
  }, [dispatch]);

  useEffect(() => {
    if (lastReceivedId !== seenId.current) {
      seenId.current = lastReceivedId;
      reload();
    }
  }, [lastReceivedId, reload]);

  return {
    ...borrow,
    goTo: (target: number) => dispatch(goTo(target)),
    setSize: (value: number) => dispatch(setSize(value)),
    applyFilter: (value: BorrowFilter) => dispatch(setFilter(value)),
    toggleSort: (key: BorrowSortKey) => dispatch(toggleSort(key)),
    switchSort: (key: BorrowSortKey) => dispatch(switchSort(key)),
    clearFlash: () => dispatch(clearFlash()),
    reload,
  };
};

export default useBorrowBooks;
