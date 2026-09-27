import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotifications } from '@/store/notification-slice';
import {
  fetchReturnLoans,
  goTo,
  ReturnFilter,
  ReturnSortKey,
  selectReturns,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
} from '@/store/return-slice';
import { useCallback, useEffect, useRef } from 'react';

const useReturnLoans = () => {
  const dispatch = useAppDispatch();
  const returns = useAppSelector(selectReturns);
  const { lastReceivedId } = useAppSelector(selectNotifications);
  const seenId = useRef(lastReceivedId);
  const { page, size, sort, filter } = returns;

  useEffect(() => {
    dispatch(fetchReturnLoans());
  }, [dispatch, page, size, sort, filter]);

  const reload = useCallback(() => {
    dispatch(fetchReturnLoans());
  }, [dispatch]);

  useEffect(() => {
    if (lastReceivedId !== seenId.current) {
      seenId.current = lastReceivedId;
      reload();
    }
  }, [lastReceivedId, reload]);

  return {
    ...returns,
    goTo: (target: number) => dispatch(goTo(target)),
    setSize: (value: number) => dispatch(setSize(value)),
    applyFilter: (value: ReturnFilter) => dispatch(setFilter(value)),
    toggleSort: (key: ReturnSortKey) => dispatch(toggleSort(key)),
    switchSort: (key: ReturnSortKey) => dispatch(switchSort(key)),
    reload,
  };
};

export default useReturnLoans;
